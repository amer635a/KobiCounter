import paho.mqtt.client as mqtt
import cv2
import base64
import time

broker_address = "localhost"
broker_port = 1883
topic = "video/stream"

# Initialize the camera
cap = cv2.VideoCapture(0)

# Use MQTT 3.1.1 protocol (compatible with most brokers)
client = mqtt.Client()

client.connect(broker_address, broker_port)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Encode frame as JPEG
    _, buffer = cv2.imencode('.jpg', frame)
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')

    # Publish the frame to the MQTT topic
    client.publish(topic, jpg_as_text)

    # Sleep to prevent flooding the broker with too many messages
    time.sleep(0.1)

# Release the camera
cap.release()
client.disconnect()
