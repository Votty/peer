#!/usr/bin/env node
// Author: Yuoa@Votty

const init = require("./core/init.js");
const peer = require("./peer");

init.then((core) => {
    switch (core.arg.fn.keyword) {

        case "run":
            return peer(core.arg, core.log, core.e);

    }
});
