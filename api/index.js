// Author: Yuoa@Votty

const express = require("express");
const chain = require("./chain.js");
const bind = require("./bind.js");

module.exports = (arg, log, e) => {
    // Load express server
    const app = express();
    app.set("etag", "strong");
    app.disable("x-powered-by");
    app.use(express.json({
        limit: '10mb'
    }));
    
    // Prepare Blockchain
    chain(log).then(cc => bind(cc, app, log).listen(arg.port || 7049, () => {

        log.info(`Votty backend server launched at port ${arg.port || 7049}.`);
                
    }));
};
