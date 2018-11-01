// (c) Yuoa of Votty
// Parsing JSON file and return promise with parsed data as parameter.

module.exports = function(json) {
    return require("util")
        .promisify(require("fs").readFile)(json)
        .then(raw => {
            return JSON.parse(raw);
        });
};
