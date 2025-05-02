from ultralytics import YOLO
import os

# ✅ Load your trained model (from your training run)
model = YOLO("/home/amer/projects/KobiCounter/yolov8n.pt")  # This must be your trained model path

# Folder with images you want to detect
input_folder = "/home/amer/projects/KobiCounter/kobi2"
output_folder = "/home/amer/projects/KobiCounter/predicted"
os.makedirs(output_folder, exist_ok=True)

# Run prediction using your model
model.predict(
    source=input_folder,
    save=True,
    save_txt=True,
    project=output_folder,
    name="results"
)


