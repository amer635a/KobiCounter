import paho.mqtt.client as mqtt
import json
import time
import cv2
from ultralytics import YOLO
import base64
import numpy as np
 


class kobiCore:
    def __init__(self, broker_host, broker_port=1883):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.pending_analysis = False

        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

        self.client.connect(self.broker_host, self.broker_port)
        self.client.loop_start()

        # Subscriptions
        self.client.subscribe("video/stream/analayze/req")
        self.client.subscribe("video/stream/resp")
        self.model = YOLO(r"C:\Users\admin\Desktop\projects\KobiCounter\KobiCore\my_model\my_model.pt")
        self.labels = self.model.names
        self.bbox_colors = [(164,120,87), (68,148,228), (93,97,209), (178,182,133), (88,159,106), 
              (96,202,231), (159,124,168), (169,162,241), (98,118,150), (172,176,184)]
        print(self.labels)

    def on_connect(self, client, userdata, flags, rc):
        print(f"✅ Connected to {self.broker_host}:{self.broker_port} (code {rc})")

    def on_message(self, client, userdata, msg):
        topic = msg.topic
        try:
            payload_str = msg.payload.decode()
            payload = json.loads(payload_str)

            if topic == "video/stream/analayze/req":
                print("📩 Received analysis request")
                frequnce = payload.get("frequnce", 1)
                time_val = payload.get("time", 1)

                self.pending_analysis = True
                self.request_stream(frequnce, time_val)

            elif topic == "video/stream/resp" and self.pending_analysis:
                if "image" in payload:
                    print("🔁 Forwarding analyzed image...")
                    payload = json.loads(msg.payload.decode())
                    base64_img = payload.get("image")
                    if not base64_img:
                        print("No image field found in payload.")
                        return
                    jpg_original = base64.b64decode(base64_img)
                    np_arr = np.frombuffer(jpg_original, dtype=np.uint8)
                    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                     #Do object detection here
                    results = self.model(frame, verbose=False)
                    # Extract results
                    detections = results[0].boxes
                    
                    object_count = 0
     
                    for i in range(len(detections)):
                        # Tensor ->A 3D block of numbers
                        
                        # Get bounding box coordinates
                        # Ultralytics returns results in Tensor format, which have to be converted to a regular Python array
                        xyxy_tensor = detections[i].xyxy.cpu() # Detections in Tensor format in CPU memory
                        xyxy = xyxy_tensor.numpy().squeeze() # Convert tensors to Numpy array
                        xmin, ymin, xmax, ymax = xyxy.astype(int) # Extract individual coordinates and convert to int

                        # Get bounding box class ID and name
                        classidx = int(detections[i].cls.item())
                        classname = self.labels[classidx]

                        # Get bounding box confidence
                        conf = detections[i].conf.item()

                        # Draw box if confidence threshold is high enough
                        if conf > 0.5:

                            color = self.bbox_colors[classidx % 10]
                            cv2.rectangle(frame, (xmin,ymin), (xmax,ymax), color, 2)
                            
                            cv2.circle(img=frame, center=(int((xmin+xmax)/2), int((ymin+ymax)/2)), radius=5, color=(25, 15, 255), thickness=-1)

                            label = f'{classname}: {int(conf*100)}%'
                            labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1) # Get font size
                            label_ymin = max(ymin, labelSize[1] + 10) # Make sure not to draw label too close to top of window
                            # cv2.rectangle(frame, (xmin, label_ymin-labelSize[1]-10), (xmin+labelSize[0], label_ymin+baseLine-10), color, cv2.FILLED) # Draw white box to put label text in
                            # cv2.putText(frame, label, (xmin, label_ymin-7), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1) # Draw label text

                            # Basic example: count the number of objects in the image
                            object_count = object_count + 1
                
                    cv2.putText(frame, f'Number of objects: {object_count}', (10,40), cv2.FONT_HERSHEY_SIMPLEX, .7, (0,255,255), 2) # Draw total number of detected objects
                    _, buffer = cv2.imencode('.jpg', frame)    
                    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                    resp_payload = json.dumps({ "image": jpg_as_text })  
                    self.client.publish("video/stream/analayze/resp", resp_payload)
                else:
                    print("⚠️ Received frame with no image field")
        except Exception as e:
            print(f"❌ Error in on_message: {e}")

    def request_stream(self, frequnce, time_val):
        payload = json.dumps({"frequnce": frequnce, "time": time_val})
        self.client.publish("video/stream/req", payload)
        print(f"📤 Stream requested: frequnce={frequnce}, time={time_val}")


if __name__ == "__main__":
    core = kobiCore("localhost")
    print("🚀 Waiting for analysis requests...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("🛑 Exiting...")
