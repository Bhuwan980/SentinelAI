import logging
from io import BytesIO
from typing import Dict, List, Optional
from scrapping.uploader import upload_to_s3
from scrapping.scrapper import fetch_images, download_image_content
from ip_service.services.database import save_image, save_ip_asset, save_ip_match
from ip_service.services.ip_notification import create_notification
from sqlalchemy.orm import Session
from fastapi import HTTPException
from common.config.config import settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

async def run_pipeline(file: BytesIO, user_id: int, filename: str, db: Session) -> Dict:
    """
    Complete IP detection pipeline:
    1. Upload original image to S3
    2. Save to database
    3. Search for similar images via SerpAPI
    4. Download and store matches
    5. Create notifications
    
    Args:
        file: Image file bytes
        user_id: User ID
        filename: Original filename
        db: Database session
        
    Returns:
        Dict with success status, image_id, matches, and optional error
    """
    image_id = None
    
    try:
        # ========== Step 1: Upload to S3 ==========
        logger.info(f"📤 Step 1: Uploading original image for user {user_id}")
        
        try:
            public_url = upload_to_s3(file, user_id, original_filename=filename)
            logger.info(f"✅ Uploaded to S3: {public_url}")
        except Exception as upload_error:
            logger.exception(f"❌ S3 upload failed for user {user_id}")
            return {
                "success": False,
                "image_id": None,
                "matches": [],
                "error": f"Failed to upload image: {str(upload_error)}"
            }

        # ========== Step 2: Save to Database ==========
        logger.info(f"💾 Step 2: Saving image to database")
        
        try:
            metadata = {"s3_path": public_url}
            db_image = save_image(db, public_url, metadata, user_id=int(user_id))
            
            # CRITICAL FIX: Extract actual ID from the returned object
            if hasattr(db_image, 'id'):
                image_id = db_image.id
            elif isinstance(db_image, int):
                image_id = db_image
            else:
                logger.error(f"❌ Unexpected return type from save_image: {type(db_image)}")
                return {
                    "success": False,
                    "image_id": None,
                    "matches": [],
                    "error": "Failed to extract image ID from database"
                }
            
            logger.info(f"✅ Saved image id={image_id} for user_id={user_id}")
            
        except Exception as db_error:
            logger.exception(f"❌ Database save failed for user {user_id}")
            return {
                "success": False,
                "image_id": None,
                "matches": [],
                "error": f"Failed to save image to database: {str(db_error)}"
            }

        # ========== Step 3: Fetch Similar Images ==========
        logger.info(f"🔍 Step 3: Searching for similar images via SerpAPI")
        
        serpapi_key = settings.SERP_API_KEY
        if not serpapi_key:
            logger.error("❌ SERP_API_KEY is not configured")
            return {
                "success": False,
                "image_id": image_id,
                "matches": [],
                "error": "SERP_API_KEY not configured"
            }
        
        logger.info(f"🔑 Using SERP_API_KEY: {serpapi_key[:4]}...{serpapi_key[-4:]}")

        try:
            similar_images = await fetch_images(
                img_url=public_url, 
                sources=["serpapi"], 
                serpapi_key=serpapi_key
            )
            
            if not similar_images:
                logger.warning(f"⚠️ No similar images found by SerpAPI for image {image_id}")
                return {
                    "success": True,
                    "image_id": image_id,
                    "matches": [],
                    "message": "No similar images found"
                }
            
            logger.info(f"✅ Found {len(similar_images)} similar images")
            
        except HTTPException as api_error:
            logger.error(f"❌ SerpAPI search failed: {api_error.detail}")
            return {
                "success": False,
                "image_id": image_id,
                "matches": [],
                "error": f"Failed to fetch similar images: {api_error.detail}"
            }
        except Exception as search_error:
            logger.exception(f"❌ Unexpected error during image search")
            return {
                "success": False,
                "image_id": image_id,
                "matches": [],
                "error": f"Image search error: {str(search_error)}"
            }

        # ========== Step 4: Process and Store Matches ==========
        logger.info(f"⚙️ Step 4: Processing {len(similar_images)} matches")
        
        matches = []
        successful_matches = 0
        failed_matches = 0
        
        for idx, sim_image in enumerate(similar_images):
            try:
                image_url = sim_image.get("url")
                if not image_url:
                    logger.warning(f"⚠️ Match {idx} has no URL, skipping")
                    failed_matches += 1
                    continue

                logger.info(f"📥 Processing match {idx + 1}/{len(similar_images)}: {image_url}")

                # Download image content
                content_url = sim_image.get("content") or image_url
                image_bytes = await download_image_content(content_url)
                
                if not image_bytes:
                    logger.warning(f"⚠️ Failed to download image {idx}: {content_url}")
                    failed_matches += 1
                    continue

                # Upload matched image to S3
                try:
                    match_url = upload_to_s3(
                        image_bytes,
                        user_id,
                        original_filename=f"match_{image_id}_{idx}.jpg",
                        prefix="uploads/crawled"
                    )
                    logger.info(f"✅ Uploaded match {idx} to S3: {match_url}")
                except Exception as match_upload_error:
                    logger.warning(f"⚠️ Failed to upload match {idx} to S3: {match_upload_error}")
                    failed_matches += 1
                    continue

                # Save IP asset
                try:
                    asset = save_ip_asset(
                        db,
                        user_id=user_id,
                        title=sim_image.get("title", "Matched Image"),
                        file_url=match_url,
                        description=sim_image.get("caption", ""),
                        asset_type="image"
                    )
                    
                    # Extract asset ID
                    asset_id = asset.id if hasattr(asset, 'id') else asset
                    
                except Exception as asset_error:
                    logger.warning(f"⚠️ Failed to save IP asset for match {idx}: {asset_error}")
                    failed_matches += 1
                    continue

                # ✅ CRITICAL FIX: Save IP match WITH scraped_data
                try:
                    similarity_score = float(sim_image.get("similarity", 0.0))
                    
                    # ✅ NEW: Pass the complete scraped data
                    match_record = save_ip_match(
                        db,
                        source_image_id=image_id,
                        matched_asset_id=asset_id,
                        similarity_score=similarity_score,
                        scraped_data=sim_image  # ✅ PASS THE COMPLETE SCRAPED DATA!
                    )
                    
                    # Extract match ID
                    match_id = match_record.id if hasattr(match_record, 'id') else match_record
                    
                    logger.info(
                        f"✅ Saved IP match {match_id} with similarity {similarity_score:.2f} "
                        f"and scraped data (page_url: {sim_image.get('page_url', 'N/A')})"
                    )
                    
                except Exception as match_error:
                    logger.warning(f"⚠️ Failed to save IP match for match {idx}: {match_error}")
                    failed_matches += 1
                    continue

                # Create notification
                try:
                    create_notification(
                        db,
                        user_id,
                        f"Potential IP match found for image ID {image_id} with similarity {similarity_score:.2f}"
                    )
                except Exception as notif_error:
                    logger.warning(f"⚠️ Failed to create notification for match {idx}: {notif_error}")
                    # Don't fail the match if notification fails

                # Add to results
                matches.append({
                    "id": match_id,
                    "asset_id": asset_id,
                    "url": match_url,
                    "caption": sim_image.get("caption", ""),
                    "image_similarity": similarity_score,
                    "text_similarity": float(sim_image.get("text_similarity", 0.0)),
                    "page_url": sim_image.get("page_url", "")  # ✅ Include page URL
                })
                
                successful_matches += 1
                
            except Exception as match_error:
                logger.exception(f"❌ Unexpected error processing match {idx}")
                failed_matches += 1
                continue

        # ========== Step 5: Return Results ==========
        logger.info(
            f"✅ Pipeline completed: {successful_matches} successful matches, "
            f"{failed_matches} failed matches"
        )
        
        return {
            "success": True,
            "image_id": image_id,
            "matches": matches,
            "stats": {
                "total_found": len(similar_images),
                "successful": successful_matches,
                "failed": failed_matches
            }
        }
        
    except Exception as e:
        logger.exception(f"❌ Critical error in run_pipeline for user {user_id}")
        return {
            "success": False,
            "image_id": image_id,
            "matches": [],
            "error": f"Pipeline failed: {str(e)}"
        }