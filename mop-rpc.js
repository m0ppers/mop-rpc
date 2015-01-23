"use strict";
var MopRpcBrowserConnectionAdapter = require("./MopRpcBrowserConnectionAdapter");
var MopRpcWebsocketConnectionAdapter = require("./MopRpcWebsocketConnectionAdapter");

module.exports = {
    "createAdapter": function(connection) {
        if (typeof window != "undefined" && window.WebSocket && connection && connection instanceof window.WebSocket) {
            return new MopRpcBrowserConnectionAdapter(connection);
        } else if (typeof window == "undefined" && typeof connection && typeof connection.socket == "object") {
            return new MopRpcWebsocketConnectionAdapter(connection);
        } else {
            throw new Error("Unknown connection. Must create adapter manually!");
        }
    },
    "MopRpc": require("./MopRpc"),
    "mopRpcLogger": require("./mopRpcLogger"),
    // mop: whoa ... i am feeling really bad considering these names :S
    "MopRpcConnectionAdapter": require("./MopRpcConnectionAdapter"),
    "MopRpcBrowserConnectionAdapter": MopRpcBrowserConnectionAdapter,
    "MopRpcWebsocketConnectionAdapter": MopRpcWebsocketConnectionAdapter
};
