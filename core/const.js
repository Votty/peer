// Author: Yuoa@Votty
// Program constants

const os = require("os");
const path = require("path");

module.exports = {
    APPNAME: "Votty Peer",
    APPNAME_ABBR: "vpeer",

    DIR_LOG: path.join(os.homedir(), ".vpeer", "log"),
    FILE_LOG: "peer.log",

    APP_DEFFUNC: "run",
    APP_FUNC: {
        run: {
            keyword: "run",
            description: "Launch Votty peer",
            option: []
        }
    },
    APP_OPT: {}
};
