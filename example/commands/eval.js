const { inspect } = require("util");

module.exports = {
    name: "eval",
    run: async function (msg, args) {
       const evaled = inspect(await eval(args.join(" ")), { depth: 0 });
       return msg.channel.createMessage(evaled);
    }
}