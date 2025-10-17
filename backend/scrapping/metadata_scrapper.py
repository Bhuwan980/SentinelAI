"""
Metadata scraper to extract information from suspected infringing pages.
Extracts: title, author, description, tags, Open Graph data, Twitter Cards, etc.
"""

import logging
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
from urllib.parse import urlparse
import re

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Request headers to avoid being blocked
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
}


def extract_page_metadata(url: str, timeout: int = 15) -> Dict:
    """
    Extract comprehensive metadata from a webpage.
    
    Args:
        url: URL of the page to scrape
        timeout: Request timeout in seconds
        
    Returns:
        Dictionary containing all extracted metadata
    """
    metadata = {
        'url': url,
        'domain': urlparse(url).netloc,
        'title': None,
        'description': None,
        'author': None,
        'keywords': [],
        'tags': [],
        'image_alt': None,
        'image_title': None,
        'copyright': None,
        'og_data': {},  # Open Graph
        'twitter_data': {},  # Twitter Cards
        'schema_data': {},  # Schema.org structured data
        'success': False,
        'error': None
    }
    
    try:
        logger.info(f"🔍 Scraping metadata from: {url}")
        
        response = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract basic metadata
        metadata.update(_extract_basic_meta(soup))
        
        # Extract Open Graph data
        metadata['og_data'] = _extract_open_graph(soup)
        
        # Extract Twitter Card data
        metadata['twitter_data'] = _extract_twitter_card(soup)
        
        # Extract Schema.org data
        metadata['schema_data'] = _extract_schema_org(soup)
        
        # Extract image-specific metadata
        metadata.update(_extract_image_metadata(soup, url))
        
        # Extract author information
        metadata['author'] = _extract_author(soup, metadata)
        
        # Extract tags/keywords
        metadata['tags'] = _extract_tags(soup, metadata)
        
        # Extract copyright info
        metadata['copyright'] = _extract_copyright(soup)
        
        metadata['success'] = True
        logger.info(f"✅ Successfully scraped metadata from {url}")
        
    except requests.Timeout:
        metadata['error'] = "Request timeout"
        logger.warning(f"⚠️ Timeout while scraping {url}")
    except requests.RequestException as e:
        metadata['error'] = f"Request failed: {str(e)}"
        logger.warning(f"⚠️ Failed to scrape {url}: {e}")
    except Exception as e:
        metadata['error'] = f"Parsing error: {str(e)}"
        logger.exception(f"❌ Error parsing {url}")
    
    return metadata


def _extract_basic_meta(soup: BeautifulSoup) -> Dict:
    """Extract basic meta tags."""
    data = {}
    
    # Title
    title_tag = soup.find('title')
    if title_tag:
        data['title'] = title_tag.get_text().strip()
    
    # Meta description
    desc_tag = soup.find('meta', attrs={'name': 'description'})
    if desc_tag:
        data['description'] = desc_tag.get('content', '').strip()
    
    # Meta keywords
    keywords_tag = soup.find('meta', attrs={'name': 'keywords'})
    if keywords_tag:
        keywords = keywords_tag.get('content', '')
        data['keywords'] = [k.strip() for k in keywords.split(',') if k.strip()]
    
    return data


def _extract_open_graph(soup: BeautifulSoup) -> Dict:
    """Extract Open Graph metadata."""
    og_data = {}
    
    og_tags = soup.find_all('meta', property=re.compile(r'^og:'))
    for tag in og_tags:
        prop = tag.get('property', '').replace('og:', '')
        content = tag.get('content', '')
        if prop and content:
            og_data[prop] = content
    
    return og_data


def _extract_twitter_card(soup: BeautifulSoup) -> Dict:
    """Extract Twitter Card metadata."""
    twitter_data = {}
    
    twitter_tags = soup.find_all('meta', attrs={'name': re.compile(r'^twitter:')})
    for tag in twitter_tags:
        name = tag.get('name', '').replace('twitter:', '')
        content = tag.get('content', '')
        if name and content:
            twitter_data[name] = content
    
    return twitter_data


def _extract_schema_org(soup: BeautifulSoup) -> Dict:
    """Extract Schema.org structured data."""
    schema_data = {}
    
    # Look for JSON-LD scripts
    scripts = soup.find_all('script', type='application/ld+json')
    for script in scripts:
        try:
            import json
            data = json.loads(script.string)
            if isinstance(data, dict):
                schema_data.update(data)
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        schema_data.update(item)
        except Exception as e:
            logger.debug(f"Failed to parse JSON-LD: {e}")
    
    return schema_data


