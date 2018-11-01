// (c) Yuoa of Votty
// Help printing module

const colors = require("colors");

module.exports = (cs, log, e) => {
    let isHelp =
        cs.arg.anl.fn.keyword === "help" && cs.arg.anl.obj.length === 0;

    return new Promise((ok, no) => {
        let help = [];

        if (isHelp) {
            help.push(`${"Votty Peer".bold.underline}: ${cs.pkg.description}`);

            help.push(`Usage: ${"vpeer".bold} [FUNCTION] [OPTION]...`);

            let funcList = ["Functions:"];
            let keywordList = [];
            let descList = [];
            let longestKWLength = 0;

            Object.values(cs.arg.FUNC).map(v => {
                let keywordString = "";

                if (typeof v.abbr === "string")
                    keywordString = `${v.keyword}, ${v.abbr}`;
                else keywordString = v.keyword;

                if (keywordString.length > longestKWLength)
                    longestKWLength = keywordString.length;

                keywordList.push(keywordString);

                descList.push(v.description);
            });

            longestKWLength += 6;

            for (let i = 0; i < keywordList.length; i++) {
                let funcString = `  ${keywordList[i]}`;
                let space = longestKWLength - keywordList[i].length;

                for (let j = 0; j < space; j++) funcString += " ";

                funcList.push(funcString + descList[i]);
            }

            help.push(funcList.join("\n"));

            help.push(
                `Run ${
                    "vpeer help FUNCTION".bold
                } for more information on a function.`
            );
        } else {
            cs.arg.anl.obj.forEach(o => {
                let helpFound = false;

                Object.values(cs.arg.FUNC).map(v => {
                    if (
                        o === v.keyword ||
                        o === v.abbr ||
                        (v.alias instanceof Array && v.alias.includes(o))
                    ) {
                        helpFound = true;

                        // Generate "Description" string
                        help.push(`${o.bold.underline}: ${v.description}`);

                        // Generate "Usage" string
                        let usageList = [];
                        usageList.push(
                            `Usage: ${"vpeer".bold} ${v.keyword} [OPTION]...`
                        );

                        if (typeof v.abbr === "string")
                            usageList.push(
                                `Usage: ${"vpeer".bold} ${v.abbr} [OPTION]...`
                            );

                        if (v.alias instanceof Array)
                            v.alias.forEach(a => {
                                usageList.push(
                                    `Usage: ${"vpeer".bold} ${a} [OPTION]...`
                                );
                            });

                        help.push(usageList.join("\n"));

                        // Generate "Options" string
                        if (v.options instanceof Array) {
                            let optionList = ["Options:"];
                            let flagList = [];
                            let descList = [];
                            let longestFlagLength = 0;

                            v.options.forEach(a => {
                                if (typeof cs.arg.OPT[a] === "object") {
                                    let flagString = cs.arg.OPT[a].flags.join(
                                        ", "
                                    );

                                    if (flagString.length > longestFlagLength)
                                        longestFlagLength = flagString.length;

                                    flagList.push(flagString);
                                    descList.push(cs.arg.OPT[a].description);
                                }
                            });

                            longestFlagLength += 6;

                            for (let i = 0; i < flagList.length; i++) {
                                let optString = `  ${flagList[i]}`;
                                let space =
                                    longestFlagLength - flagList[i].length;

                                for (let j = 0; j < space; j++)
                                    optString += " ";

                                optionList.push(optString + descList[i]);
                            }

                            if (optionList.length > 1)
                                help.push(optionList.join("\n"));
                        }
                    }
                });

                if (!helpFound)
                    help.push(
                        `${
                            o.bold.underline
                        }: Help for function "${o}" does not exists.`
                    );
            });

            help.push(
                `Run ${"vpeer help".bold} for list of available functions.`
            );
        }

        log.stdw(`\n${help.join("\n\n")}\n\n`);
    });
};
