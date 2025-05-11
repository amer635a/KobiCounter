import cv2
import paho.mqtt.client as mqtt
import base64
import numpy as np
import os

# MQTT settings
broker = "localhost"  # or "127.0.0.1"
topic = "video/stream"

# Callback to handle received messages
def on_message(client, userdata, msg):
    try:
        # Decode the base64 image
        jpg_original = base64.b64decode(msg.payload)
        np_arr = np.frombuffer(jpg_original, dtype=np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if frame is not None:
            cv2.imshow("MQTT Video Stream", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                client.disconnect()
    except Exception as e:
        print(f"Error decoding or displaying frame: {e}")

# Create MQTT client without specifying API version
client = mqtt.Client()  # Removed the "2" argument
client.on_message = on_message

try:
    client.connect(broker, 1883)
    client.subscribe(topic)
    print(f"Subscribed to topic: {topic} on broker: {broker}")
    client.loop_forever()
except Exception as e:
    print(f"Error connecting or subscribing to MQTT broker: {e}")
finally:
    cv2.destroyAllWindows()
