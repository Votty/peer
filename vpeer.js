#!/usr/bin/env node

// (c) Yuoa of Votty
// Initial script

const cs = require("./const")(__dirname); // "Core Storage"
const arg = require(cs.path.UTIL.ARG);
const log = require(cs.path.UTIL.LOG)(cs);
const e = require(cs.path.ERROR)(cs, log);

// Parse "package.json" → Save it as cs.pkg and parse arguments
require(cs.path.UTIL.JSON)
    .parse("./package.json")
    .then(pkg => {
        cs.pkg = pkg;

        return arg.parse(cs, e);
    }, e.parse(0x110, "Fatal error occurred while parsing 'package.json'."))

    // If no arguments or want, display help
    .then(anl => {
        cs.arg.anl = anl;

        if (anl.fn.keyword == "help")
            return arg
                .help(cs, log, e)
                .then(require(cs.path.EXIT)(cs, log)(0, cs.EXIT_TIMEOUT, true))
                .catch(
                    e.parse(
                        0x140,
                        "Fatal error occurred while printing help message."
                    )
                );
        else return log.init();
    }, e.parse(0x120, "Fatal error occurred while parsing arguments."))

    // Start program core features
    .then(rn => {
        // 'false' is a return value of e.parse
        //   → If error occurred during parsing arguments, do not run this section
        //     cf. When it goes to help part,
        //         there's already a Promise in help, so don't care about that case.
        if (rn !== false) {
            log.info("Logging module initialization successful.");

            if (rn) log.info('Old log moved to "' + rn + '".');

            if (cs.arg.anl.fn.keyword == "daemon")
                return require(cs.path.VPEER)(cs, log, e);
        }
    }, e.parse(0x130, "Fatal error occurred while initializing logging module."))
    .catch(e.parse(0x100, "Fatal error occurred, by unknown cause."));
