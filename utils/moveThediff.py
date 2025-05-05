import os
import shutil
import filecmp

source_dir = "/home/amer/projects/KobiCounter/kobiPhoto_converted"
comparison_dir = "/home/amer/projects/KobiCounter/kobi2"
destination_dir = "/home/amer/projects/KobiCounter/diff_photos"

# Create the destination folder if it doesn't exist
os.makedirs(destination_dir, exist_ok=True)

# Get list of files in source directory (ignore non-files)
source_files = [f for f in os.listdir(source_dir) if os.path.isfile(os.path.join(source_dir, f))]
total_files = len(source_files)
copied_count = 0

for i, filename in enumerate(source_files, start=1):
    source_path = os.path.join(source_dir, filename)
    compare_path = os.path.join(comparison_dir, filename)

    # If the file doesn't exist in comparison folder or is different, copy it
    if not os.path.exists(compare_path) or not filecmp.cmp(source_path, compare_path, shallow=False):
        shutil.copy2(source_path, os.path.join(destination_dir, filename))
        copied_count += 1

    # Print progress
    percent = (i / total_files) * 100
    print(f"\rProgress: {percent:.2f}% ({i}/{total_files})", end='')

print(f"\nDone. {copied_count} file(s) copied.")
