// (c) Yuoa of Votty
// Argument parsing module

require("colors");

module.exports = function(cs, e) {
    var analyzed = {
        fn: undefined,
        obj: []
    };

    var funcHelp = {
        keyword: "help",
        abbr: "h",
        alias: [],
        description: "Print help message.",
        dockerStep: [],
        options: []
    };

    return new Promise((ok, no) => {
        if (process.argv.length < 2)
            no(
                e.make(
                    0x1,
                    "Argument input is too short. You may run Votty Peer on unsupported environment.",
                    { arguments: process.argv }
                )
            );
        else if (process.argv.length == 2) process.argv.push(cs.DEFAULT_FUNC);

        // Gather all available keywords
        let avKeywords = { help: funcHelp, h: funcHelp };
        for (f in cs.arg.FUNC) {
            avKeywords[cs.arg.FUNC[f].keyword] = cs.arg.FUNC[f];
            avKeywords[cs.arg.FUNC[f].abbr] = cs.arg.FUNC[f];

            for (i in cs.arg.FUNC[f].alias)
                avKeywords[cs.arg.FUNC[f].alias[i]] = cs.arg.FUNC[f];
        }

        let optDataComes = null;
        process.argv.slice(2).forEach((v, i, a) => {
            if (i == 0) {
                // Save function
                if (typeof avKeywords[v] == "object")
                    analyzed.fn = avKeywords[v];
                else
                    return no(
                        e.make(
                            0x2,
                            `${v}: Unknown function name. Type ${
                                "vpeer help".white.bold.underline
                            } for available functions.`
                        )
                    );

                // Make option lists
                analyzed.optionSet = {};
                analyzed._reqOptList = [];
                if (typeof analyzed.fn.options != "undefined")
                    for (i in analyzed.fn.options) {
                        if (cs.arg.OPT[analyzed.fn.options[i]].required)
                            analyzed._reqOptList.push(analyzed.fn.options[i]);
                        for (j in cs.arg.OPT[analyzed.fn.options[i]].flags)
                            analyzed.optionSet[
                                cs.arg.OPT[analyzed.fn.options[i]].flags[j]
                            ] = analyzed.fn.options[i];
                    }
            } else {
                if (typeof optDataComes == "string") {
                    analyzed[optDataComes] = v;
                    optDataComes = null;
                } else if (v in analyzed.optionSet) {
                    let _reqIdx = analyzed._reqOptList.indexOf(
                        analyzed.optionSet[v]
                    );
                    if (_reqIdx >= 0)
                        analyzed._reqOptList = analyzed._reqOptList.splice(
                            _reqIdx,
                            1
                        );

                    switch (cs.arg.OPT[analyzed.optionSet[v]].type) {
                        // Next argument will not be this options data
                        case "ARGOPT_NO_DATA":
                            analyzed[analyzed.optionSet[v]] = true;
                            break;

                        // Next argument will be this options data
                        case "ARGOPT_WITH_DATA":
                            optDataComes = analyzed.optionSet[v];
                            break;
                    }
                } else if (v[0] == "-")
                    return no(
                        e.make(
                            0x3,
                            `${v}: Unknown option name. Type ${
                                ("vpeer help " + analyzed.fn.keyword).white.bold
                                    .underline
                            } for available options.`
                        )
                    );
                else analyzed.obj.push(v);
            }
        });

        if (analyzed._reqOptList.length > 0) {
            let arrForHelp = [];

            for (opt in analyzed._reqOptList) {
                let tempObj = {};
                tempObj[
                    cs.arg.OPT[analyzed._reqOptList[opt]].flags.join(" or ")
                ] = cs.arg.OPT[analyzed._reqOptList[opt]].description;

                arrForHelp.push(tempObj);
            }

            return no(e.make(0x4, "Required option is not set.", arrForHelp));
        } else {
            delete analyzed._reqOptList;
            return ok(analyzed);
        }
    });
};
