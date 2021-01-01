module.exports = function (msg) {
    const content = msg.d || true;
    const id = this.id;
    let resp;
    try {
        resp = eval(String(content));
    } catch (err) {
        resp = `${err.message}\n\n${err.stack}`;
    }
    this.sendResponse({ resp, id }, msg.code, msg.origin);
};