const fs = require('fs');
const roll = require("./roll.js");
module.exports = {
	name: 'ping',
	description: 'basic thing for testing',
	aliases: ['poong', 'peen'],
	execute(message, args) {
		message.channel.send('pong');
		roll.execute(message, args);
	},
};