class JsonProvider {
  constructor(jsonPath = '/MetaData.json') {
    this.jsonPath = jsonPath;
    this.data = null;
  }

  async init() {
    try {
      console.log('🔧 JsonProvider initialized with path:', this.jsonPath);

      const response = await fetch(this.jsonPath);
      if (!response.ok) {
        throw new Error(`Failed to load JSON file: ${response.statusText}`);
      }

      this.data = await response.json();
      console.log('✅ JSON loaded:', this.data);
    } catch (error) {
      console.error('❌ Failed to initialize JsonProvider:', error);
      throw error;
    }
  }

  getData() {
    return this.data;
  }

  getCommand(commandName) {
    if (!this.data || !this.data.commands) return undefined;

    const command = this.data.commands[commandName];
    if (!command) return undefined;

    // Normalize flat format for backward compatibility (optional)
    if (command.reqTopic && command.respTopic) {
      return {
        description: command.description,
        req: { reqTopic: command.reqTopic },
        resp: { respTopic: command.respTopic }
      };
    }

    return command;
  }
}

export default JsonProvider;
