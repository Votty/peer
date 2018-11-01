// (c) Yuoa of Votty
// Exit control module

module.exports = function(cs, log) {
    const bye = require(cs.path.UTIL.BYE);

    var exitStarted = false;

    var exit = (code, timeout, ng) => {
        if (exitStarted) return;
        exitStarted = true;

        if (timeout >= 500)
            log.info(`Please wait for saving log (ETA: about ${timeout}ms)`);

        if (ng === true) code |= 0xcec0000;

        return setTimeout(() => process.exit(code), timeout);
    };

    // detecting process interrupt events
    process.on("exit", code => {
        fnCode = (code & 0x7fff0000) >>> 16;

        if (fnCode !== 0xcec) log.success(bye(), "vpeer");

        return code & 0xffff;
    });
    process.on("SIGUSR2", e => {
        log.warn(
            "System interrupt detected (maybe by KILL command).",
            "SIGUSR2"
        );

        exit(0, cs.EXIT_TIMEOUT);
    });
    process.on("SIGUSR1", e => {
        log.warn(
            "System interrupt detected (maybe by KILL command).",
            "SIGUSR1"
        );

        exit(0, cs.EXIT_TIMEOUT);
    });
    process.on("SIGINT", e => {
        log.warn(
            "System interrupt detected (maybe by user's CTRL+C).",
            "SIGINT"
        );

        exit(0, cs.EXIT_TIMEOUT);
    });

    return exit;
};
