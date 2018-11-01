// (c) Yuoa of Votty
// Log module

module.exports = function(cs) {
    var log = {
        text: require("./text.js")(),
        stdout: () => process.stdout,
        stdw: data => process.stdout.write(data),
        fsout: false,
        fsw: undefined
    };

    // HACK data, title, no "fsout warning", log type
    var make = (d, t, nw, l) => {
        let text = log.text[l](d, t);

        if (log.fsw) log.fsw(text.nc);
        else if (typeof fsout == "boolean" && !fsout && !nw)
            log.stdw(log.text.warn("FATAL! Logging to file UNAVAILABLE."));

        log.stdw(text.c);
    };

    // NOTE Synchronized with text.js
    log.info = (d, t, nw = false) => make(d, t, nw, "info");
    log.error = (d, t, nw = false) => make(d, t, nw, "error");
    log.debug = (d, t, nw = false) => make(d, t, nw, "debug");
    log.warn = (d, t, nw = false) => make(d, t, nw, "warn");
    log.success = (d, t, nw = false) => make(d, t, nw, "success");
    log.plain = (d, t, nw = false) => make(d, t, nw, "plain");

    log.init = require("./fsinit.js")(cs, log);

    return log;
};
