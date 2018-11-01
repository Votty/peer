// (c) Yuoa of Votty
// Saving JSON file and return its promise.

module.exports = function(path, obj) {
    return require("util").promisify(require("fs").writeFile)(
        path,
        JSON.stringify(obj)
    );
};
