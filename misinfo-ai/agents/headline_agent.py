import requests
from bs4 import BeautifulSoup

def extract_headlines(url):
    try:
        r = requests.get(url, timeout=5)
        soup = BeautifulSoup(r.text, "html.parser")

        tags = soup.find_all(["h1", "h2", "h3"])

        headlines = [h.get_text(strip=True)[:200] for h in tags]
        return headlines[:10]  # limit to avoid overload

    except Exception:
        return []
