# ip_routes.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from ip_service.services.ip_services import execute_ip_pipeline  # correct import

router = APIRouter()


@router.post("/run-pipeline")
async def run_pipeline_endpoint(keyword: str, file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        result = execute_ip_pipeline(file_bytes, keyword)
        if not result.get("success"):
            raise HTTPException(
                status_code=500, detail=result.get("error", "Pipeline failed")
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")