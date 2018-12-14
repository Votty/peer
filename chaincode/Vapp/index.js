// Author: Yuoa@Votty
/*
 TODO List
 - On ESnext, change "common functions" private.
 */

"use strict";

const shim = require("fabric-shim");
const util = require("util");
const random = require("./random.js");
const moment = require("./lib/moment.js");
const hdkey = require("./lib/hdkey.js");
const base64 = require("./lib/base64.js").Base64;

const Vapp = module.exports = class Votty {

    /* Interfaces of Chaincode */

    async Init(stub) {
        console.info("Thanks for using Votty platform! Successfully instantiated.");
        this.tempVerifyCode = {};
        return shim.success();
    }

    async Invoke(stub) {
        let fupa = stub.getFunctionAndParameters();
        console.info(`\n>>>>> New processing requested\n${util.format("%o", fupa)}\n=====\n`);
        if (typeof this[fupa.fcn] === "function") {
            try {
                let res = await this[fupa.fcn](stub, fupa.params);
                return shim.success(res instanceof Buffer ? res : Buffer.from(JSON.stringify(res)));
            } catch (e) {
                return this.reportError(e);
            }
        } else
            return this.reportError(`Invalid function: ${fupa.fcn}`);
    }

    /* Common Functions */

    reportError(msg, ...subMsg) {
        console.error(msg);
        if (subMsg)
            for (let m of subMsg) console.error(m);
        return shim.error(msg);
    }

    parseBuffer(buffer) {
        if (buffer instanceof Buffer) {
            try {
                return JSON.parse(buffer.toString());
            } catch (e) {
                return e;
            }
        } else
            return new Error("Parameter is not a Buffer.");
    }

    isVoteEnded(vi, ptcpInfo) {
        if (typeof vi.endTime !== "undefined") {
            return (vi.endTime < Number(moment().format('x')))
                || (vi.permitDirectResult && vi.ptcpCount == ptcpInfo.voted);
        } else
            return true;
    }

    assert(test, msg) {
        if (typeof test === "boolean") {
            if (!test) {
                this.reportError(msg);
                throw new Error(msg);
            }
        } else {
            this.reportError("Assertion failed: not boolean type");
            throw new Error("Assertion failed: not boolean type");
        }
    }

    parseArgs(args, ...labels) {
        // Check args
        this.assert(args && args instanceof Array);

        // Check the number of args
        this.assert(args.length == labels.length, `Argument length does not match (received: ${args.length}, expected: ${labels.length})`);

        // Check that is all string type and parse it
        let parsed = {};
        for (let i in labels) {
            this.assert(typeof args[i] === "string", `\`${labels[i][0]}\` must be passed as string type`);
            
            try {
                let eachParsed = JSON.parse(args[i]);
                if (labels[i][2] == Array) this.assert(eachParsed instanceof Array);
                else eachParsed = labels[i][2](eachParsed);

                if (typeof labels[i][3] === "function" && !labels[i][3](eachParsed)) {
                    if (typeof labels[i][4] === "string")
                        throw new Error(labels[i][4]);
                    else
                        throw new Error("Argument condition checking failed");
                } else {
                    parsed[labels[i][1]] = eachParsed;
                }
            } catch (e) {
                this.reportError(`\`${labels[i][0]}\` is not properly-encoded string`);
                throw e;
            }
        }

        // Return parsed data
        return parsed;
    }

    genRandHash(len, base) {
        var gen = "";
        while(gen.length < len)
            gen += random(0, Number.MAX_SAFE_INTEGER / 64).toString(base || 36);
        return gen.substring(0, len);
    }

    /* Votty Querying Functions */

    async getVotingStatus(stub, args) {
        let pa = this.parseArgs(args, 
            ["Voting Seed", "seed", String, _ => _.length == 256]
            );

        let viBytes = await stub.getState(pa.seed);

        // If information exists, get result data from it
        if (viBytes == null)
            return this.reportError(`No voting information exists with given vote code`);
        else {
            let vi = this.parseBuffer(viBytes);

            if (vi instanceof Error)
                return this.reportError("Error occured while fetching information", vi);
            else {
                // From now, vi is successfully parsed voting information object
                // Then, below two must be correctly saved and must be correctly parsed
                let candInfo = JSON.parse(await stub.getState(`${pa.seed}.candidates`));
                let ptcpInfo = JSON.parse(await stub.getState(`${pa.seed}.participants`));

                let isVoteEnded = this.isVoteEnded(vi, ptcpInfo);

                // Append voting rate
                if (vi.permitLiveRate || isVoteEnded) {
                    vi.rate = ptcpInfo.voted / vi.ptcpCount;
                } else {
                    vi.rate = false;
                }

                // Append voting result
                if (isVoteEnded) {
                    vi.result = candInfo;
                    vi.votedCount = ptcpInfo.voted;
                } else {
                    vi.result = false;
                    vi.votedCount = false;
                }

                // Return the information
                return vi;
            }
        }
    }

    /* Votty Invoking Functions */

    async doVoting(stub, args) {
        let pa = this.parseArgs(args,
            ["Key Path", "path", String, _ => _.length == 1024],
            ["Public Key", "key", String, _ => _ !== "null"],
            ["Voting ID", "seed", String, _ => _.length == 256],
            ["Candidate ID", "cand", String, _ => _.length == 16]
            );

        let viBytes = await stub.getState(pa.seed);

        // If information exists, continue to vote
        if (viBytes == null)
            return this.reportError(`No voting information exists with given vote code`);
        else {
            let vi = this.parseBuffer(viBytes);

            if (vi instanceof Error)
                return this.reportError("Error occured while fetching information", vi);
            else {
                // From now, vi is successfully parsed voting information object
                // Then, below two must be correctly saved and must be correctly parsed
                let candInfo = JSON.parse(await stub.getState(`${pa.seed}.candidates`));
                let ptcpInfo = JSON.parse(await stub.getState(`${pa.seed}.participants`));
                let genHex = JSON.parse(await stub.getState(`${pa.seed}.seed`));

                // Check if vote is now ongoing
                this.assert(this.isVoteEnded(vi, ptcpInfo), `This voting is already ended`);

                // Check if the participant voted
                const key = hdkey.fromMasterSeed(new Buffer(genHex, 'hex'));
                const hash = base64.encode(pa.key);
                this.assert(pa.key === key.derive(`m/${pa.path.match(/.{1,8}/g).join("/")}`).publicKey.toString("hex"), `Public key cannot be derived from given key path`);
                this.assert(typeof ptcpInfo[hash] === "boolean", `The participant does not exists`);
                this.assert(ptcpInfo[hash] === false, `The participant already voted`);

                // Check if that candidate exists
                this.assert(typeof candInfo[pa.cand] === "number", `The candidate does not exists`);
                
                // Process the voting
                candInfo[pa.cand] += 1;
                ptcpInfo[hash] = true;
                ptcpInfo.voted += 1;

                // Publish the voting
                await stub.putState(`${pa.seed}.participants`, Buffer.from(JSON.stringify(ptcpInfo)));
                await stub.putState(`${pa.seed}.candidates`, Buffer.from(JSON.stringify(candInfo)));

                // Return the status
                return true;
            }
        }
    }

    async sendVerificationEmail(stub, args) {
        let pa = this.parseArgs(args,
            ["Email Address", "mail", String, _ => _ !== "null"],
            ["Voting Seed", "seed", String, _ => _ !== "null"]
            );

        // Verify is existing voting
        let viBytes = await stub.getState(pa.seed);

        // If information exists, continue to vote
        if (viBytes == null)
            return this.reportError(`No voting information exists with given voting seed`);
        else {
            let vi = this.parseBuffer(viBytes);

            if (vi instanceof Error)
                return this.reportError("Error occured while fetching information", vi);
            else {
                // From now, vi is successfully parsed voting information object
                // Then, below two must be correctly saved and must be correctly parsed
                let mails = JSON.parse(await stub.getState(`${pa.seed}.mails`));
                let ptcpInfo = JSON.parse(await stub.getState(`${pa.seed}.participants`));

                // Check if vote is now ongoing
                this.assert(this.isVoteEnded(vi, ptcpInfo), `This voting is already ended`);

                // Check if the participant key already issued
                this.assert(typeof mails[pa.mail] === "boolean", `The participant does not exists`);
                this.assert(mails[pa.mail] === false, `The participant already issued a key`);

                const session = this.genRandHash(256);
                this.tempVerifyCode[session] = {
                    email: pa.mail,
                    seed: pa.seed,
                    code: this.genRandHash(6)
                };
            
                setTimeout(() => {
                    delete this.tempVerifyCode[session];
                }, 1800000);
            
                // TODO: Send email here and remove verification code from response
            
                return {
                    session: session,
                    answer: this.tempVerifyCode[session].code
                };
            }
        }
    }

    async issueKey(stub, args) {
        let pa = this.parseArgs(args,
            ["Email Address", "mail", String, _ => _ !== "null"],
            ["Voting Seed", "seed", String, _ => _.length == 256],
            ["Verification Code", "code", String, _ => _ !== "null"],
            ["Verification Session Key", "session", String, _ => _ !== "null"]
            );
        
        // Verify is existing voting
        let viBytes = await stub.getState(pa.seed);

        // If information exists, continue to vote
        if (viBytes == null)
            return this.reportError(`No voting information exists with given voting seed`);
        else {
            let vi = this.parseBuffer(viBytes);

            if (vi instanceof Error)
                return this.reportError("Error occured while fetching information", vi);
            else {
                // From now, vi is successfully parsed voting information object
                // Then, below two must be correctly saved and must be correctly parsed
                let mails = JSON.parse(await stub.getState(`${pa.seed}.mails`));
                let ptcpInfo = JSON.parse(await stub.getState(`${pa.seed}.participants`));
                let genHex = JSON.parse(await stub.getState(`${pa.seed}.seed`));

                // Check if vote is now ongoing
                this.assert(this.isVoteEnded(vi, ptcpInfo), `This voting is already ended`);

                // Check if the participant key already issued
                this.assert(typeof mails[pa.mail] === "boolean", `The participant does not exists`);
                this.assert(mails[pa.mail] === false, `The participant already issued a key`);

                this.assert(typeof this.tempVerifyCode[pa.session] === "object", `Invalid session key`);
                this.assert(this.tempVerifyCode[pa.session].seed === pa.seed, `Voting ID and session key does not match`);
                this.assert(this.tempVerifyCode[pa.session].mail === pa.email, `Email address and session key does not match`);
                this.assert(this.tempVerifyCode[pa.session].code === pa.code, `Verification code does not match`);

                const key = hdkey.fromMasterSeed(new Buffer(genHex, 'hex'));
                const path = this.genRandHash(1024, 10);
                const dKey = key.derive(`m/${path.match(/.{1,8}/g).join("/")}`);
                const hash = base64.encode(dKey.publicKey.toString("hex"));
                
                // Process the voting
                mails[pa.mail] = true;
                ptcpInfo[hash] = false;

                // Publish the voting
                await stub.putState(`${pa.seed}.participants`, Buffer.from(JSON.stringify(ptcpInfo)));
                await stub.putState(`${pa.seed}.mails`, Buffer.from(JSON.stringify(mails)));

                // Return the status
                return {
                    path: path,
                    key: dKey.publicKey.toString("hex")
                };
            }
        }
    }

    async createVoting(stub, args) {
        let pa = this.parseArgs(args,
            ["Title", "title", String, _ => _ !== "null"],
            ["Description", "desc", String, _ => _ !== "null"],
            ["Beginning Time", "startTime", Number, _ => !isNaN(_)],
            ["Deadline", "endTime", Number, _ => !isNaN(_)],
            ["List of Candidates", "cands", Array, _ => _.length > 1],
            ["Email List of Participants", "ptcpMails", Array]
            );
        
        // Check the number type
        var nowTime = Number(moment().format('x'));
        this.assert(pa.startTime > nowTime, `Start time cannot be past`);
        this.assert(pa.endTime > pa.startTime, `End time must be later than start time`);

        // Check candidates list and create objects
        var candList = [], candVotingBox = { docType: "Candidates" };
        for (var i in pa.cands) {
            this.assert(pa.cands[i] instanceof Array, `${i + 1}th candidate information is not a type of array`);
            this.assert(pa.cands[i].length === 3, `${i + 1}th candidate information is wrongly formed`);
            let candId = this.genRandHash(16);
            candList.push({
                name: pa.cands[i][0],
                short: pa.cands[i][1],
                media: pa.cands[i][2],
                id: candId
            });
            candVotingBox[candId] = 0;
        }

        // Generate vote seed
        var nvSeed = 0;
        do {
            nvSeed = this.genRandHash(256);
        } while (null == (await stub.getState(nvSeed)));

        // Create participants object
        var ptcpMailVerified = { docType: "Mails" };
        for (let ptcp of pa.ptcpMails) {
            ptcpMailVerified[ptcp] = false;
        }

        // Put candidates information in chain
        await stub.putState(`${nvSeed}.candidates`, Buffer.from(JSON.stringify(candVotingBox)));

        // Put participants information in chain
        await stub.putState(`${nvSeed}.mails`, Buffer.from(JSON.stringify(ptcpMailVerified)));
        await stub.putState(`${nvSeed}.seed`, Buffer.from(JSON.stringify(this.genRandHash(128, 16))));
        await stub.putState(`${nvSeed}.participants`, Buffer.from(JSON.stringify({ voted: 0, docType: "Participants" })));

        // Put voint information in chain
        var nvProps = {
            registered: nowTime,
            title: pa.title,
            description: pa.desc,
            start: pa.startTime,
            end: pa.endTime,
            candidates: candList,
            ptcpCount: pa.ptcpMails.length,
            docType: "Voting"
        };
        console.log(nvProps);
        await stub.putState(nvSeed, Buffer.from(JSON.stringify(nvProps)));

        // Completed
        console.info(`New voting ${nvSeed} created with ${candList.length} candidates and ${pa.ptcpMails.length} participants.`);
        return nvSeed;
    }

};

// Standalone mode
if (process.argv[2] === "__VOTTY_CHAINCODE__") {
    shim.start(new Vapp());
}
