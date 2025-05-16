import cv2
import paho.mqtt.client as mqtt
import base64
import numpy as np
import json

# MQTT settings
broker = "localhost"
topic = "video/stream/analayze/resp"

def on_message(client, userdata, msg):
    try:
        # First, decode the payload as JSON
        payload = json.loads(msg.payload.decode())
        base64_img = payload.get("image")

        if not base64_img:
            print("No image field found in payload.")
            return

        # Decode the base64-encoded image
        jpg_original = base64.b64decode(base64_img)
        np_arr = np.frombuffer(jpg_original, dtype=np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is not None:
            cv2.imshow("MQTT Video Stream", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                client.disconnect()
    except Exception as e:
        print(f"Error decoding or displaying frame: {e}")

# Create MQTT client and connect
client = mqtt.Client()
client.on_message = on_message

try:
    client.connect(broker, 1883)
    client.subscribe(topic)
    print(f"✅ Subscribed to topic: {topic} on broker: {broker}")
    client.loop_forever()
except Exception as e:
    print(f"❌ Error connecting or subscribing to MQTT broker: {e}")
finally:
    cv2.destroyAllWindows()
