import os
import requests

FACTCHECK_KEY = os.getenv("FACTCHECK_KEY")

def fact_check(text):
    """
    Uses Google Fact Check API to find similar claims.
    """
    try:
        url = (
            "https://factchecktools.googleapis.com/v1alpha1/claims:search"
            f"?query={text}&key={FACTCHECK_KEY}"
        )

        res = requests.get(url).json()

        return {
            "fact_check_results": res.get("claims", []),
            "raw": res
        }
    except Exception as e:
        return {"error": str(e)}
