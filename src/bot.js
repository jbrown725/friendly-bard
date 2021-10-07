// some code snippets taken from https://gabrieltanner.org/blog/dicord-music-bot
const fs = require('fs');
const path = require("path");
const Discord = require('discord.js');
const { prefix, token, } = require('./config.json');
const PlayingStatus = require('./PlayingStatus.js');


var jsdom = require('jsdom');
$ = require('jquery')(new jsdom.JSDOM().window);
const client = new Discord.Client();

// const setPlaying = setPlaying(client);
const commandDir = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'));
const testDir = path.join(commandDir, "tests");
const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.js'));

client.commands = new Discord.Collection();
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.name, command);
}

for (const file of testFiles) {
  const command = require(`./commands/tests/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.name, command);
}

// bot can be playing in multiple servers simultaneously
client.queues = new Map();

// console messages so I know it started
client.once('ready', () => {
  console.log('Ready!');
  setInterval(() => {
    PlayingStatus.bardMessage(client);
  }, 6000); // Change status every 60 seconds.

  // .then(console.log)
  // .catch(console.error);

});
client.once('reconnecting', () => {
  console.log('Reconnecting!');
});
client.once('disconnect', () => {
  console.log('Disconnect!');
});

// listener for the message event
// get the message and save it into a message object if it is triggered
client.on('message', async message => {
  // only check messages that start with prefix and aren't from the bot itself
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const serverQueue = client.queues.get(message.guild.id);
  lastChannel = message.channel;

  // command contains a single word without prefix to match with a command, and 
  // args contains every other word in the message as an array
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName)
    || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  // check if required args were provided and give feedback if they were not
  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;
    if (command.usage) {
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
    }
    return message.channel.send(reply);
  }

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply("I'm afraid I don't know that one, friend.");
  }

});

client.login(token);
