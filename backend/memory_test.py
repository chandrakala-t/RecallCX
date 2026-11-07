
import os
from dotenv import load_dotenv
from hindsight_client import Hindsight

# Load environment variables
load_dotenv()

# Read credentials
api_key = os.getenv("HINDSIGHT_API_KEY")
base_url = os.getenv("HINDSIGHT_BASE_URL")
bank_id = os.getenv("HINDSIGHT_BANK_ID")

# Connect to Hindsight
client = Hindsight(
    base_url=base_url,
    api_key=api_key
)

try:
    print("\n--- RECALLCX MEMORY TEST ---")

    # Fictional customer support interaction
    customer_complaint = """
    Customer ID: C101
    Product: Wireless Headphones
    Issue: Headphones stopped working after two days.
    Customer Request: Replacement.
    Previous Action: Customer contacted support.
    """

    # Step 1: Store customer interaction
    print("\nStoring customer interaction...")

    client.retain(
        bank_id=bank_id,
        content=customer_complaint,
        context="Customer support ticket C101"
    )

    print("Customer memory stored successfully!")

    # Step 2: Retrieve customer information
    print("\nRetrieving customer memory...")

    result = client.recall(
        bank_id=bank_id,
        query="What issue did customer C101 report and what solution did they request?"
    )

    # Step 3: Display retrieved memories
    print("\n--- RETRIEVED MEMORIES ---")

    if result.results:
        for memory in result.results:
            print(memory.text)
    else:
        print("No relevant memories found.")

except Exception as error:
    print("\nMemory operation failed:")
    print(error)

finally:
    client.close()
