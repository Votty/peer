// Author: Yuoa@Votty
// Translate some parameters in string

module.exports = (message, ...args) => {
    var replaces = message.match(/\[\[[0-9]*\]\]/gm);
    var replacedCounter = 0;
    var replacedMessage = new String(message);

    for (var i in replaces) {
        if (replaces[i] === "[[]]")
            replacedMessage = replacedMessage.replace(
                replaces[i],
                args[replacedCounter++]
            );
        else {
            var reqArgNo =
                Number(replaces[i].substring(2, replaces[i].length - 2)) - 1;

            if (typeof args[reqArgNo] != "undefined")
                replacedMessage = replacedMessage.replace(
                    replaces[i],
                    args[reqArgNo]
                );
        }
    }

    return `${replacedMessage}`;
};
