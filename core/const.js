// Author: Yuoa@Votty
// Program constants

const os = require("os");
const path = require("path");

module.exports = {
    APPNAME: "Votty Peer",
    APPNAME_ABBR: "vpeer",

    LOG_DIR: path.join(os.homedir(), ".vpeer", "log"),
    LOG_DEFAULT_FILE: "peer.log",

    APP_DEFFUNC: "run",
    APP_FUNC: {
        run: {
            keyword: "run",
            abbr: "r",
            alias: ["api"],
            description: "Launch Votty peer API server",
            option: ["port"],
            log: "api.log"
        },
        install: {
            keyword: "install",
            abbr: "i",
            description: "Instantiate votty to the chain"
        },
        chaincode: {
            keyword: "chaincode",
            abbr: "cc",
            description: "Returns hyperledger chaincode. (Only for development purpose.)"
        }
    },
    APP_OPT: {
        port: {
            flags: ["--port", "-p"],
            type: "ARGOPT_WITH_DATA",
            description: "Start the web server to given port (Default: 7049)."
        }
    }
};
