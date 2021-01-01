module.exports = class Commands {
    constructor (bot, prefix) {
        this.bot = bot;
        this.prefix = prefix;
        this.cache = new Map;
    }
    init () {
        this.bot.client.on("messageCreate", this.handleMessage.bind(this));
    }
    async handleMessage (msg) {
        if (msg.author.id === this.bot.client.user.id || msg.author.bot) return;
        if (!msg.content.startsWith(this.prefix)) return;
        const args = msg.content.substring(this.prefix.length).trim().split(" ");
        const command = this.resolve(args.shift());
        if (!command) return;
        try {
            await command.run.call(this, msg, args);
        } catch (e) {
            console.error("Failed to execute command %s:", command.name, e);
        }
    }
    add (Command) {
        const command = typeof Command === "function" ? new Command(this) : Command;
        this.cache.set(command.name.toLowerCase(), command);
        return this;
    }
    resolve(pattern) {
        for (const [name, command] of this.cache) {
            if (name === pattern.toLowerCase()) return command;
        }
    }
 }