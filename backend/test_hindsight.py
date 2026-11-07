import os
import httpx
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("HINDSIGHT_API_KEY")
base_url = os.getenv("HINDSIGHT_BASE_URL")

if not api_key or not base_url:
    raise ValueError("Missing Hindsight configuration!")

print("Checking Hindsight Cloud authentication...")

response = httpx.get(
    f"{base_url}/v1/default/banks",
    headers={
        "Authorization": f"Bearer {api_key}"
    },
    timeout=20
)

print("HTTP Status:", response.status_code)

if response.status_code == 200:
    print("Hindsight Cloud authentication successful!")
    print("We can access the memory bank API.")
elif response.status_code == 401:
    print("Authentication failed. Check your API key.")
elif response.status_code == 402:
    print("Account requires credits.")
else:
    print("Response:", response.text[:500])
