from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS

from agents.fact_check_agent import fact_check
from agents.news_agent import news_check
from agents.bias_agent import analyze_bias
from agents.summary_agent import summarize
from agents.final_judge import final_verdict
from agents.headline_agent import extract_headlines

# Flask App ---------------------------------------------
app = Flask(__name__)
CORS(app)  # Allow Chrome extension + HTML frontend


# Handlers ----------------------------------------------

def handle_text_mode(text):
    """Fast, safe text-only analysis."""
    summary = summarize(text)
    fact_data = fact_check(text)
    bias = analyze_bias(text)

    verdict = final_verdict(
        text=text,
        fact_data=fact_data,
        news_data={},   # Skip slow news API here
        bias_data=bias,
        summary=summary
    )
    return verdict


def handle_page_mode(url):
    """Extract headlines and analyze each."""
    headlines = extract_headlines(url)
    results = []

    for h in headlines:
        summary = summarize(h)
        fact_data = fact_check(h)
        bias = analyze_bias(h)

        verdict = final_verdict(
            text=h,
            fact_data=fact_data,
            news_data={},
            bias_data=bias,
            summary=summary
        )

        results.append({
            "headline": h,
            "verdict": verdict.get("verdict"),
            "confidence": verdict.get("confidence"),
            "summary": verdict.get("safe_summary")
        })

    return {
        "url": url,
        "headline_count": len(headlines),
        "results": results
    }


# API Route ----------------------------------------------
@app.post("/check")
def check():
    data = request.json
    mode = data.get("mode")

    if mode == "text":
        text = data.get("text", "")
        print("TEXT MODE REQUEST:", text)
        return jsonify(handle_text_mode(text))

    if mode == "page":
        url = data.get("url", "")
        print("PAGE MODE REQUEST:", url)
        return jsonify(handle_page_mode(url))

    return jsonify({"error": "Invalid mode"}), 400


# Optional health check ---------------------------------
@app.get("/")
def home():
    return {"status": "OK", "message": "Misinfo AI Backend Running"}


# Run Server ---------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
