#!/usr/bin/env node
// Author: Yuoa@Votty

const core = require("./core");
const cc = require("./chaincode");
const api = require("./api");

core.then((core) => {
    switch (core.arg.fn.keyword) {

        case "run":
            return api(core.arg, core.log, core.e);

        case "install":
            return cc.install(core.arg, core.log, core.e);

        case "chaincode":
            return cc.live();

    }
});
