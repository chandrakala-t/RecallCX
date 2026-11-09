RecallCX – AI-Powered Customer Support with Long-Term Memory

1. Introduction

RecallCX is an AI-powered customer support assistant designed to provide more continuous and context-aware customer interactions.

Traditional customer support systems often treat every conversation as a separate interaction. Customers may need to repeat information they have already shared.

RecallCX addresses this problem by integrating AI response generation with long-term memory. It retrieves relevant previous customer interactions and uses the available context to generate responses.

2. Problem Statement

Many AI customer support systems lack continuity between customer interactions. This can result in:

- Customers repeatedly explaining the same issue.
- Loss of useful information from previous conversations.
- Repetitive support experiences.
- Difficulty maintaining context across multiple interactions.

3. Proposed Solution

RecallCX combines a language model with a persistent memory system.

The application:
1. Receives a customer message and customer ID.
2. Retrieves relevant previous interactions from Hindsight.
3. Sends the current message and available memory context to Groq.
4. Generates an AI-powered response.
5. Stores the interaction for potential use in future conversations.
6. Returns the response to the frontend.

4. Key Features

- AI-powered customer response generation.
- Long-term customer memory integration.
- Retrieval of relevant previous interactions.
- Customer-specific memory tagging.
- REST API built using FastAPI.
- React-based frontend.
- Cloud backend deployment.


5. Technology Stack

Technology - Purpose 
React      - Frontend user interface 
Python     - Backend programming 
FastAPI    - REST API development 
Groq       - AI response generation 
Hindsight  - Long-term memory retrieval and storage 
Render     - Backend hosting 
GitHub     - Version control and collaboration 

6. System Architecture

Customer → React Frontend → FastAPI Backend

The backend coordinates two services:

- Hindsight: Retrieves relevant customer memories and stores interactions.
- Groq: Generates responses using the current message and available memory context.

The generated response is returned through FastAPI to the React frontend.

7. Backend API Endpoints

Base URL:

https://recallcx-backend.onrender.com

Method: Endpoint: Description 
GET: `/`: Root endpoint 
GET: `/health`: Backend health check 
POST: `/chat`: Processes a customer message 

Chat request example

```json
{
  "customer_id": "C101",
  "message": "My headphones are not working."
}
```

Chat response structure

```json
{
  "customer_id": "C101",
  "reply": "AI-generated response",
  "memory_used": false
}
```

The value of `memory_used` indicates whether retrieved memory context was available for the response.

API documentation:

https://recallcx-backend.onrender.com/docs

8. Project Setup

Prerequisites

- Python installed.
- Node.js and npm installed.
- Git installed.
- Required Groq and Hindsight credentials.

Backend setup

Clone the repository:

```bash
git clone https://github.com/chandrakala-t/RecallCX.git
cd RecallCX
```

Create and activate a virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

Install backend dependencies:

```powershell
cd backend
pip install -r requirements.txt
```

Configure the environment variables in a local `.env` file:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=your_configured_model
HINDSIGHT_API_KEY=your_hindsight_api_key
HINDSIGHT_BASE_URL=your_hindsight_base_url
HINDSIGHT_BANK_ID=your_hindsight_bank_id
```

Start the backend:

```powershell
uvicorn main:app --reload
```

The backend should be available at:

`http://127.0.0.1:8000`

Swagger documentation:

`http://127.0.0.1:8000/docs`

Frontend setup

Use the existing React frontend directory and its `package.json` scripts.

```bash
npm install
npm run dev
```

Configure the frontend API URL to point to the backend:

`https://recallcx-backend.onrender.com/chat`

9. Deployment

The backend is deployed using Render.

Backend URL:

https://recallcx-backend.onrender.com

API documentation:

https://recallcx-backend.onrender.com/docs

Sensitive credentials are configured through environment variables and should not be committed to GitHub.

10. Future Scope

- Support for multiple communication channels.
- Improved customer conversation management.
- Customer support analytics.
- Human-agent handoff.
- Enhanced memory relevance and management.
- Authentication and role-based access.
- More comprehensive automated testing.

11. Team

Project: RecallCX

Repository: https://github.com/chandrakala-t/RecallCX

Built collaboratively using modern AI, backend, frontend, and memory technologies.

12. Conclusion

RecallCX explores how long-term memory can improve AI-powered customer support. By combining language-model-based response generation with persistent customer interaction context, the project aims to make support conversations more continuous and reduce the need for customers to repeat previously shared information.