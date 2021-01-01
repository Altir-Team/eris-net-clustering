const Eris = require("eris");

module.exports = class Bot {
    constructor(options) {
        this.client = new Eris(options.token, options);
        this.options = options;
        this.plugins = new Map;
    }
    addPlugin(name, Plugin, ...options) {
        const plugin = new Plugin(this, ...options);
        this.plugins.set(name, plugin);
        return this;
    }
    async start() {
        for (const plugin of this.plugins.values()) {
            if (typeof plugin.init === "function") await plugin.init();
        }
        return this.client.connect();
    }
}