// (c) Yuoa of Votty
// Log text generator

const util = require("util");
const colors = require("colors");
const moment = require("moment");

module.exports = () => {
    // Color and NoColor = data, title, default title, flag color
    var cnc = (d, t, dT, fC) => {
        let flag = `[${typeof t == "undefined" ? dT : t}]`;
        let time = moment().format("YYYY MMM Do kk:mm:ss.SSS");

        return {
            c: `${flag[fC].bold} ${time.gray} ${d}\n`,

            nc: `${flag} ${time} ${colors.strip(d)}\n`
        };
    };

    // NOTE Synchronized with index.js
    return {
        info: (data, title) => cnc(data, title, "info", "cyan"),

        error: (data, title) => cnc(data, title, "error", "red"),

        debug: (data, title) =>
            cnc(
                typeof data == "string" ? data : util.format("%o", data),
                title,
                "debug",
                "blue"
            ),

        warn: (data, title) => cnc(data, title, "warn", "yellow"),

        success: (data, title) => cnc(data, title, "success", "green"),

        plain: (data, title) => cnc(data, title, "wmix", "strip")
    };
};
