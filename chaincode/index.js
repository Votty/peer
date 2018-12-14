// Author: Yuoa@Votty

const Vapp = require("./Vapp");
const shim = require("fabric-shim");
const compose = require("docker-compose");
const prompt = require("prompt-confirm");
const docker = require("dockerode");
const e = require("../core/error.js");

module.exports = {
    live: () => shim.start(new Vapp()),
    install: (arg, log, e) => {
        let dk = new docker({
            socketPath: arg.dockerSock || "/var/run/docker.sock"
        });

        // Check if already one of them are running
        dk.listContainers((error, containers) => {
            if (error) {
                let detail = "";
                switch (error.code) {
                    case "EACCES":
                    detail = "If you have used `sudo docker` to run docker, consider run docker without superuser privileges.\nLook here: https://docs.docker.com/install/linux/linux-postinstall/#manage-docker-as-a-non-root-user"; break;

                    case "ENOENT":
                    detail = "Please check your socket path again."; break;
                }

                e.parse(0x3000, `Error occured while listing docker containers.${
                    detail.length > 0 ? `\n${detail}` : ""
                }`)(error);
            } else {
                let cNames = [];
                for (let i in containers) {
                    cNames.push(containers[i].Names[0].substring(1));
                }
                
                if ((arg.fullNode && cNames.includes("votty.ca")) || (!arg.woOrderer && cNames.includes("votty.peers")) || cNames.includes("votty-db") || cNames.includes("votty.peer")) {
                    // Votty Docker is installed
                    (new prompt({
                        name: "willContinue",
                        message: "It seems there's already votty container is installed. Want to delete them before installation?"
                    })).ask((ans) => {
                        if (ans) {
                            // TODO go to install!
                        } else {
                            log.info("Installation canceled.");
                            process.exit();
                        }
                    })
                }
            }
        });
    },
    update: (arg, log, e) => {

    }
};
