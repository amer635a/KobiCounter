import { useEffect } from "react";
import { createMqttClient } from "../lib/mqttClient";

export function useMqttInfo({ setInfo, mqttUrl = "ws://localhost:9001" }) {
  useEffect(() => {
    let cleanup;
    const topicReq = "analayze/info/req";
    const topicResp = "analayze/info/resp";
    const clientObj = createMqttClient({
      mqttUrl,
      topic: topicResp,
      onConnect: () => {
        // Send request for info
        clientObj.client.publish(topicReq, "{}", { qos: 0 });
      },
      onMessage: (msgTopic, message) => {
        if (msgTopic === topicResp) {
          try {
            const payload = JSON.parse(message.toString());
            setInfo(payload);
          } catch (e) {
            setInfo({ error: "خطأ في البيانات" });
          }
        }
      },
      onError: () => setInfo({ error: "خطأ في الاتصال" }),
      onClose: () => {},
    });
    cleanup = clientObj.cleanup;
    return cleanup;
  }, [setInfo, mqttUrl]);
}
