const Bot = require("./structures/Bot");
const Station = require("./plugins/Station");
const Commands = require("./plugins/Commands");
const evalStation = require("./stationCommands/eval");
const evalCommand = require("./commands/eval");

const bot = new Bot({ token: process.env.TOKEN });

bot.addPlugin("station", Station);
bot.addPlugin("commands", Commands, "!");
bot.plugins.get("station").addCommand("eval", evalStation);
bot.plugins.get("commands").add(evalCommand);

bot.start();

bot.client.on("ready", () => console.log('Logged in as', bot.client.user.username));