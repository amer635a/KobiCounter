from ultralytics import YOLO

def train_and_export_yolov8_model(data_yaml_path: str, model_type: str = 'yolov8n', epochs: int = 50, image_size: int = 640):
    """
    Train a YOLOv8 model and export the trained model.
    
    Parameters:
    - data_yaml_path: str, path to the dataset's data.yaml file
    - model_type: str, which YOLOv8 model to use (e.g., yolov8n, yolov8s, yolov8m, yolov8l, yolov8x)
    - epochs: int, number of training epochs
    - image_size: int, image size for training (default 640)
    
    Returns:
    - path to trained model file (.pt)
    """

    print(f"Loading model: {model_type}.pt")
    model = YOLO(f'{model_type}.pt')  # load pre-trained model

    print("Starting training...")
    results = model.train(
        data=data_yaml_path,
        epochs=epochs,
        imgsz=image_size
    )

    best_model_path = model.ckpt_path or model.trainer.best
    print(f"Training complete. Best model saved at: {best_model_path}")
    return best_model_path


if __name__ == "__main__":
    import os

    # Call the training function
    model_path = train_and_export_yolov8_model("/home/amer/projects/KobiCounter/Kobi.v3i.yolov8/data.yaml")

    print(f"\n✅ Model ready: {model_path}")
