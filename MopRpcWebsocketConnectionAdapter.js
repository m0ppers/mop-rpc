function MopRpcWebsocketConnectionAdapter(connection) {
    this.connection = connection;
}

MopRpcWebsocketConnectionAdapter.prototype = {
    send: function(message) {
        this.connection.send(message);
    },
    onmessage: function(cb) {
        this.connection.on("message", function(message) {
            if (message.type == "utf8") {
                cb(message.utf8Data);
            } else {
                // mop: welll... no log here and not sure if throwing an exception here is really cool :S use console.log (so we have at least SOME hint that something evil is going on :S)
                console.log("Got message type", message.type, "discarded...");
            }
        });
    }
}

module.exports = MopRpcWebsocketConnectionAdapter;
