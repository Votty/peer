// Author: Yuoa@Votty
// Program constants

const os = require("os");
const path = require("path");

module.exports = {
    APPNAME: "Votty Peer",
    APPNAME_ABBR: "vpeer",

    LOG_DIR: path.join(os.homedir(), ".vpeer", "log"),
    LOG_DEFAULT_FILE: "peer.log",

    HFC_STORE_DIR: path.join(os.homedir(), ".vpeer", "keystore"),

    APP_DEFFUNC: "run",
    APP_FUNC: {
        run: {
            keyword: "run",
            abbr: "r",
            alias: ["api"],
            description: "Launch Votty peer API server",
            options: ["port"],
            log: "api.log"
        },
        install: {
            keyword: "install",
            abbr: "i",
            description: "Instantiate votty to the chain with creating docker containers",
            options: ["dockerSocket", "fullNode", "woOrderer"]
        },
        update: {
            keyword: "update",
            abbr: "u",
            description: "Update votty chaincode",
            options: ["dockerSocket"]
        },
        chaincode: {
            keyword: "chaincode",
            abbr: "cc",
            description: "Returns hyperledger chaincode. (Only for development purpose)"
        }
    },
    APP_OPT: {
        port: {
            flags: ["--port", "-p"],
            type: "ARGOPT_WITH_DATA",
            description: "Start the web server to given port (Default: 7049)."
        },
        dockerSocket: {
            flags: ["--sock", "-s"],
            type: "ARGOPT_WITH_DATA",
            description: "Set docker socket path (Default: /var/run/docker.sock)."
        },
        fullNode: {
            flags: ["--full", "--ca"],
            type: "ARGOPT_WITHOUT_DATA",
            description: "Installs full node including CA."
        },
        woOrderer: {
            flags: ["--without-orderer"],
            type: "ARGOPT_WITHOUT_DATA",
            description: "Doesn't install orderer node."
        }
    }
};
