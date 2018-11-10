// Author: Yuoa@Votty
// JSON management module

const util = require("util");
const fs = require("fs");

const parse = function (json) {
    return util
        .promisify(fs.readFile)(json)
        .then(raw => {
            return JSON.parse(raw);
        });
};

const save = function (path, obj) {
    return util.promisify(fs.writeFile)(
        path,
        JSON.stringify(obj)
    );
};

const merge = (path, obj) => {
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

module.exports = {
    parse: parse, save: save, merge: merge
};
