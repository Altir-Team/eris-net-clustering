const WebSocket = require("ws");
const clients = require("./clients.json");
const ArrHelper = require("./helpers/ArrayHelpers");
const SetHelper = require("./helpers/SetHelpers");

if (!clients.length) throw new Error("No clients =( Configure them please.");

const maxShards = clients.reduce((a, b) => a + b.SHARDS, 0);
const processCount = clients.length;

if (maxShards === 0) throw new Error("0 shards?");

const _shards = ArrHelper.arrayFromNum(maxShards);
const shards = clients.map(c => _shards.splice(0, c.SHARDS));
delete _shards;

const wss = new WebSocket.Server({ port: process.env.PORT });
wss.on("connection", (ws, req) => {
    if (SetHelper.find(wss.clients, x => x.TOKEN === req.headers.authorization)) return ws.terminate();
    ws.id = clients.findIndex(x => x.TOKEN === req.headers.authorization);
    console.log(ws.id)
    if (ws.id === -1) return ws.terminate();
    ws.data = clients[ws.id];
    ws.send(JSON.stringify({
        topic: "connect",
        d: {
            id: ws.id,
            count: processCount,
            shards: shards[ws.id],
            maxShards
        }
    }));
    ws.on("message", content => {
        try {
            const msg = JSON.parse(content);
            if (typeof msg.dest !== "number") return;
            const payload = {
                op: msg.op,
                d: msg.d,
                code: msg.code,
                origin: ws.id % processCount
            };
            if (msg.dest === -1) {
                for (const client of wss.clients) {
                    client.send(JSON.stringify({
                        topic: "broadcast",
                        data: payload
                    }));
                }
            } else {
                SetHelper.find(wss.clients, x => x.id === msg.dest)?.send(JSON.stringify({
                    topic: "relay",
                    data: payload
                }));
            }
        } catch {}
    });
});