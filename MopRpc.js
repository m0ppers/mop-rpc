var uuid = require("node-uuid");
var mopRpcLogger = require("./mopRpcLogger");

// mop: well..could (should?) use extend
var mergeObjects = function(defaultObject, locals) {
    var localObject = {};
    var localKeys = [];
    if (typeof locals == "object") {
        localKeys = Object.keys(locals);
    }
    Object.keys(defaultObject).forEach(function(key) {
        if (localKeys.indexOf(key) >= 0) {
            localObject[key] = locals[key];
        } else {
            localObject[key] = defaultObject[key];
        }
    })
    return localObject;
}

var bundleReply = function(message, replyFn, options) {
    if (replyFn) {
        var localOptions = mergeObjects(this.defaultOptions, options);

        var id = uuid.v1();
        message.id = id;
        this.replyCbs[id] = replyFn;

        // mop: null => reply at any point in time (EVIL...replyCbs will grow and grow and grow)
        if (localOptions.replyTimeout !== null) {
            this.log.info("Registering a replyCb which is valid for" , localOptions.replyTimeout);
            setTimeout(function() {
                delete this.replyCbs[id];
            }.bind(this), localOptions.replyTimeout);
        } else {
            this.log.info("Registering a replyCb which is valid forever");
        }
    }
}

function MopRpc(connection, options) {
    this.connection = connection;
    this.connection.onmessage(this.receive.bind(this));
    this.handler = {};
    this.receiveHandler = {};
    this.log = mopRpcLogger;
    this.replyCbs = {};

    this.defaultOptions = mergeObjects({"replyTimeout": 5000}, options);
}

MopRpc.prototype = {
    receive: function(rawMessage) {
        this.log.debug("Receiving", rawMessage);
        try {
            var parsed = JSON.parse(rawMessage);
        } catch (e) {
            this.log.error("Message received is not json parseable!", e);
            return;
        }
        
        var targetFn;
        if (parsed.replyId) {
            if (typeof this.replyCbs[parsed.replyId] == "function") {
                this.log.info("Message", parsed, "is expected as a reply and will be handled");
                targetFn = this.replyCbs[parsed.replyId];
            } else {
                this.log.warn("Reply", parsed.replyId, "is not expected!");
            }
        } else if (parsed.type) {
            if (typeof this.receiveHandler[parsed.type] == "function") {
                this.log.info("Message", parsed, "is expected and will be handled");
                targetFn = this.receiveHandler[parsed.type];
            } else {
                this.log.warn("Message", parsed, "is not expected and will be discarded");
            }
        } else {
            this.log.warn("Received garbage", parsed, "discarding");
        }

        if (!targetFn) {
            return;
        }
                
        var replyFn;
        if (parsed.id) {
            this.log.info("Message", parsed, "expects an answer (at least optionally)");
            replyFn = function(payload, replyFn, options) {
                var message = {"replyId": parsed.id, "payload": payload};
                bundleReply.bind(this)(message, replyFn, options);
                this.log.info("Replying to ", parsed, "with", message);
                this.connection.send(JSON.stringify(message));
            }.bind(this);
        }
        targetFn(parsed.payload, replyFn);
    },

    send: function(type, payload, replyFn, options) {
        var message = {"type": type, "payload": payload};
        bundleReply.bind(this)(message, replyFn, options);
        this.log.info("Sending", message);
        this.connection.send(JSON.stringify(message));
    },

    setReceiveHandler: function(receiveHandler) {
        this.receiveHandler = receiveHandler;
    },

    setLog: function(log) {
        this.log = log;
    }
}

module.exports = MopRpc;
