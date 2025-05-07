from ultralytics import YOLO
import os

# ✅ Load your trained model (from your training run)
model = YOLO("./weightsv6/best.pt")  # This must be your trained model path

# Folder with images you want to detect
input_folder = "./try"
output_folder = "./predicted"
os.makedirs(output_folder, exist_ok=True)

# Run prediction using your model
model.predict(
    source=input_folder,
    save=True,
    save_txt=True,
    project=output_folder,
    name="results"
)


