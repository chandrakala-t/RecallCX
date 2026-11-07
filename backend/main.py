
import os
import re
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import AsyncGroq
from hindsight_client import Hindsight


# Load environment variables from .env
load_dotenv()

GROQ_MODEL = os.getenv("GROQ_MODEL")
BANK_ID = os.getenv("HINDSIGHT_BANK_ID")

HINDSIGHT_BASE_URL = os.getenv("HINDSIGHT_BASE_URL")
HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY")


# Check required configuration
if not GROQ_MODEL or not os.getenv("GROQ_API_KEY"):
    raise RuntimeError("Groq configuration is missing.")

if not all([BANK_ID, HINDSIGHT_BASE_URL, HINDSIGHT_API_KEY]):
    raise RuntimeError("Hindsight configuration is missing.")


# Initialize AI and memory clients
groq_client = AsyncGroq()

hindsight_client = Hindsight(
    base_url=HINDSIGHT_BASE_URL,
    api_key=HINDSIGHT_API_KEY
)


# Close the Hindsight client when the server shuts down
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await hindsight_client.aclose()


app = FastAPI(
    title="RecallCX API",
    description="AI-powered customer support agent with memory",
    version="1.0.0",
    lifespan=lifespan
)


# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request structure
class ChatRequest(BaseModel):
    customer_id: str
    message: str


@app.get("/")
async def home():
    return {
        "message": "Welcome to RecallCX!",
        "status": "Backend is running"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "RecallCX Backend"
    }


@app.post("/chat")
async def chat(request: ChatRequest):

    customer_id = request.customer_id.strip()
    message = request.message.strip()

    if not customer_id or len(customer_id) > 40:
        raise HTTPException(
            status_code=400,
            detail="Invalid customer ID."
        )

    if not re.fullmatch(r"[A-Za-z0-9_-]+", customer_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid customer ID."
        )

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    # Create a separate memory tag for each customer
    customer_tag = f"customer:{customer_id}"

    # STEP 1: Retrieve this customer's previous memories
    try:
        memory_result = await hindsight_client.arecall(
            bank_id=BANK_ID,
            query=message,
            tags=[customer_tag],
            tags_match="any_strict",
            max_tokens=1200
        )

        memories = memory_result.results

        memory_context = "\n".join(
            f"- {memory.text}"
            for memory in memories[:5]
            if memory.text
        )

    except Exception as error:
        print("Hindsight recall error:", type(error).__name__)

        raise HTTPException(
            status_code=502,
            detail="Customer memory service is unavailable."
        )

    memory_used = bool(memory_context)

    # STEP 2: Generate a response using Groq and retrieved memories
    system_prompt = (
        "You are RecallCX, a polite and helpful customer support assistant. "
        "Give clear, concise and empathetic responses. "
        "Never claim an action has been completed unless it actually has. "
        "Never invent warranty terms, refunds or replacement approvals. "
    )

    if memory_context:
        system_prompt += (
            "\nRelevant previous interactions for this customer:\n"
            + memory_context
            + "\nUse these memories when relevant to the current question."
        )
    else:
        system_prompt += (
            "\nNo relevant previous memories were retrieved. "
            "Do not pretend to remember an earlier interaction."
        )

    try:
        response = await groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
        )

        reply = response.choices[0].message.content or ""

    except Exception as error:
        print("Groq error:", type(error).__name__)

        raise HTTPException(
            status_code=502,
            detail="Unable to generate an AI response right now."
        )

    # STEP 3: Save this interaction for the same customer
    try:
        await hindsight_client.aretain(
            bank_id=BANK_ID,
            content=(
                f"Customer message: {message}\n"
                f"Assistant response: {reply}"
            ),
            context="RecallCX customer support conversation",
            tags=[customer_tag]
        )

    except Exception as error:
        print("Hindsight retain error:", type(error).__name__)

        raise HTTPException(
            status_code=502,
            detail="The response could not be saved to customer memory."
        )

    # STEP 4: Return the response to React
    return {
        "customer_id": customer_id,
        "reply": reply,
        "memory_used": memory_used
    }
