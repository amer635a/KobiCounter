import paho.mqtt.client as mqtt
import cv2
import base64
import time
import json
import threading
 

broker_address = "localhost"
broker_port = 1883
req_topic = "video/stream/req"
resp_topic = "video/stream/resp"
photo_req_topic = "video/photos/req"
photo_resp_topic = "video/photos/resp"
 
# Initialize the camera
cap = cv2.VideoCapture(0)

# Use MQTT 3.1.1 protocol to avoid deprecation warning
client = mqtt.Client(protocol=mqtt.MQTTv311)

# Global flag to control streaming
streaming = False

def stream_video(frequency, duration):
    global streaming
    streaming = True
    try:
        end_time = time.time() + duration
        interval = 1.0 / frequency if frequency > 0 else 1.0
        while time.time() < end_time:
            ret, frame = cap.read()
            if not ret:
                print("Failed to capture frame.")
                break
            _, buffer = cv2.imencode('.jpg', frame)
            jpg_as_text = base64.b64encode(buffer).decode('utf-8')
            resp_payload = json.dumps({ 
                "image": jpg_as_text,
                "timestamp": time.time()
            })
            client.publish(resp_topic, resp_payload)
            time.sleep(interval)
    finally:
        streaming = False

def capture_photos(photonumber, delay):
    for i in range(photonumber):
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture photo.")
            break
        _, buffer = cv2.imencode('.jpg', frame)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        resp_payload = json.dumps({
            "resp_topic": photo_resp_topic,
            "image": jpg_as_text,
            "index": i + 1,
            "timestamp": time.time()
        })
        client.publish(photo_resp_topic, resp_payload)
        print(f"📸 Sent photo {i + 1}")
        time.sleep(delay)

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT Broker: {broker_address}:{broker_port} with result code {rc}")
    client.subscribe(req_topic)
    client.subscribe(photo_req_topic)

def on_message(client, userdata, msg):
    global streaming

    if msg.topic == req_topic:
        try:
            payload = json.loads(msg.payload.decode())
            frequency = float(payload.get("frequnce", 1))
            duration = float(payload.get("time", 1))
            print(f"🎥 Received stream request: frequnce={frequency}, time={duration}")
            if not streaming:
                threading.Thread(target=stream_video, args=(frequency, duration), daemon=True).start()
            else:
                print("⚠️ Stream request ignored: already streaming.")
        except Exception as e:
            print(f"❌ Error handling stream request: {e}")

    elif msg.topic == photo_req_topic:
        try:
            payload = json.loads(msg.payload.decode())
            photonumber = int(payload.get("photonumber", 1))
            delay = float(payload.get("delay", 1))
            print(f"📸 Received photo request: photonumber={photonumber}, delay={delay}")
            threading.Thread(target=capture_photos, args=(photonumber, delay), daemon=True).start()
        except Exception as e:
            print(f"❌ Error handling photo request: {e}")

client.on_connect = on_connect
client.on_message = on_message

client.connect(broker_address, broker_port)

try:
    client.loop_forever()
finally:
    cap.release()