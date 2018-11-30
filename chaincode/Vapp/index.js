// Author: Votty
/*
 TODO List
 - On ESnext, change "common functions" private.
 */

"use strict";

const shim = require("fabric-shim");
const util = require("util");
const random = require("./random.js");
const moment = require("./moment.js");

const Vapp = module.exports = class Votty {

    /* Interfaces of Chaincode */

    async Init(stub) {
        console.info("Thanks for using Votty platform! Successfully instantiated.");
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

    isVoteEnded(vi) {
        if (typeof vi.endTime !== "undefined") {
            return vi.endTime < Number(moment().format('x'));
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

    checkArgs(args, ...labels) {
        // Check args
        this.assert(args && args instanceof Array);

        // Check the number of args
        this.assert(args.length == labels.length, `Argument length does not match (received: ${args.length}, expected: ${labels.length})`);

        // Check that is all string type
        for (let i in labels) {
            this.assert(typeof args[i] === "string", `${labels[i]} must be passed as string type`);
        }
    }

    genRandHex(len) {
        var gen = "";
        while(gen.length < len)
            gen += random(0, Number.MAX_SAFE_INTEGER / 64).toString(16);
        return gen.substring(0, len);
    }

    /* Votty Querying Functions */

    async getVotingInformation(stub, args) {
        this.checkArgs(args, "Voting seed");
        
        // Check the conditions of the seed
        this.assert(args[0].length == 30, `The length of voting code is not matched`);
        let viBytes = await stub.getState(args[0]);

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
                let candInfo = JSON.parse(await stub.getState(`${args[0]}.candidates`));
                let ptcpInfo = JSON.parse(await stub.getState(`${args[0]}.participants`));

                let isVoteEnded = this.isVoteEnded(vi);

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

    async doVote(stub, args) {
        this.checkArgs(args, ["Voting seed", "Participation code", "Selected candidate ID"]);

        // Check the conditions of args
        this.assert(args[0].length == 30, `The length of voting code is not matched`);
        this.assert(args[1].length == 1997, `The length of participant code is not matched`);
        this.assert(args[2].length == 15, `The length of candidate ID is not matched`);

        let viBytes = await stub.getState(args[0]);

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
                let candInfo = JSON.parse(await stub.getState(`${args[0]}.candidates`));
                let ptcpInfo = JSON.parse(await stub.getState(`${args[0]}.participants`));

                // Check if vote is now ongoing
                this.assert(this.isVoteEnded(vi), `This voting is already ended`);

                // Check if the participant voted
                this.assert(typeof ptcpInfo[args[1]] !== "boolean", `The participant does not exists`);
                this.assert(ptcpInfo[args[1]] !== false, `The participant already voted`);

                // Check if that candidate exists
                this.assert(typeof candInfo[args[2]] !== "number", `The candidate does not exists`);
                
                // Process the voting
                candInfo[args[2]] += 1;
                ptcpInfo[args[1]] = true;
                ptcpInfo.voted += 1;

                // Publish the voting
                await stub.putState(`${args[0]}.participants`, Buffer.from(JSON.stringify(ptcpInfo)));
                await stub.putState(`${args[0]}.candidates`, Buffer.from(JSON.stringify(candInfo)));

                // Return the status
                return true;
            }
        }
    }

    async createVoting(stub, args) {
        this.checkArgs(args, "Title", "Description", "Start time", "End time", "Candidates information", "Participants count", "\"Permit live rate\" item");
        
        // Check the number type
        var startTime = Number(args[2]), endTime = Number(args[3]), nowTime = Number(moment().format('x')), ptcpCount = Number(args[5]);
        this.assert(!isNaN(startTime), `\`startTime\` should be a string of a number`);
        this.assert(!isNaN(endTime), `\`endTime\` should be a string of a number`);
        this.assert(!isNaN(ptcpCount), `\`ptcpCount\` should be a string of a number`);
        this.assert(startTime > nowTime, `Start time cannot be past`);
        this.assert(endTime > startTime, `End time must be later than start time`);
        this.assert(ptcpCount > 0, `Participants count must be at least 1`);

        // Check the boolean type
        this.assert(args[6] === "true" || args[6] === "false", `"Permit live rate" item must be a string of a boolean`);
        var permitLiveRate = args[6] === "true" ? true : false;

        // Check candidates list and create objects
        try {
            var rawCandList = JSON.parse(args[4]);
        } catch (e) {
            return this.reportError(`The list of candidates is wrongly formed.`, e);
        }
        this.assert(rawCandList instanceof Array, `Parsed candidates list is not an array type`);
        this.assert(rawCandList.length > 1, `There must be at least two candidates existing`);

        var candList = [], secretCandInfo = { docType: "Candidates" };
        for (var i in rawCandList) {
            this.assert(rawCandList[i] instanceof Array, `${i + 1}th candidate information is not a type of array`);
            this.assert(rawCandList[i].length === 3, `${i + 1}th candidate information is wrongly formed`);
            let candId = this.genRandHex(15);
            candList.push({
                name: rawCandList[i][0],
                short: rawCandList[i][1],
                media: rawCandList[i][2],
                id: candId
            });
            secretCandInfo[candId] = 0;
        }

        // Create participants object
        var ptcpInfo = [], secretPtcpInfo = { voted: 0, docType: "Participants" };
        for (let i = 0; i < ptcpCount; i++) {
            let ptcpId = "voted";
            do {
                ptcpId = this.genRandHex(1997);
            } while (typeof secretPtcpInfo[ptcpId] !== "undefined");
            secretPtcpInfo[ptcpId] = false;
            ptcpInfo.push(ptcpId);
        }

        // Generate vote seed
        var nvSeed = 0;
        do {
            nvSeed = this.genRandHex(30);
        } while (null == (await stub.getState(nvSeed)));

        // Put candidates information in chain
        await stub.putState(`${nvSeed}.candidates`, Buffer.from(JSON.stringify(secretCandInfo)));

        // Put participants information in chain
        await stub.putState(`${nvSeed}.participants`, Buffer.from(JSON.stringify(secretPtcpInfo)));

        // Put voint information in chain
        var nvProps = {
            registered: nowTime,
            title: args[0],
            description: args[1],
            start: startTime,
            end: endTime,
            candidates: candList,
            ptcpCount: ptcpCount,
            permitLiveRate: permitLiveRate,
            docType: "Voting"
        };
        console.log(nvProps);
        await stub.putState(nvSeed, Buffer.from(JSON.stringify(nvProps)));

        // Completed
        console.info(`New voting ${nvSeed} created with ${candList.length} candidates and ${ptcpCount} participants.`);
        return {
            seed: nvSeed,
            participants: ptcpInfo
        };
    }

};

// Standalone mode
if (process.argv[2] === "__VOTTY_CHAINCODE__") {
    shim.start(new Vapp());
}
