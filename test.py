import os
from openai import OpenAI

# --- Configuration ---
API_KEY = "your_api_key"  # Your Atlas Cloud API key
BASE_URL = "https://api.atlascloud.ai/v1"
MODEL = "openai/gpt-oss-20b"

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
response = client.chat.completions.create(
    model=MODEL,
    messages=[
    {
        "role": "user",
        "content": "hello"
    }
],
    max_tokens=64000,
    temperature=1
)
content = response.choices[0].message.content
print(content)
