const WebSocket = require("ws");
const crypto = require("crypto");

module.exports = class Station {
    constructor(bot, wsURL) {
        this.bot = bot;

        this.id = null;
        this.procCount = null;
        this.commands = new Map;
        this.wsURL = wsURL || process.env.WS_MASTER_URL;
        this.ws = new WebSocket(this.wsURL, { headers: { authorization: process.env.WS_AUTH } });
        this.ws.on("message", this.onMessage.bind(this));
    }
    init() {
        return new Promise(async (resolve, reject) => {
            let attempts = +process.env.WS_CONNECT_ATTEMPTS || 5;
            let totalAttempts = 0;
            while (this.ws.readyState !== 1) {
                if (totalAttempts === attempts) return reject(new Error(`Failed connect to master after ${totalAttempts} attempt(s)`));
                await new Promise(r => setTimeout(r, 2000));
                totalAttempts++;
            }
            return resolve(this);
        });
    }
    sendResponse(data, code, dest) {
        this.ws.send(JSON.stringify({
            op: "resp",
            d: data,
            code,
            dest
        }));
    }
    onMessage(message) {
        message = JSON.parse(message);
        if (message.topic === "connected") {
            if (message.d.id >= message.d.count) {
                console.error(new Error("Invalid cluster ID"));
                process.exit();
            }
            this.id = message.d.id;
            this.client.options.maxShards = message.d.maxShards;
            this.client.options.firstShardID = message.d.shards[0];
            this.client.options.lastShard = message.d.shards[message.d.shards.length - 1];
            this.procCount = message.d.count;
            return;
        }
        if (message.topic !== "broadcast") return;

        const command = this.commands.get(message.data.op);
        if (command || command.execute) return (command || command.execute).call(this, message.data);
    }
    addCommand (name, Command) {
        this.commands.set(name, Command);
        return this;
    }
    awaitResponse(op, d = {}, dest = -1) {
        const code = crypto.randomBytes(64).toString("hex");
        const payload = { op, d, dest, code };
        return new Promise((resolve, reject) => {
            const replies = [];
            const awaitListener = (msg) => {
                msg = JSON.parse(msg);
                const data = msg.data;
                if (data.code !== code) return;
                if (!["resp", "error"].includes(data.op)) return;

                if (data.op === "error") return reject(data.d.error);

                replies[data.origin] = data.d;
                for (let i = 0; i < this.procCount; i++) {
                    if (!replies[i]) return;
                }

                this.ws.removeListener("message", awaitListener);
                return resolve(replies);
            };

            this.ws.on("message", awaitListener);
            this.ws.send(JSON.stringify(payload));

            setTimeout(() => {
                this.ws.removeListener("message", awaitListener);
                return reject(new Error("Answer timeout"));
            }, 5000);
        });
    }
}