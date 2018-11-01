// (c) Yuoa of Votty
// Byebye!

const dict = require("./dict.js");

module.exports = () => dict[Math.floor(Math.random() * dict.length)];
