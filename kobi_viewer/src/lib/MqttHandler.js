import mqtt from 'mqtt';

class MqttHandler {
  constructor(mqttUrl) {
    this.mqttUrl = mqttUrl;
    this.client = mqtt.connect(this.mqttUrl);

    this.client.on('connect', () => {
      console.log(`Connected to MQTT broker at ${this.mqttUrl}`);
    });

    this.client.on('error', (error) => {
      console.error('MQTT Connection Error:', error);
    });

    this.client.on('message', (topic, message) => {
      console.log(`Received message on topic "${topic}": ${message.toString()}`);
    });
  }

  subscribe(topic) {
    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe to topic "${topic}":`, err);
      } else {
        console.log(`Subscribed to topic "${topic}"`);
      }
    });
  }

  publish(topic, message) {
    this.client.publish(topic, message, (err) => {
      if (err) {
        console.error(`Failed to publish message to "${topic}":`, err);
      } else {
        console.log(`Published message to "${topic}": ${message}`);
      }
    });
  }

  disconnect() {
    this.client.end(() => {
      console.log('Disconnected from MQTT broker');
    });
  }

  isConnected() {
    return this.client && this.client.connected;
  }

  supportCommand(){
    // Placeholder for future command support
  }
}

export default MqttHandler;
