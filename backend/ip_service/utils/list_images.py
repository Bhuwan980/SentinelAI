import os

def list_images(folder_path):
    """Return list of image file paths in a folder."""
    valid_exts = (".jpg", ".jpeg", ".png")
    return [
        os.path.join(folder_path, f)
        for f in os.listdir(folder_path)
        if f.lower().endswith(valid_exts)
    ]