import mqtt from "mqtt";

/**
 * Creates an MQTT client and manages connection, subscription, and message handling.
 * @param {Object} options
 * @param {string} options.mqttUrl - The MQTT broker URL.
 * @param {string} options.topic - The topic to subscribe to.
 * @param {function} options.onMessage - Callback for incoming messages (msgTopic, message).
 * @param {function} [options.onConnect] - Optional callback for connect event.
 * @param {function} [options.onError] - Optional callback for error event.
 * @param {function} [options.onClose] - Optional callback for close event.
 * @returns {Object} The MQTT client instance and a cleanup function.
 */
export function createMqttClient({ mqttUrl, topic, onMessage, onConnect, onError, onClose }) {
  const client = mqtt.connect(mqttUrl);

  client.on("connect", () => {
    client.subscribe(topic);
    if (onConnect) onConnect();
  });

  client.on("message", (msgTopic, message) => {
    if (onMessage) onMessage(msgTopic, message);
  });

  client.on("error", (err) => {
    if (onError) onError(err);
    client.end();
  });

  client.on("close", () => {
    if (onClose) onClose();
  });

  // Cleanup function to end the client
  function cleanup() {
    client.end();
  }

  return { client, cleanup };
}
