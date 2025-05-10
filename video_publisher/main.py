import cv2
import paho.mqtt.client as mqtt
import base64
import time
import os

broker = os.getenv("MQTT_BROKER", "localhost")
topic = "video/stream"

client = mqtt.Client()
client.connect(broker, 1883)

cap = cv2.VideoCapture(0)  # or use a video file

while True:
    ret, frame = cap.read()
    if not ret:
        break
    _, buffer = cv2.imencode('.jpg', frame)
    jpg_as_text = base64.b64encode(buffer).decode()
    client.publish(topic, jpg_as_text)
    time.sleep(0.05)  # 20 FPS
