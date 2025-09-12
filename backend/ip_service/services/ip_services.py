import os
import shutil
from imagededup.methods import PHash
from ip_service.utils.list_images import list_images

# Base folder for uploads
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_uploaded_file(file) -> str:
    """
    Save uploaded FastAPI file to uploads folder and return the file path.
    """
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path

def check_image_service(target_path: str, candidates_folder: str = None, threshold: int = 5):
    """
    Check the target image against candidate images using PHash.

    Args:
        target_path (str): Path to the target image.
        candidates_folder (str, optional): Folder containing candidate images.
                                           Defaults to 'images/candidates' in BASE_DIR.
        threshold (int, optional): Hamming distance threshold for matches. Default is 5.

    Returns:
        List[Dict]: A list of dictionaries containing 'candidate', 'match' (bool), and 'distance'.
    """
    if candidates_folder is None:
        candidates_folder = os.path.join(BASE_DIR, "images/candidates")

    if not os.path.exists(target_path):
        raise FileNotFoundError(f"Target image not found: {target_path}")
    if not os.path.exists(candidates_folder):
        raise FileNotFoundError(f"Candidates folder not found: {candidates_folder}")

    candidates = list_images(candidates_folder)
    phasher = PHash()

    target_hash = phasher.encode_image(image_file=target_path)
    results = []

    for cand in candidates:
        cand_hash = phasher.encode_image(image_file=cand)
        distance = int(PHash.hamming_distance(target_hash, cand_hash))  # ensure int
        match = bool(distance <= threshold)  # ensure bool
        results.append({
            "candidate": str(cand),  # convert Path to string
            "match": match,
            "distance": distance
        })

    return results