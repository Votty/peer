// Author: Yuoa@Votty

module.exports = (cc, app, log) => {
    // Create new voting
    app.put("/create", (i, o) => {
        // Check variables
        if (
            i.body &&
            i.body instanceof Array &&
            i.body.length == 6
        ) {
            for(let j in i.body) {
                i.body[j] = JSON.stringify(i.body[j]);
            }
            cc.invoke("createVoting", i.body)
                .then(res => {
                    o.setHeader("Access-Control-Allow-Origin", "*");
                    o.setHeader('Content-Type', 'application/json');
                    o.status(200).json(res);
                });
        } else {
            o.status(400).end("Not properly-encoded JSON type.");
        }
    });

    // Do voting
    app.put("/vote", (i, o) => {
        // Check variables
        if (
            i.body &&
            i.body instanceof Array &&
            i.body.length == 4
        ) {
            for(let j in i.body) {
                i.body[j] = JSON.stringify(i.body[j]);
            }
            cc.invoke("doVoting", i.body)
                .then(res => {
                    o.setHeader("Access-Control-Allow-Origin", "*");
                    o.setHeader("Access-Control-Allow-Methods", "PUT");
                    o.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    o.setHeader('Content-Type', 'application/json');
                    o.status(200).json(res);
                });
        } else {
            o.status(400).end("Not properly-encoded JSON type.");
        }
    });

    // Do voting
    app.put("/verify", (i, o) => {
        // Check variables
        if (
            i.body &&
            i.body instanceof Array &&
            i.body.length == 4
        ) {
            for(let j in i.body) {
                i.body[j] = JSON.stringify(i.body[j]);
            }
            cc.invoke("issueKey", i.body)
                .then(res => {
                    o.setHeader("Access-Control-Allow-Origin", "*");
                    o.setHeader("Access-Control-Allow-Methods", "PUT");
                    o.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    o.setHeader('Content-Type', 'application/json');
                    o.status(200).json(res);
                });
        } else {
            o.status(400).end("Not properly-encoded JSON type.");
        }
    });

    // Request sending email for verification
    app.put("/try", (i, o) => {
        // Check variables
        if (
            i.body &&
            i.body instanceof Array &&
            i.body.length == 2
        ) {
            for(let j in i.body) {
                i.body[j] = JSON.stringify(i.body[j]);
            }
            cc.invoke("sendVerificationEmail", i.body)
                .then(res => {
                    o.setHeader("Access-Control-Allow-Origin", "*");
                    o.setHeader("Access-Control-Allow-Methods", "PUT");
                    o.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    o.setHeader('Content-Type', 'application/json');
                    o.status(200).json(res);
                });
        } else {
            o.status(400).end("Not properly-encoded JSON type.");
        }
    });

    // Get Information
    app.get("/info", (i, o) => {
        if (i.query.seed) {
            cc.query("getVotingStatus", [JSON.stringify(i.query.seed)])
                .then(res => {
                    if (res === false) {
                        o.status(500).end("Several response caught.");
                    } else {
                        o.setHeader("Access-Control-Allow-Origin", "*");
                        o.setHeader('Content-Type', 'application/json');
                        if (res instanceof Error) {
                            o.status(400).json({
                                status: res.status,
                                message: res.message,
                                data: null
                            });
                        } else {
                            let vi = JSON.parse(res.toString());
                            o.status(200).json({
                                status: 200,
                                message: null,
                                data: vi
                            });
                        }
                    }
                }, e => o.status(500).end("Fetching process error."));
        } else {
            o.status(404).end("Seed not entered.");
        }
    });

    app.use((i, o) => {
        log.debug(i.method);
        o.setHeader("Access-Control-Allow-Origin", "*");
        o.setHeader("Access-Control-Allow-Methods", "GET,PUT");
        o.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        o.status(200).end("Votty Back-end Service.");
    });

    return app;
};