def _extract_image_metadata(soup: BeautifulSoup, page_url: str) -> Dict:
    """Extract metadata specific to images on the page."""
    data = {}
    
    # Try to find the main image
    # Look for Open Graph image first
    og_image = soup.find('meta', property='og:image')
    if og_image:
        img_url = og_image.get('content')
        # Find corresponding img tag if exists
        img_tag = soup.find('img', src=img_url) or soup.find('img')
    else:
        # Find largest/main image
        img_tag = soup.find('img')
    
    if img_tag:
        data['image_alt'] = img_tag.get('alt', '').strip()
        data['image_title'] = img_tag.get('title', '').strip()
    
    return data


def _extract_author(soup: BeautifulSoup, metadata: Dict) -> Optional[str]:
    """Extract author information from various sources."""
    
    # Try meta author tag
    author_tag = soup.find('meta', attrs={'name': 'author'})
    if author_tag:
        return author_tag.get('content', '').strip()
    
    # Try Open Graph
    if 'author' in metadata.get('og_data', {}):
        return metadata['og_data']['author']
    
    # Try article:author
    article_author = soup.find('meta', property='article:author')
    if article_author:
        return article_author.get('content', '').strip()
    
    # Try Schema.org
    schema_data = metadata.get('schema_data', {})
    if 'author' in schema_data:
        author = schema_data['author']
        if isinstance(author, dict):
            return author.get('name', '')
        return str(author)
    
    # Try common author class names
    author_selectors = [
        {'class': re.compile(r'author', re.I)},
        {'class': re.compile(r'by-author', re.I)},
        {'class': re.compile(r'post-author', re.I)},
        {'itemprop': 'author'},
        {'rel': 'author'}
    ]
    
    for selector in author_selectors:
        author_elem = soup.find(['span', 'div', 'a', 'p'], attrs=selector)
        if author_elem:
            return author_elem.get_text().strip()
    
    return None


def _extract_tags(soup: BeautifulSoup, metadata: Dict) -> List[str]:
    """Extract tags/categories from the page."""
    tags = set()
    
    # Add keywords
    tags.update(metadata.get('keywords', []))
    
    # Try article:tag
    article_tags = soup.find_all('meta', property='article:tag')
    for tag in article_tags:
        content = tag.get('content', '').strip()
        if content:
            tags.add(content)
    
    # Try common tag class names
    tag_selectors = [
        {'class': re.compile(r'tag', re.I)},
        {'class': re.compile(r'category', re.I)},
        {'rel': 'tag'}
    ]
    
    for selector in tag_selectors:
        tag_elems = soup.find_all(['a', 'span'], attrs=selector)
        for elem in tag_elems[:10]:  # Limit to 10 tags
            tag_text = elem.get_text().strip()
            if tag_text and len(tag_text) < 50:  # Reasonable tag length
                tags.add(tag_text)
    
    return list(tags)[:20]  # Return max 20 tags


def _extract_copyright(soup: BeautifulSoup) -> Optional[str]:
    """Extract copyright information."""
    
    # Try meta copyright tag
    copyright_tag = soup.find('meta', attrs={'name': 'copyright'})
    if copyright_tag:
        return copyright_tag.get('content', '').strip()
    
    # Try footer copyright
    footer = soup.find('footer')
    if footer:
        copyright_text = footer.find(text=re.compile(r'©|copyright', re.I))
        if copyright_text:
            return copyright_text.strip()
    
    # Search entire page for copyright symbol
    copyright_elem = soup.find(text=re.compile(r'©.*?\d{4}'))
    if copyright_elem:
        return copyright_elem.strip()
    
    return None


def format_metadata_for_display(metadata: Dict) -> str:
    """
    Format metadata into a human-readable string for reports.
    
    Args:
        metadata: Dictionary containing extracted metadata
        
    Returns:
        Formatted string
    """
    lines = []
    
    if metadata.get('title'):
        lines.append(f"Title: {metadata['title']}")
    
    if metadata.get('author'):
        lines.append(f"Author: {metadata['author']}")
    
    if metadata.get('description'):
        lines.append(f"Description: {metadata['description'][:200]}...")
    
    if metadata.get('copyright'):
        lines.append(f"Copyright: {metadata['copyright']}")
    
    if metadata.get('tags'):
        lines.append(f"Tags: {', '.join(metadata['tags'][:10])}")
    
    if metadata.get('domain'):
        lines.append(f"Domain: {metadata['domain']}")
    
    if metadata.get('og_data'):
        og = metadata['og_data']
        if 'site_name' in og:
            lines.append(f"Site: {og['site_name']}")
        if 'type' in og:
            lines.append(f"Type: {og['type']}")
    
    return '\n'.join(lines) if lines else "No metadata available"