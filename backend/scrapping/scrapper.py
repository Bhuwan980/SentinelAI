# scrapping/scrapper.py
"""
Enhanced SerpAPI scraper with complete data extraction.
Extracts ALL important fields including page URLs, commercial detection, and metadata.
Updated: 2025-01-20
"""

import logging
import aiohttp
from typing import List, Dict, Optional
from fastapi import HTTPException
from urllib.parse import urlparse

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def fetch_images(img_url: str, sources: List[str], serpapi_key: str) -> List[Dict]:
    """
    Fetch similar images using SerpAPI Google Reverse Image Search.
    
    Returns comprehensive data including:
    - Page URLs where images are used
    - Direct image URLs
    - Commercial detection (products, prices)
    - Complete metadata
    
    Args:
        img_url: Public URL of the image to search
        sources: List of sources (must include 'serpapi')
        serpapi_key: SerpAPI authentication key
        
    Returns:
        List of dictionaries containing complete match data
        
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
                
                logger.info(f"📊 SerpAPI response keys: {list(data.keys())}")
                
                # Extract best_guess for context
                best_guess = data.get("best_guess", "")
                
                # Get image results (primary source)
                images = data.get("image_results", [])
                
                if not images:
                    logger.warning(f"⚠️ No images found in 'image_results'. Checking alternatives...")
                    # Fallback to alternative fields
                    images = data.get("inline_images", []) or data.get("images", [])
                
                # Get pages including matching images (secondary source)
                pages_with_images = data.get("pages_including_matching_images", [])
                
                if not images and not pages_with_images:
                    logger.warning(f"⚠️ No similar images found by SerpAPI for URL: {img_url}")
                    return []
                
                # Process all results
                result = []
                
                # Process image_results (higher priority)
                for idx, img in enumerate(images):
                    processed = _process_image_result(img, idx, best_guess, data)
                    if processed:
                        result.append(processed)
                
                # Process pages_including_matching_images
                for idx, page in enumerate(pages_with_images):
                    processed = _process_page_result(page, idx + len(images), best_guess, data)
                    if processed:
                        result.append(processed)
                
                logger.info(f"✅ Fetched {len(result)} results from SerpAPI for URL: {img_url}")
                
                if not result:
                    logger.warning(f"⚠️ Processed 0 valid results from {len(images)} raw results")
                
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


def _process_image_result(img: Dict, idx: int, best_guess: str, full_response: Dict) -> Optional[Dict]:
    """
    Process a single image result from SerpAPI image_results.
    
    Extracts all critical fields:
    - Page URL (where the image is used)
    - Image URL (direct link to image)
    - Commercial detection
    - Metadata
    
    Returns a comprehensive dictionary with all fields.
    """
    try:
        # ===== EXTRACT URLS =====
        # Image URL - try multiple fields in order of preference
        image_url = img.get("original") or img.get("source") or img.get("thumbnail")
        
        # Page URL - THE MOST IMPORTANT FIELD (where the image is actually used)
        page_url = img.get("link", "")
        
        # Thumbnail for preview
        thumbnail = img.get("thumbnail") or img.get("source")
        
        if not image_url:
            logger.warning(f"⚠️ Image {idx} has no URL, skipping")
            return None
        
        # ===== EXTRACT DOMAIN INFO =====
        domain = ""
        source_name = ""
        if page_url:
            try:
                parsed = urlparse(page_url)
                domain = parsed.netloc
                # Clean domain name for display
                source_name = domain.replace("www.", "").split(".")[0].title()
            except Exception as parse_error:
                logger.warning(f"⚠️ Failed to parse domain from {page_url}: {parse_error}")
        
        # Override with SerpAPI's source_name if available
        if img.get("source_name"):
            source_name = img.get("source_name")
        
        # ===== COMMERCIAL DETECTION =====
        is_product = img.get("is_product", False)
        product_price = img.get("price")
        product_currency = img.get("currency")
        
        # Detect marketplace from domain
        marketplace = None
        if is_product:
            marketplace = source_name
            # Detect common marketplaces
            domain_lower = domain.lower()
            if "etsy" in domain_lower:
                marketplace = "Etsy"
            elif "amazon" in domain_lower:
                marketplace = "Amazon"
            elif "ebay" in domain_lower:
                marketplace = "eBay"
            elif "shopify" in domain_lower:
                marketplace = "Shopify"
        
        # ===== BUILD COMPREHENSIVE RESULT =====
        result = {
            # ===== TIER 1: CRITICAL =====
            "page_url": page_url,                              # ✅ WHERE image is used (MOST IMPORTANT!)
            "suspected_image_url": image_url,                  # ✅ Direct image URL
            "thumbnail_url": thumbnail,                        # ✅ Preview
            "source_domain": domain,                           # ✅ example.com
            "source_name": source_name,                        # ✅ Website name
            "page_title": img.get("title", "Untitled"),       # ✅ Title
            
            # ===== COMMERCIAL DETECTION =====
            "is_product": is_product,                          # ✅ Is it for sale?
            "product_price": product_price,                    # ✅ Price
            "product_currency": product_currency,              # ✅ Currency
            "marketplace": marketplace,                        # ✅ Platform
            
            # ===== SIMILARITY & POSITION =====
            "similarity_score": float(img.get("similarity", 0.85)),  # Default high similarity
            "serp_position": img.get("position", idx + 1),    # ✅ Search rank
            
            # ===== TIER 2: METADATA =====
            "source_logo": img.get("source_logo"),            # ✅ Favicon
            "best_guess": best_guess,                          # ✅ Google's identification
            
            # ===== TIER 3: RAW DATA =====
            "raw_serp_data": img,                              # ✅ Complete original data
            
            # ===== LEGACY FIELDS (for backward compatibility) =====
            "url": image_url,
            "content": thumbnail,
            "title": img.get("title", "Untitled"),
            "caption": source_name or page_url,
            "similarity": float(img.get("similarity", 0.85)),
            "text_similarity": 0.0,
            "position": img.get("position", idx)
        }
        
        return result
        
    except Exception as e:
        logger.warning(f"⚠️ Failed to process image {idx}: {e}")
        return None


def _process_page_result(page: Dict, idx: int, best_guess: str, full_response: Dict) -> Optional[Dict]:
    """
    Process a page result from pages_including_matching_images.
    
    These are webpages that contain matching images.
    """
    try:
        page_url = page.get("link", "")
        thumbnail = page.get("thumbnail", "")
        
        if not page_url:
            logger.warning(f"⚠️ Page {idx} has no URL, skipping")
            return None
        
        # ===== EXTRACT DOMAIN INFO =====
        domain = ""
        source_name = ""
        if page_url:
            try:
                parsed = urlparse(page_url)
                domain = parsed.netloc
                source_name = domain.replace("www.", "").split(".")[0].title()
            except:
                pass
        
        # Override with page's source if available
        if page.get("source"):
            source_name = page.get("source")
        
        # ===== BUILD RESULT =====
        result = {
            # ===== TIER 1: CRITICAL =====
            "page_url": page_url,                              # ✅ WHERE image is used
            "suspected_image_url": thumbnail or page_url,      # Best guess for image
            "thumbnail_url": thumbnail,                        # ✅ Preview
            "source_domain": domain,                           # ✅ Domain
            "source_name": source_name,                        # ✅ Website name
            "page_title": page.get("title", "Untitled"),      # ✅ Title
            
            # ===== CONTEXT =====
            "page_snippet": page.get("snippet"),               # ✅ Description
            
            # ===== COMMERCIAL DETECTION =====
            "is_product": False,                               # Pages usually aren't direct products
            "product_price": None,
            "product_currency": None,
            "marketplace": None,
            
            # ===== SIMILARITY & POSITION =====
            "similarity_score": 0.80,                          # Assume good similarity
            "serp_position": idx + 1,
            
            # ===== METADATA =====
            "best_guess": best_guess,
            
            # ===== RAW DATA =====
            "raw_serp_data": page,
            
            # ===== LEGACY FIELDS =====
            "url": thumbnail or page_url,
            "content": thumbnail,
            "title": page.get("title", "Untitled"),
            "caption": source_name,
            "similarity": 0.80,
            "text_similarity": 0.0,
            "position": idx
        }
        
        return result
        
    except Exception as e:
        logger.warning(f"⚠️ Failed to process page {idx}: {e}")
        return None


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


def extract_domain(url: str) -> str:
    """Helper function to extract clean domain from URL."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.replace("www.", "")
        return domain
    except:
        return ""