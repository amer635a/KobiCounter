import os
from PIL import Image
import pillow_heif
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

# Register HEIC support with Pillow
pillow_heif.register_heif_opener()

# Define paths
source_dir = os.path.expanduser("/home/amer/projects/KobiCounter/kobiPhoto")
output_dir = os.path.expanduser("/home/amer/projects/KobiCounter/kobiPhoto_converted")
os.makedirs(output_dir, exist_ok=True)

# Get all .heic files
heic_files = [
    f for f in os.listdir(source_dir)
    if f.lower().endswith(".heic")
]

# Count the number of HEIC files
total_files = len(heic_files)
print(f"Total HEIC images found: {total_files}")

# Convert a single file
def convert_file(filename):
    input_path = os.path.join(source_dir, filename)
    output_filename = os.path.splitext(filename)[0] + ".png"
    output_path = os.path.join(output_dir, output_filename)

    try:
        image = Image.open(input_path)
        image.save(output_path, format="PNG")
        return filename, "✅ Converted"
    except Exception as e:
        return filename, f"❌ Failed — {e}"

# Use ThreadPoolExecutor for multithreading and track progress
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(convert_file, f) for f in heic_files]

    # Use tqdm for progress bar
    for future in tqdm(as_completed(futures), total=total_files, desc="Converting files"):
        filename, result = future.result()
        print(f"{result}: {filename}")
