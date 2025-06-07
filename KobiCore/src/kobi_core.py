import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

import paho.mqtt.client as mqtt
import json
import time
import cv2
from ultralytics import YOLO
import base64
import numpy as np
import gc
import threading


class KobiCore:
    def __init__(self, broker_host, broker_port=1883):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.pending_analysis = False

        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

        self.client.connect(self.broker_host, self.broker_port)
        self.client.loop_start()

        self.client.subscribe("video/stream/analyze/req")
        self.client.subscribe("get/DetectionLabel/req")
        self.client.subscribe("video/stream/resp")
        self.client.subscribe("save/item/req")
        self.client.subscribe("get/history/req")
        self.client.subscribe("delete/item/req")

        self.model = YOLO(r"C:\Users\admin\Desktop\projects\KobiCounter\KobiCore\my_model\my_model.pt")
        self.labels = self.model.names
        self.bbox_colors = [
            (164, 120, 87), (68, 148, 228), (93, 97, 209),
            (178, 182, 133), (88, 159, 106), (96, 202, 231),
            (159, 124, 168), (169, 162, 241), (98, 118, 150),
            (172, 176, 184)
        ]

        print("🔍 Model labels:", self.labels)
        self.mutex = threading.Lock()
        self.delete_mutex = threading.Lock()

    def on_connect(self, client, userdata, flags, rc):
        print(f"✅ Connected to {self.broker_host}:{self.broker_port} (code {rc})")

    def on_message(self, client, userdata, msg):
        topic = msg.topic
        try:
            payload = json.loads(msg.payload.decode())
            if topic == "video/stream/analyze/req":
                print("📩 Received analysis request")
                frequency = payload.get("frequnce", 1)
                time_val = payload.get("time", 1)
                self.pending_analysis = True
                self.request_stream(frequency, time_val)

            elif topic == "video/stream/resp" and self.pending_analysis:
                image_data = payload.get("image")
                if image_data:
                    # print("📥 Received frame for analysis")
                    frame = self.decode_image(image_data)
                    if frame is not None:
                        frame = cv2.resize(frame, (640, 480))  # Reduce memory use
                        annotated_frame, object_count = self.analyze_frame(frame)
                        self.send_response(annotated_frame, object_count)
                        
                else:
                    print("⚠️ Received frame with no image field")

            elif topic == "get/DetectionLabel/req":
                print("📩 Received info request")
                info_payload = json.dumps({
                    "labels": self.labels
                })
                self.client.publish("get/DetectionLabel/resp", info_payload)
                print("📤 Info response published")

            elif topic == "save/item/req":
                print("📩 Received save item request")
                from StoreDataBase.DBManager import OrderDBManager
                db = OrderDBManager()
                item = payload.get("item", {})
                name = item.get("name")
                date = item.get("date")
                amount = item.get("amount")
                status = "make"  # or use name if you want to map name to status
                try:
                    db.add_order(date, status, amount)
                    resp = {
                        "status": "success",
                        "message": f"Item saved: {item}"
                    }
                except Exception as e:
                    resp = {
                       
                        "status": "error",
                        "message": str(e)
                    }
                self.client.publish("save/item/resp", json.dumps(resp))
                print("📤 Save item response published")

            elif topic == "get/history/req":
                print("📩 Received get history request")
                from StoreDataBase.DBManager import OrderDBManager
                db = OrderDBManager()
                history = db.get_order_history()
                items = []
                name = payload.get("data", {}).get("name", "")
                for (iso_date, amount, status) in history:
                    if "+" in iso_date:
                        iso_date_z = iso_date.split("+")[0] + "Z"
                    elif iso_date.endswith("Z"):
                        iso_date_z = iso_date
                    else:
                        iso_date_z = iso_date + "Z"
                    items.append({
                        "name": name,
                        "date": iso_date_z,
                        "amount": amount,
                        "status": status
                    })
                resp = {
                    "data": {
                        "items": items
                    }
                }
                self.client.publish("get/history/resp", json.dumps(resp))
                print("📤 History response published")

            elif topic == "delete/item/req":
                print("📩 Received delete item request")
                from StoreDataBase.DBManager import OrderDBManager
                db = OrderDBManager()
                item_id = payload.get("id")
                print(f"🔍 Deleting item with ID: {item_id}")
                try:
                    with self.delete_mutex:
                        db.delete_order_history_and_update_order(item_id)
                    resp = {
                        "status": "success",
                        "message": f"Deleted item {item_id} and updated orders."
                    }
                    # After successful delete, send updated history for the same name
                    name = payload.get("data", {}).get("name", "")
                    history = db.get_order_history()
                    items = []
                    for (iso_date, amount, status) in history:
                        if "+" in iso_date:
                            iso_date_z = iso_date.split("+")[0] + "Z"
                        elif iso_date.endswith("Z"):
                            iso_date_z = iso_date
                        else:
                            iso_date_z = iso_date + "Z"
                        items.append({
                            "name": name,
                            "date": iso_date_z,
                            "amount": amount,
                            "status": status
                        })
                    history_resp = {
                        "data": {
                            "items": items
                        }
                    }
                    self.client.publish("get/history/resp", json.dumps(history_resp))
                    print("📤 History response published after delete")
                except Exception as e:
                    resp = {
                        "status": "error",
                        "message": str(e)
                    }
                self.client.publish("delete/item/resp", json.dumps(resp))
                print("📤 Delete item response published")

        except Exception as e:
            print(f"❌ Error in on_message: {e}")

    def decode_image(self, b64_string):
        try:
            jpg_original = base64.b64decode(b64_string)
            np_arr = np.frombuffer(jpg_original, dtype=np.uint8)
            return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"❌ Error decoding image: {e}")
            return None

    def analyze_frame(self, frame):
        if frame is None:
            return None, 0
        dontenter = False
        with self.mutex:
            if dontenter:
                return frame, 0
            results = self.model(frame, verbose=False)
            detections = results[0].boxes
            object_count = 0

            for det in detections:
                conf = det.conf.item()
                if conf <= 0.5:
                    continue

                class_id = int(det.cls.item())
                xyxy = det.xyxy.cpu().numpy().squeeze().astype(int)
                xmin, ymin, xmax, ymax = xyxy

                color = self.bbox_colors[class_id % len(self.bbox_colors)]
                self.draw_detection(frame, xmin, ymin, xmax, ymax, class_id, conf, color)
                object_count += 1

            cv2.putText(frame, f'Number of objects: {object_count}', (10, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

            del results  # Free memory
            # gc.collect()

        return frame, object_count

    def draw_detection(self, frame, xmin, ymin, xmax, ymax, class_id, conf, color):
        classname = self.labels[class_id]
        label = f'{classname}: {int(conf * 100)}%'

        cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), color, 2)
        center = (int((xmin + xmax) / 2), int((ymin + ymax) / 2))
        cv2.circle(frame, center, radius=5, color=(25, 15, 255), thickness=-1)

    def send_response(self, frame, object_count):
        _, buffer = cv2.imencode('.jpg', frame)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        
        resp_payload = json.dumps({"image": jpg_as_text, "object_count": object_count})
        self.client.publish("video/stream/analyze/resp", resp_payload)
        # print("📤 Response published with analyzed frame")

    def request_stream(self, frequency, time_val):
        payload = json.dumps({"frequnce": frequency, "time": time_val})
        self.client.publish("video/stream/req", payload)
        print(f"📤 Stream requested: frequnce={frequency}, time={time_val}")


if __name__ == "__main__":
    core = KobiCore("localhost")
    print("🚀 Waiting for analysis requests...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("🛑 Exiting...")
