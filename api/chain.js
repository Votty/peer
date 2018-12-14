// Author: Yuoa@Votty

const moment = require("moment");
const FCli = require("fabric-client");
const FCCli = require("fabric-ca-client");
const cs = require("../core/const.js");

const fcli = new FCli();
const peer = fcli.newPeer("grpc://localhost:7051");
const channel = fcli.newChannel("votty");
channel.addOrderer(fcli.newOrderer("grpc://localhost:7050"));
channel.addPeer(peer);

const cryptoSuite = FCli.newCryptoSuite();
cryptoSuite.setCryptoKeyStore(FCli.newCryptoKeyStore({ path: cs.HFC_STORE_DIR }));
fcli.setCryptoSuite(cryptoSuite);

let user = null, log = null, e = null;

const invoke = (fn, args) => {
    const txId = fcli.newTransactionID();
    const request = {
        chaincodeId: "votty-chaincode",
        chainId: "votty",
        txId: txId,
        fcn: fn,
        args: args
    };

    // Make a proposal
    return channel.sendTransactionProposal(request)
        .then(results => {
            if ( // Test if proposal was good
                results[0]
                && results[0][0].response
                && results[0][0].response.status === 200
            ) {
                log.success(`Proposal of ${txId.getTransactionID()} (${fn}) is green.`);

                // Send transaction
                const txSent = channel.sendTransaction({
                    proposalResponses: results[0],
                    proposal: results[1]
                });

                // Set transaction events
                const eventHub = channel.newChannelEventHub(peer);
                const txEvent = new Promise((ok, no) => {
                    let handle = setTimeout(() => {
                        eventHub.unregisterTxEvent(txId.getTransactionID());
                        eventHub.disconnect();
                        ok({status: "TIMEOUT"});
                    }, 4000);
                    eventHub.registerTxEvent(txId.getTransactionID(), (tx, code) => {
                        clearTimeout(handle);

                        let result = {
                            status: code,
                            txId: txId.getTransactionID()
                        };

                        if (code !== 'VALID') {
                            log.error(`Transaction invalid (${code}).`);
                        } else {
                            log.info(`Transaction committed on peer ${eventHub.getPeerAddr()}.`);
                        }
                        
                        ok(result);
                    }, error => {
                        no(e.make(0x1, "Eventhub is invalid", error));
                    }, { disconnect: true });
                });
                eventHub.connect();

                // Save proposal response
                const ppResponse = results[0][0].response.payload.toString();

                return Promise.all([txSent, txEvent])
                    .then(results => {
                        // Check orderer reached
                        if (results && results[0] && results[0].status === 'SUCCESS') {
                            log.success(`Orderer received tx ${txId.getTransactionID()}.`);
                        } else {
                            log.error(`Tx ${txId.getTransactionID()} didn't reached to orderer.`);
                            log.debug(results[0]);
                            return false;
                        }

                        // Check ledger reached
                        if (results && results[1] && (results[1].event_status === 'VALID' || results[1].status === 'VALID')) {
                            log.success(`Tx ${txId.getTransactionID()} successfully reached to all hyperledgers!`);
                            return ppResponse;
                        } else {
                            log.error(`Tx ${txId.getTransactionID()} failed to reach out to each ledgers.`);
                            log.debug(results[1]);
                            return false;
                        }
                        
                        return true;
                    });
            } else {
                log.error(`Transaction proposal of ${fn} is failed!`);
                log.debug(results[0]);
                return false;
            }
        }, e.parse(0x2100, "Failed to invoke"));
};

const query = (fn, args) => {
    log.info(`Querying through function ${fn}...`);

    const request = {
        chaincodeId: "votty-chaincode",
        fcn: fn,
        args: args
    };

    return channel.queryByChaincode(request)
        .then(responses => {
            if (responses && responses.length == 1) {
                if (responses[0] instanceof Error) {
                    e.parse(0x2200, "Error from query result")(responses[0]);
                } else {
                    log.debug(responses[0]);
                    log.success(`Querying successful (${fn})!`);
                }
                return responses[0];
            } else
                log.warn(`No payload returned (${fn})!`);
            return false;
        }, e.parse(0x2000, "Failed to query"));
};

const enroll = (name, secret, fccli) => {
    return fccli.enroll({
        enrollmentID: name,
        enrollmentSecret: secret
    }).then(enrollment => {
        log.success(`Enrolled ${name}.`);
        return fcli.createUser({
            username: name,
            mspid: "InitPeerMSP",
            cryptoContent: {
                privateKeyPEM: enrollment.key.toBytes(),
                signedCertPEM: enrollment.certificate
            }
        });
    });
};

module.exports = (_log) => {
    log = _log;
    e = new (require("../core/error.js"))(_log);
    return FCli.newDefaultKeyValueStore({ path: cs.HFC_STORE_DIR })
        .then(stateStore => {
            // Set store
            fcli.setStateStore(stateStore);
            return fcli.getUserContext('vpeer', true);
        }, e.parse(0x800, "KVStore creation error", true))
        .then(storeUser => {
            if (!(storeUser && storeUser.isEnrolled())) {
                // User does not exists, make user.
                log.warn("`vpeer` user does not enrolled.");

                // `fccli` is widely used in this context.
                const fccli = new FCCli("http://localhost:7054", null, "", cryptoSuite);
                return fcli.getUserContext("admin", true)
                    .then(storeAdmin => {
                        if (!(storeAdmin && storeAdmin.isEnrolled())) {
                            // If admin does not exists
                            log.warn("`admin` does not enrolled.");
                            return enroll("admin", "adminpw", fccli);
                        } else return storeAdmin;
                    }, e.parse(0x1000, "Admin context error", true))
                    .then(storeAdmin => {
                        // Make user.
                        return fccli.register({
                                enrollmentID: "vpeer",
                                affiliation: "org1.department1",
                                role: "client"
                            }, storeAdmin).then(vpSecret => {
                                log.success("Registered `vpeer` user.");
                                return enroll("vpeer", vpSecret, fccli);
                            }, e.parse(0x1200, "User registration error", true))
                            .then(vpeer => {
                                user = vpeer;
                                return fcli.setUserContext(user);
                            }, e.parse(0x1300, "User enrollment error", true));
                    }, e.parse(0x1100, "Admin enrollment error", true));
            } else return storeUser;
        }, e.parse(0x900, "User fetching error", true))
        .then(storeUser => {
            user = storeUser;
            return { invoke: invoke, query: query };
        });
};
