// Author: Votty

const Vapp = require("./Vapp");
const cli = require("fabric-client");
const ccli = require("fabric-ca-client");
const shim = require("fabric-shim");

module.exports = {
    live: () => shim.start(new Vapp()),
    install: (arg, log, e) => {
        
    }
};
