import subprocess
import os

def convert_mov_to_mp4(input_file):
    # Generate output file name with .mp4 extension
    base_name, _ = os.path.splitext(input_file)
    output_file = f"{base_name}.mp4"

    # ffmpeg command to convert .MOV to .mp4
    command = [
        "ffmpeg",
        "-i", input_file,
        "-c:v", "libx264",  # Convert video to H.264
        "-c:a", "aac",      # Convert audio to AAC
        "-preset", "fast",  # Speed/quality trade-off
        output_file
    ]

    print("Running command:", " ".join(command))

    try:
        subprocess.run(command, check=True)
        print(f"✅ Successfully converted: {output_file}")
    except subprocess.CalledProcessError as e:
        print("❌ Conversion failed:", e)

# --- MAIN SCRIPT ---

if __name__ == "__main__":
    input_filename = "/home/amer/projects/KobiCounter/kobi2/IMG_3361.MOV"
    
    if not os.path.exists(input_filename):
        print(f"❌ File not found: {input_filename}")
    else:
        convert_mov_to_mp4(input_filename)
