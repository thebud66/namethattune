import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from uuid import uuid4

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../frontend/public/images/usr")

@router.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Generate unique filename
    ext = file.filename.split(".")[-1]
    filename = f"{uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Return relative path to store in DB
    relative_url = f"/images/usr/{filename}"
    return {"url": relative_url}
