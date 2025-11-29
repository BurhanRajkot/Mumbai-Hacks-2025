from services.openai_service import ask_gpt
import json

def final_verdict(text, fact_data, news_data, bias_data, summary):
    """
    Supervising agent that combines all agent outputs
    and produces the final misinformation verdict.
    """

    prompt = f"""
You are a misinformation evaluation supervisor.

Your task:
- Combine all provided agent outputs.
- Produce a final verdict using evidence.
- RESPOND ONLY WITH VALID JSON.
- DO NOT use backticks.
- DO NOT use code fences.
- DO NOT add explanations outside JSON.
- JSON must be the ONLY output.

Input Data:

CLAIM:
{text}

FACT-CHECK DATA:
{fact_data}

NEWS COVERAGE:
{news_data}

BIAS ANALYSIS:
{bias_data}

SUMMARY:
{summary}

Expected JSON response format (return EXACTLY this structure):

{{
  "verdict": "True | False | Misleading | Unverified",
  "confidence": 0.0,
  "red_flags": [],
  "supporting_evidence": [],
  "safe_summary": ""
}}
"""

    # Call model
    raw = ask_gpt(prompt)

    # Clean model output (remove accidental backticks / fences)
    if raw is None:
        return {"error": "No response from model"}

    cleaned = (
        raw.replace("```json", "")
           .replace("```", "")
           .replace("`", "")
           .strip()
    )

    # Try to parse JSON
    try:
        parsed = json.loads(cleaned)
        return parsed

    except Exception:
        # Debug fallback
        return {
            "error": "Invalid GPT JSON",
            "raw": cleaned
        }
