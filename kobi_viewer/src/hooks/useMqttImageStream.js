import { useEffect } from "react";
import { createMqttClient } from "../lib/mqttClient";

export function fixBase64Padding(str) {
  return str + "=".repeat((4 - (str.length % 4)) % 4);
}

const CONNECTED_LABEL = "متصل";
const DISCONNECTED_LABEL = "غير متصل";

export function useMqttImageStream({
  setImage,
  setImgKey,
  setConnectStatus,
  topic = "video/stream/analayze/resp",
  mqttUrl = "ws://localhost:9001",
}) {
  useEffect(() => {
    setConnectStatus(DISCONNECTED_LABEL); // Set to disconnected before connecting
    const { cleanup } = createMqttClient({
      mqttUrl,
      topic,
      onConnect: () => setConnectStatus(CONNECTED_LABEL),
      onMessage: (msgTopic, message) => {
        if (msgTopic === topic) {
          try {
            const payload = JSON.parse(message.toString());
            if (payload.image) {
              const base64img = fixBase64Padding(payload.image);
              setImage(`data:image/jpeg;base64,${base64img}`);
              setImgKey((k) => k + 1);
            }
          } catch (e) {
            console.error("Error parsing message", e);
          }
        }
      },
      onError: (err) => {
        console.error("MQTT error", err);
        setConnectStatus(DISCONNECTED_LABEL);
      },
      onClose: () => setConnectStatus(DISCONNECTED_LABEL),
    });
    return cleanup;
  }, [mqttUrl, topic, setImage, setImgKey, setConnectStatus]);
}