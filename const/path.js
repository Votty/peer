// (c) Yuoa of Votty
// Path consts - Generates static path from root

const os = require("os");
const path = require("path");

module.exports = dir => {
    return {
        // general paths
        LOGFILE: path.join(os.homedir(), ".votty", "log", "peer.log"),

        // resource paths
        RESOURCE: path.join(dir, "resc"),

        // module paths (excluding "const")
        VPEER: path.join(dir, "core"),

        UTIL: {
            ARG: path.join(dir, "util", "arg"),
            BYE: path.join(dir, "util", "bye"),
            JSON: path.join(dir, "util", "json"),
            LOG: path.join(dir, "util", "log"),
            MKDIR: path.join(dir, "util", "mkdir.js"),
            RANDOM: path.join(dir, "util", "random.js"),
            ITERATE: path.join(dir, "util", "iterate.js")
        },

        ERROR: path.join(dir, "error.js"),
        EXIT: path.join(dir, "exit.js")
    };
};
