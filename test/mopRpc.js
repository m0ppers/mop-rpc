var assert = require("assert");
var MopRpc = require("../MopRpc");

function ConnectionMock(cb) {
    this.cb = cb;
}

ConnectionMock.prototype = {
    send: function(data) {
        this.cb("send", data);
    },
    fakeReceive: function(data) {
        var parsed = JSON.parse(data);
        this.onmessage({"type": "utf8", "utf8Data": JSON.stringify(parsed)});
    }
}
describe("Mop Rpc", function() {
    it("should properly json encode a message when sending", function(done) {
        var mopRpc = new MopRpc(new ConnectionMock(function(type, rawMessage) {
            assert.equal(type, "send");
            var parsed = JSON.parse(rawMessage);
            assert.equal(typeof parsed.type, "string");
            assert.deepEqual(parsed, {"type": "test", "payload": {"test": "nein"}});
            done();
        }));
        mopRpc.send("test", {"test": "nein"});
    });
    it("should invalidate replies after a given time", function(done) {
        var mopRpc = new MopRpc(new ConnectionMock(function(type, rawMessage) {
            var parsed = JSON.parse(rawMessage);
            setTimeout(function() {
                if (typeof mopRpc.replyCbs[parsed.replyId] == "function") {
                    done("replyCb is not deleted");
                } else {
                    done();
                }
            }, 1);
        }));
        mopRpc.send("test", undefined, function() {
        }, {"replyTimeout": 0});
    });
    it("should allow messages which wait for a reply indefinately", function(done) {
        var mopRpc = new MopRpc(new ConnectionMock(function(type, rawMessage) {
            var parsed = JSON.parse(rawMessage);
            assert(typeof mopRpc.replyCbs[parsed.replyId], "function");
            done();
        }));
        mopRpc.send("test", undefined, function() {
        }, {"replyTimeout": null});
    });
    it("should not fail if garbage is sent", function() {
        var connectionMock = new ConnectionMock(function(type, rawMessage) {
        });
        var mopRpc = new MopRpc(connectionMock);
        connectionMock.onmessage(undefined);
    });
    it("should not fail if an invalid message format is sent", function() {
        var connectionMock = new ConnectionMock(function(type, rawMessage) {
        });
        var mopRpc = new MopRpc(connectionMock);
        connectionMock.fakeReceive(JSON.stringify({}));
    });
    it("should call a receivehandler if it has been installed", function(done) {
        var connectionMock = new ConnectionMock(function(type, rawMessage) {
        });
        var mopRpc = new MopRpc(connectionMock);
        mopRpc.setReceiveHandler({
            "test": function(payload) {
                assert.equal(payload, "test");
                done();
            }
        });
        connectionMock.fakeReceive(JSON.stringify({"type": "test", "payload": "test"}));
    });
    it("should not offer a replyFn if the sender does not expect a reply", function(done) {
        var connectionMock = new ConnectionMock(function(type, rawMessage) {
        });
        var mopRpc = new MopRpc(connectionMock);
        mopRpc.setReceiveHandler({
            "test": function(payload, replyFn) {
                assert.equal(typeof replyFn, "undefined");
                done();
            }
        });
        connectionMock.fakeReceive(JSON.stringify({"type": "test", "payload": "test"}));
    });
    it("should offer a replyFn if the sender expects one", function(done) {
        var connectionMock = new ConnectionMock(function(type, rawMessage) {
        });
        var mopRpc = new MopRpc(connectionMock);
        mopRpc.setReceiveHandler({
            "test": function(payload, replyFn) {
                assert.equal(typeof replyFn, "function");
                done();
            }
        });
        connectionMock.fakeReceive(JSON.stringify({"type": "test", "payload": "test", "id": 1}));
    });
    it("should not fail when getting an unregistered reply", function() {
        var connectionMock = new ConnectionMock(function(type, rawMessage) {
        });
        var mopRpc = new MopRpc(connectionMock);
        connectionMock.fakeReceive(JSON.stringify({"replyId": 1, "payload": "test", "id": 1}));
    });
    it("should allow back and forth communication", function(done) {
        // mop: this is the "TALK TO THE HAND" test :D
        var connectionMock = new ConnectionMock(function(type, rawMessage) {
            connectionMock.fakeReceive(rawMessage);
        });
        var mopRpc = new MopRpc(connectionMock);
        mopRpc.setReceiveHandler({
            "test": function(payload, replyFn) {
                replyFn("testload", function(payload) {
                    assert.equal(payload, "annnnd back");
                    done();
                });
            }
        });
        mopRpc.send("test", undefined, function(payload, replyFn) {
            assert.equal(payload, "testload");
            replyFn("annnnd back");
        });
    });
});
