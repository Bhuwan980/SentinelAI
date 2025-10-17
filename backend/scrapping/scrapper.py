import logging
import aiohttp
from typing import List, Dict, Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

async def fetch_images(img_url: str, sources: List[str], serpapi_key: str) -> List[Dict]:
    """
    Fetch similar images using SerpAPI Google Reverse Image Search.
    
    Args:
        img_url: Public URL of the image to search
        sources: List of sources (must include 'serpapi')
        serpapi_key: SerpAPI authentication key
        
    Returns:
        List of dictionaries containing image match data
        
    Raises:
        HTTPException: If SerpAPI request fails
    """
    if not serpapi_key:
        logger.error("❌ SerpAPI key is missing")
        raise HTTPException(status_code=500, detail="SerpAPI key not configured")
    
    if "serpapi" not in sources:
        logger.error("❌ SerpAPI not in sources list")
        raise HTTPException(status_code=400, detail="Invalid source specified")

    params = {
        "engine": "google_reverse_image",
        "image_url": img_url,
        "api_key": serpapi_key
    }
    url = "https://serpapi.com/search"

    async with aiohttp.ClientSession() as session:
        try:
            logger.info(f"🔍 Sending SerpAPI request with image_url: {img_url}")
            
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=30)) as response:
                response_text = await response.text()
                
                if response.status != 200:
                    logger.error(
                        f"❌ SerpAPI request failed: status={response.status}, "
                        f"url={img_url}, response={response_text[:500]}"
                    )
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"SerpAPI error: {response.status} - {response_text[:200]}"
                    )
                
                try:
                    data = await response.json()
                except Exception as json_error:
                    logger.error(f"❌ Failed to parse SerpAPI JSON response: {json_error}")
                    logger.error(f"Response text: {response_text[:500]}")
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to parse SerpAPI response"
                    )
                
                # Log the full response structure for debugging
                logger.info(f"📊 SerpAPI response keys: {list(data.keys())}")
                
                # CRITICAL FIX: Use "image_results" instead of "inline_images"
                # SerpAPI Google Reverse Image returns results in "image_results"
                images = data.get("image_results", [])
                
                if not images:
                    logger.warning(f"⚠️ No images found in 'image_results'. Checking alternative fields...")
                    # Fallback: check other possible fields
                    images = data.get("inline_images", []) or data.get("images", [])
                
                if not images:
                    logger.warning(f"⚠️ No similar images found by SerpAPI for URL: {img_url}")
                    return []
                
                # Process and normalize results
                result = []
                for idx, img in enumerate(images):
                    try:
                        # Extract image URL - try multiple fields
                        image_url = (
                            img.get("original") or 
                            img.get("source") or 
                            img.get("thumbnail")
                        )
                        
                        if not image_url:
                            logger.warning(f"⚠️ Image {idx} has no URL, skipping")
                            continue
                        
                        # Extract thumbnail for downloading
                        thumbnail = img.get("thumbnail") or img.get("source")
                        
                        result.append({
                            "url": image_url,
                            "content": thumbnail,  # This will be downloaded later
                            "title": img.get("title", "Untitled"),
                            "caption": img.get("source_name") or img.get("link", ""),
                            "page_url": img.get("link", ""),
                            "similarity": img.get("similarity_score", 0.0),
                            "text_similarity": 0.0,
                            "position": img.get("position", idx)
                        })
                        
                    except Exception as img_error:
                        logger.warning(f"⚠️ Failed to process image {idx}: {img_error}")
                        continue
                
                logger.info(f"✅ Fetched {len(result)} images from SerpAPI for URL: {img_url}")
                
                if not result:
                    logger.warning(f"⚠️ Processed 0 valid images from {len(images)} raw results")
                
                return result
                
        except aiohttp.ClientError as e:
            logger.exception(f"❌ SerpAPI HTTP request failed for url={img_url}")
            raise HTTPException(
                status_code=500, 
                detail=f"SerpAPI request error: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.exception(f"❌ Unexpected error in fetch_images for url={img_url}")
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error: {str(e)}"
            )


async def download_image_content(image_url: str) -> Optional[bytes]:
    """
    Download image content from a URL.
    
    Args:
        image_url: URL of the image to download
        
    Returns:
        Image bytes or None if download fails
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                image_url, 
                headers=headers, 
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:
                if response.status == 200:
                    content = await response.read()
                    logger.info(f"✅ Downloaded image: {image_url} ({len(content)} bytes)")
                    return content
                else:
                    logger.warning(f"⚠️ Failed to download image {image_url}: status {response.status}")
                    return None
                    
    except Exception as e:
        logger.warning(f"⚠️ Error downloading image {image_url}: {e}")
        return None