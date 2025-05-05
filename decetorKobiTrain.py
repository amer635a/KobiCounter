from ultralytics import YOLO
import os
import torch


def train_and_export_yolov8_model(
    data_yaml_path: str,
    model_type: str = 'yolov8n',
    epochs: int = 50,
    image_size: int = 640,
    batch_size: int = 16
):
    """
    Train a YOLOv8 model and export the trained model.

    Parameters:
    - data_yaml_path: str, path to the dataset's data.yaml file
    - model_type: str, YOLOv8 model type (e.g., yolov8n, yolov8s)
    - epochs: int, number of training epochs
    - image_size: int, image size for training
    - batch_size: int, batch size for training

    Returns:
    - path to trained model file (.pt)
    """
    attempt = 1
    while True:
        try:
            print(f"Attempt {attempt}: Loading model {model_type}.pt")
            model = YOLO(f'{model_type}.pt')

            print(f"Starting training with image size {image_size} and batch size {batch_size}...")
            results = model.train(
                data=data_yaml_path,
                epochs=epochs,
                imgsz=image_size,
                batch=batch_size
            )

            best_model_path = model.ckpt_path or model.trainer.best
            print(f"✅ Training complete. Best model saved at: {best_model_path}")
            return best_model_path

        except RuntimeError as e:
            if "CUDA out of memory" in str(e):
                print(f"⚠️ CUDA out of memory at image size {image_size} and batch size {batch_size}")
                if image_size > 320:
                    image_size = image_size // 2
                elif batch_size > 1:
                    batch_size = batch_size // 2
                else:
                    print("❌ Cannot reduce image size or batch size further. Aborting.")
                    raise e
                attempt += 1
            else:
                raise e


if __name__ == "__main__":
    model_path = train_and_export_yolov8_model(
        "/home/amer/projects/KobiCounter/Kobi.v4i.yolov8/data.yaml",
        model_type="yolov8n",  # change to yolov8s or yolov8m if needed
        epochs=25,
        image_size=640,
        batch_size=16
    )

    print(f"\n✅ Model ready: {model_path}")
 