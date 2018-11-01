// (c) Yuoa of Votty
// Constants

require("colors");

module.exports = dir => {
    return {
        path: require("./path.js")(dir),
        arg: require("./arg.js")(),

        EXIT_TIMEOUT: 200,
        DEFAULT_FUNC: "daemon"
    };
};
