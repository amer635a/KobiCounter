import mqtt from 'mqtt';
import JsonProvider from '../utils/jsonProvider';
import CommandInfo from './CommandInfo';

class Controller {
  constructor(mqttUrl, metaDataPath = '/MetaData.json') {
    this.mqttUrl = mqttUrl;
    this.client = mqtt.connect(this.mqttUrl);
    try {
      this.jsonProvider = new JsonProvider(metaDataPath);
      console.log('✅ JsonProvider instance created');
    } catch (err) {
      console.error('❌ Error creating JsonProvider:', err);
    }

    this.commands = {};
    this.callbacks = {};
    this.commandInfos = [];

    this.client.on('connect', () => {
      console.log(`✅ Connected to MQTT broker at ${this.mqttUrl}`);
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT Connection Error:', error);
    });

    this.client.on('message', (topic, message) => {
      console.log(`📩 Received message on "${topic}": ${message.toString()}`);
      this.commandInfos.forEach((cmdInfo) => {
        if (cmdInfo.respTopic === topic && this.callbacks[cmdInfo.respTopic]) {
          this.callbacks[cmdInfo.respTopic](message.toString());
        }
      });
    });
  }

  async init() {
    try {
      this.commands = await this.jsonProvider.init(); // ✅ This triggers loading
    } catch (err) {
      console.error('❌ Controller init failed:', err);
    }
  }

  subscribe(topic) {
    this.client.subscribe(topic, (err) => {
      if (err) console.error(`❌ Failed to subscribe "${topic}":`, err);
      else console.log(`📡 Subscribed to "${topic}"`);
    });
  }

  publish(topic, message) {
    this.client.publish(topic, message, (err) => {
      if (err) console.error(`❌ Failed to publish to "${topic}":`, err);
      else console.log(`📤 Published to "${topic}": ${message}`);
    });
  }

  disconnect() {
    this.client.end(() => {
      console.log('🛑 Disconnected from MQTT broker');
    });
  }

  isConnected() {
    return this.client?.connected || false;
  }
 
  addCommand = async (commandName, callback) => {
    console.log(`🔧 Adding support for command "${commandName}"`);
    const cmdData = this.jsonProvider.getCommand(commandName);
    if (cmdData) {
      const cmdInfo = new CommandInfo(commandName, cmdData);
      this.commandInfos.push(cmdInfo);
      this.callbacks[cmdInfo.respTopic] = callback; // Register the callback for the response topic
      this.subscribe(cmdInfo.respTopic); // Subscribe to the response topic so callback will work
      console.log('✅ CommandInfo added and subscribed:', cmdInfo);
    } else {
      console.warn(`⚠️ Command data for "${commandName}" not found.`);
    }
  };

  sendRequest = async (commandName, payload) => {
    console.log(`🔄 Sending request for command "${commandName}" with payload:`, payload);
    // Find the CommandInfo object for the commandName
    const cmdInfo = this.commandInfos.find(
      (info) => info && info.commandName === commandName
    );
    if (cmdInfo) {
      this.publish(cmdInfo.reqTopic, JSON.stringify(payload));
      console.log(`📤 Published to topic: ${cmdInfo.reqTopic}`);
    } else {
      console.warn(`⚠️ CommandInfo for "${commandName}" not found in commandInfos.`);
    }
  };
}

export default Controller;
