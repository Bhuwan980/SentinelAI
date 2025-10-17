import requests

SERPAPI_KEY = "ac6fabac812413d89637e4f99dd5680ca7b97c0083cf7410c7694638b5b3a3b9"
SERPAPI_URL = "https://serpapi.com/search.json"

def query_serpapi_reverse_image(image_url: str) -> list:
    params = {
        "engine": "google_reverse_image",
        "image_url": image_url,
        "api_key": SERPAPI_KEY
    }
    try:
        response = requests.get(SERPAPI_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        print("Raw API Response:", data)  # Debug print
        results = data.get("image_results", [])
        return [
            {
                "image_url": img.get("original"),
                "page_url": img.get("link"),
                "title": img.get("title"),
                "thumbnail_url": img.get("thumbnail")
            }
            for img in results if img.get("original")
        ]
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}")
        return []
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    sample_image_url = "https://i.pinimg.com/736x/bf/f0/1d/bff01dd0ae186d938f1af8ba127f12bd.jpg"
    matches = query_serpapi_reverse_image(sample_image_url)
    for match in matches:
        print(f"Title: {match['title']}, Image URL: {match['image_url']}, Page URL: {match['page_url']}")