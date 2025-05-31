import { createMqttClient } from "../lib/mqttClient";

export class MqttInfoClient {
  constructor({ setInfo, mqttUrl = "ws://localhost:9001" }) {
    this.setInfo = setInfo;
    this.mqttUrl = mqttUrl;
    this.topicReq = "analayze/info/req";
    this.topicResp = "analayze/info/resp";
    this.clientObj = null;
  }

  connect() {
    this.clientObj = createMqttClient({
      mqttUrl: this.mqttUrl,
      topic: this.topicResp,
      onConnect: () => {
        // Send request for info
        this.clientObj.client.publish(this.topicReq, "{}", { qos: 0 });
      },
      onMessage: (msgTopic, message) => {
        if (msgTopic === this.topicResp) {
          try {
            const payload = JSON.parse(message.toString());
            this.setInfo(payload);
          } catch (e) {
            this.setInfo({ error: "خطأ في البيانات" });
          }
        }
      },
      onError: () => this.setInfo({ error: "خطأ في الاتصال" }),
      onClose: () => {},
    });
  }

  cleanup() {
    if (this.clientObj && this.clientObj.cleanup) {
      this.clientObj.cleanup();
    }
  }
}
