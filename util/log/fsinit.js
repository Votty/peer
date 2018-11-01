// (c) Yuoa of Votty
// Log file initialization

const fs = require("fs");

module.exports = function(cs, log) {
    var DIR = require("path").parse(cs.path.LOGFILE).dir;
    var PATH = cs.path.LOGFILE;

    const mkdir = require(cs.path.UTIL.MKDIR);

    var openStream = function(lp) {
        let stream = fs.createWriteStream(PATH);
        log.fsout = () => stream;
        log.fsw = data => stream.write(data);
    };

    return () => {
        // Open log file and if old file moved, return that moved path
        return new Promise((ok, no) => {
            /* check log directory */
            fs.access(DIR, fs.constants.F_OK, e => {
                if (e) {
                    /* no log directory -> make & try to write file */
                    try {
                        mkdir(DIR).then(openStream);
                    } catch (e) {
                        log.error(
                            "Error occurred while creating log directory."
                        );
                        log.debug(e);
                        no();
                    }
                } else {
                    /* log directory exists -> check if log file exists */
                    try {
                        fs.accessSync(PATH);

                        /* log file exists -> move log file */
                        let renameLog = function(i) {
                            /* set destination path */
                            let DPATH = PATH + "." + i;
                            fs.access(DPATH, fs.constants.F_OK, e => {
                                if (e) {
                                    if (e.code == "ENOENT") {
                                        /* file does not exists */
                                        fs.rename(PATH, DPATH, e => {
                                            if (e) {
                                                log.error(
                                                    "Error occurred while renaming old log file."
                                                );
                                                log.debug(e);
                                                no();
                                            } else {
                                                openStream();
                                                ok(DPATH);
                                            }
                                        });
                                    } else {
                                        /* file access error */
                                        log.error(
                                            "Error occurred while attaining access to the log file."
                                        );
                                        log.debug(e);
                                        no();
                                    }
                                } else renameLog(++i);
                            });
                        };
                        renameLog(0);
                    } catch (e) {
                        if (e.code == "ENOENT") {
                            /* log file not exists -> make & load log module */
                            openStream();
                            ok();
                        } else {
                            /* log file cannot be accessed */
                            log.error(
                                "Error occurred while attaining access to the log file."
                            );
                            log.debug(e);
                            no();
                        }
                    }
                }
            });
        });
    };
};
