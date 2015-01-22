var noop = function() {};

// mop: interface for logger implementation :S (SLIGHT COINCIDENCE THAT IT MATCHES BUNYAN'S LOGLEVELS :O)
module.exports = {
    fatal: noop,
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop
}
