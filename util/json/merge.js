// (c) Yuoa of Votty
// Update specified json with given data

const parse = require("./parse.js");
const save = require("./save.js");

module.exports = (path, obj) => {
    return parse(path).then(
        ext => {
            // Merge
            const merge = obj =>
                ext instanceof Array
                    ? ext.concat(obj)
                    : Object.assign(ext, obj);

            // Already file exists
            if (obj instanceof Promise)
                return obj.then(res => save(path, merge(res)));
            else return save(path, merge(obj));
        },
        () => {
            // File not exists, just save it
            if (obj instanceof Promise) return obj.then(res => save(path, res));
            else return save(path, obj);
        }
    );
};
