import os
import requests

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")

def news_check(text):
    """
    Checks if reputable news outlets have covered the same topic.
    """
    try:
        url = (
            f"https://newsapi.org/v2/everything?q={text}"
            f"&sortBy=relevancy&apiKey={NEWSAPI_KEY}"
        )
        res = requests.get(url).json()

        return {
            "total_articles": res.get("totalResults", 0),
            "top_sources": [a["source"]["name"] for a in res.get("articles", [])[:5]],
            "raw": res
        }
    except Exception as e:
        return {"error": str(e)}
