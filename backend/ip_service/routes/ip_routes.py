import os
from fastapi import APIRouter, UploadFile, File
from ip_service.services.ip_services import save_uploaded_file, check_image_service

router = APIRouter()

@router.post("/check-image/")
async def check_image(target: UploadFile = File(...)):
    """
    Upload one target image and check for duplicates in backend/images/candidates folder.
    """
    # Save the uploaded file
    target_path = save_uploaded_file(target)  # pass the UploadFile object directly

    # Run pHash check
    results = check_image_service(target_path)

    return {"target": target.filename, "results": results}