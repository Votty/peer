// (c) Yuoa of Votty
// Error module

module.exports = (cs, out) => {
    var ep = undefined;

    if (typeof cs !== "undefined" && typeof out !== "undefined") {
        const exit = require(cs.path.EXIT)(cs, out);

        // Error Parser
        ep = function (baseCode, description, willExit = true) {
            return function (e) {
                let code = baseCode;

                if (typeof e.code == "number") code += e.code;

                ep.out.error(
                    `${description}${
                    typeof e.code == "undefined" ? "" : " (" + e.code + ")"
                    }`,
                    `0x${code.toString(16)}`
                );
                delete e.code;

                // NOTE: related with line 77
                if ((e.message || e.msg) && e.name == "debug") {
                    // For custom Errors

                    ep.out.debug(
                        `${e.message || e.msg}`,
                        e.name ? e.name : false,
                        e.name ? false : undefined
                    );

                    delete e.name;

                    if (e.stack)
                        ep.out.debug(
                            e.stack
                                .toString()
                                .substring(e.stack.toString().indexOf("\n")),
                            "stack"
                        );

                    if (Object.keys(e).length > 0)
                        for (one in e) ep.out.debug(e[one], one);

                    if (willExit) exit(code, cs.EXIT_TIMEOUT);
                } else {
                    // For basic Errors

                    if (typeof e.stack !== "undefined")
                        ep.out.debug(e.stack.toString());
                    else ep.out.debug(e);

                    if (willExit) exit(code, cs.EXIT_TIMEOUT);
                }

                return false;
            };
        };

        ep.out = out;
    }

    return {
        // TODO: After ES7, change this from function to class
        make: (detailCode, msg, additionals) => {
            var error = new Error(msg);

            if (typeof additionals == "array" || typeof additionals == "object")
                for (i in additionals) error[i] = additionals[i];
            else if (typeof additionals !== "undefined")
                error["more"] = additionals;

            error.code = detailCode;
            error.name = "debug"; // NOTE: related with line 25

            return error;
        },

        parse: ep
    };
};
