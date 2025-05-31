import { createMqttClient } from "./mqttClient";

export class MqttStreamClient {
  constructor({ mqttUrl = "ws://localhost:9001", onMessage, onError, onClose }) {
    this.topicReq = "video/stream/analayze/req";
    this.topicResp = "video/stream/analayze/resp";
    this.clientObj = createMqttClient({
      mqttUrl,
      topic: this.topicResp,
      onConnect: () => {},
      onMessage: (msgTopic, message) => {
        if (onMessage) onMessage(msgTopic, message);
      },
      onError: onError || (() => {}),
      onClose: onClose || (() => {}),
    });
  }

  initialize() {
    const payload = JSON.stringify({ frequnce: 2, time: 15 });
    this.clientObj.client.publish(this.topicReq, payload, { qos: 0 });
  }

  cleanup() {
    if (this.clientObj && this.clientObj.cleanup) {
      this.clientObj.cleanup();
    }
  }
}
