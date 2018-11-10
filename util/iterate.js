// Author: Yuoa@Votty
// Iterating Promises

module.exports = (obj, fn, limit) => {
    return new Promise((ok, no) => {
        if (typeof fn("example", "example") !== "function")
            return no("Unsupported iteration function.");

        // NOTE Use "count" variable instead of Object.keys(result),
        //      for in case of many many iteration.
        let iterCount = 0,
            resultCount = 0,
            result = {},
            length = 0;
        let checker = (item, callback, param1, param2) => {
            let value = item,
                key = undefined;

            if (item instanceof Array) (value = item[1]), (key = item[0]);

            if (typeof value !== "undefined")
                if (typeof key === "undefined") result[resultCount] = value;
                else result[key] = value;

            if (++resultCount === length) ok(result);
            else callback(param1, param2);
        };
        let run = (a = () => undefined, b = () => undefined) => {
            let time =
                typeof limit !== "number"
                    ? length
                    : length - iterCount >= limit
                        ? limit
                        : length - iterCount;

            for (let i = 0; i < time; i++)
                new Promise(fn(a(), b())).then(result =>
                    checker(
                        result,
                        time === i + 1 && iterCount !== length ? run : () => { },
                        a,
                        b
                    )
                );
        };

        if (obj instanceof Array) {
            length = obj.length;

            var a = () => obj[iterCount++];

            run(a);
        } else if (typeof obj === "object") {
            let keys = Object.keys(obj);
            length = keys.length;

            var a = () => keys[iterCount];
            var b = () => obj[keys[iterCount++]];

            run(a, b);
        } else if (typeof obj === "number") {
            length = obj;

            run(() => iterCount++);
        } else return no("Unsupported iteration item type.");
    });
};
