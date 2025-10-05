from scrapper import fetch_image_urls

if __name__ == "__main__":
    keyword = "zoro one piece"
    sources = ["google", "bing"]  # you can add "baidu", "flickr" if needed

    print(f"Fetching images for keyword: '{keyword}' from sources: {sources}")
    urls = fetch_image_urls(keyword=keyword, sources=sources, max_num=10)

    print(f"Total images fetched: {len(urls)}")
    for i, url in enumerate(urls):
        print(f"{i+1}: {url}")