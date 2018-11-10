// Author: Yuoa@Votty
// Program initializing

const path = require("path");
const exit = require("./exit.js");
const YError = require("./error.js");
const YLog = require("./log.js");
const arhe = require("./arghelp.js");
const cs = require("./const.js");
const json = require("../util/json.js");

var log = new YLog(cs.APPNAME_ABBR, cs.DIR_LOG, cs.FILE_LOG);
var e = new YError(log);
var pkg, arg;

module.exports =
    // Read "package.json"
    json.parse(
        path.resolve("package.json")
    ).then(parsedPkg => {
        pkg = parsedPkg;
        return arhe.parse(e);
    }, e.parse(0x110, "Fatal error occurred while parsing 'package.json'.", true))

        // If no arguments, or want, display help
        .then(analyzedArg => {
            arg = analyzedArg;

            if (arg.fn.keyword == "help")
                return arhe
                    .help(arg, pkg, log)
                    .then(exit(0))
                    .catch(
                        e.parse(
                            0x140,
                            "Fatal error occurred while printing help message.",
                            true
                        )
                    );
            else return "❤";
        }, e.parse(0x120, "Fatal error occurred while parsing arguments.", true))

        // Wait for 5 ticks and start program
        .then(_ => {
            // Wait 50 ticks for safely load log module
            return new Promise(ok => setTimeout(_ => {
                ok({
                    log: log, e: e, pkg: pkg, arg: arg
                })
            }, 200));
        }, e.parse(0x100, "Fatal error from unknown cause.", true));
