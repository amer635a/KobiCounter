import mqtt from 'mqtt';
import JsonProvider from '../utils/jsonProvider';
import CommandInfo from './CommandInfo';

class Controller {
  constructor(mqttUrl, metaDataPath = '/MetaData.json', setConnectStatus) {
    this.mqttUrl = mqttUrl;
    this.client = mqtt.connect(this.mqttUrl);
    this.setConnectStatus = setConnectStatus;
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
      if (this.setConnectStatus) this.setConnectStatus('متصل');
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT Connection Error:', error);
      if (this.setConnectStatus) this.setConnectStatus('غير متصل');
    });

    this.client.on('close', () => {
      if (this.setConnectStatus) this.setConnectStatus('غير متصل');
    });

    this.client.on('message', (topic, message) => {
      console.log(`📩 Received message on "${topic}"  `);
      this.commandInfos.forEach((cmdInfo) => {
        if (cmdInfo.respTopic === topic && this.callbacks[cmdInfo.respTopic]) {
          this.callbacks[cmdInfo.respTopic](message.toString());
        }
      });
    });
  }

  async init() {
    try {
      this.commands = await this.jsonProvider.init(); // Now returns commands object
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
      // Use req/resp structure for all commands
      const reqTopic = cmdData.req.reqTopic || `${commandName}/req`;
      const respTopic = cmdData.resp.respTopic || `${commandName}/resp`;
      const cmdInfo = new CommandInfo(commandName, {
        description: cmdData.description,
        reqTopic,
        respTopic
      });
      this.commandInfos.push(cmdInfo);
      this.callbacks[cmdInfo.respTopic] = callback;
      this.subscribe(cmdInfo.respTopic);
      console.log('✅ CommandInfo added and subscribed:', cmdInfo);
    } else {
      console.warn(`⚠️ Command data for "${commandName}" not found.`);
    }
  };
 
  sendRequest = async (commandName, payload) => {
    console.log(`🔄 Sending request for command "${commandName}" with payload:`, payload);
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
