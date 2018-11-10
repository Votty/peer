// Author: Yuoa@Votty
// Exit control module

const YLog = require("./log.js");

var log = new YLog();
var exitStarted = false;
var exit = (code) => {
    if (exitStarted) return;
    exitStarted = true;

    return setTimeout(() => process.exit(code), 0);
};
var ccCount = 0;

// Detecting process interrupt events
process.on("exit", _ => _);
process.on("SIGUSR2", e => {
    log.warn("System interrupt detected (maybe KILL command).", "SIGUSR2");
    exit(0);
});
process.on("SIGUSR1", e => {
    log.warn("System interrupt detected (maybe KILL command).", "SIGUSR1");
    exit(0);
});
process.on("SIGINT", e => {
    if (ccCount++ < 1) {
        log.warn("System interrupt detected (maybe Ctrl+C input).", "SIGINT");
        log.warn("Enter Ctrl+C or SIGINT again in 1.2 seconds to shutdown.", "SIGINT");
        setTimeout(_ => { log.info("Shutdown cancelled.", "SIGINT"); ccCount = 0 }, 1180);
    } else {
        log.warn("Shutdowning, see-ya.", "SIGINT");
        exit(0);
    };
});

module.exports = exit;
