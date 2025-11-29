from services.openai_service import ask_gpt
import json

def analyze_bias(text):
    """
    Uses GPT to analyze emotional manipulation, bias, and misleading wording.
    """
    prompt = f"""
    Analyze the following text for emotional manipulation, political bias, sensationalism,
    and misleading framing.

    TEXT:
    {text}

    Respond ONLY in valid JSON:
    {{
        "bias_score": 0 to 1,
        "emotion_level": "low | medium | high",
        "manipulative_phrases": [],
        "logical_fallacies": [],
        "explanation": ""
    }}
    """

    raw = ask_gpt(prompt)

    try:
        return json.loads(raw)
    except:
        return {"error": "Invalid GPT JSON", "raw": raw}
