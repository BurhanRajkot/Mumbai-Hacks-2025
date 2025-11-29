from services.openai_service import ask_gpt

def summarize(text):
    """
    Summarizes the content in a neutral, fact-focused way.
    """
    prompt = f"Summarize this text neutrally and concisely:\n\n{text}"
    return ask_gpt(prompt)
