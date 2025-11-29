from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS

from agents.fact_check_agent import fact_check
from agents.news_agent import news_check
from agents.bias_agent import analyze_bias
from agents.summary_agent import summarize
from agents.final_judge import final_verdict

# Flask App ---------------------------------------------
app = Flask(__name__)
CORS(app)  # Allow Chrome extension + HTML frontend


# API Route ----------------------------------------------
@app.post("/check")
def check():
    data = request.json
    text = data.get("text", "")
    url = data.get("url", "")

    print("REQUEST RECEIVED:", text)

    # Run all agents
    fact_data = fact_check(text)
    news_data = news_check(text)
    bias_data = analyze_bias(text)
    summary = summarize(text)

    # Supervisor agent
    verdict = final_verdict(
        text=text,
        fact_data=fact_data,
        news_data=news_data,
        bias_data=bias_data,
        summary=summary
    )

    return jsonify(verdict)


# Optional health check route -----------------------------
@app.get("/")
def home():
    return {"status": "OK", "message": "Misinfo AI Backend Running"}


# Run Server ----------------------------------------------
if __name__ == "__main__":
    # 0.0.0.0 = accessible from Chrome extension
    app.run(host="0.0.0.0", port=5000, debug=True)
