import os
import requests

GROQ_KEY = os.getenv("GROQ_KEY")

def ask_gpt(prompt):
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2
            }
        )

        data = response.json()

        if "error" in data:
            print("GROQ ERROR:", data)
            return f"ERROR_FROM_GROQ: {data['error']['message']}"

        return data["choices"][0]["message"]["content"]

    except Exception as e:
        return f"CLIENT_ERROR: {str(e)}"
