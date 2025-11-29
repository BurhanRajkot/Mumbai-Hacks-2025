from flask import Flask, request, jsonify
from flask_cors import CORS

from agents.fact_check_agent import fact_check
from agents.news_agent import news_check
from agents.bias_agent import analyze_bias
from agents.summary_agent import summarize
from agents.final_judge import final_verdict

app = Flask(__name__)

# Enable CORS AFTER app is created
CORS(app)

@app.post("/check")
def check():
    data = request.json
    text = data.get("text", "")
    url = data.get("url", "")

    # Run agents
    fact_data = fact_check(text)
    news_data = news_check(text)
    bias_data = analyze_bias(text)
    summary = summarize(text)

    verdict = final_verdict(
        text=text,
        fact_data=fact_data,
        news_data=news_data,
        bias_data=bias_data,
        summary=summary
    )

    return jsonify(verdict)

# Important: run on 0.0.0.0 for browser testing
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
