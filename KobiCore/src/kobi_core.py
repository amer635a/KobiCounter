import paho.mqtt.client as mqtt
import json
import time


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
                    
                    self.client.publish("video/stream/analayze/resp", json.dumps(payload))
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
