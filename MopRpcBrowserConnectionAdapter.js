function MopRpcBrowserConnectionAdapter(connection) {
    this.connection = connection;
}

MopRpcBrowserConnectionAdapter.prototype = {
    send: function(message) {
        this.connection.send(message);
    },
    onmessage: function(cb) {
        this.connection.onmessage = cb;
    }
}

module.exports = MopRpcBrowserConnectionAdapter;
