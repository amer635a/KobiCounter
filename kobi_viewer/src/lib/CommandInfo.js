// src/lib/CommandInfo.js

class CommandInfo {
  constructor(commandName, { description, reqTopic, respTopic }) {
    this.commandName = commandName;
    this.description = description;
    this.reqTopic = reqTopic;
    this.respTopic = respTopic;
  }
}

export default CommandInfo;
