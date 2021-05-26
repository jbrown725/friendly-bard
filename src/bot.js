// some code snippets taken from https://gabrieltanner.org/blog/dicord-music-bot
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require("path");
const Discord = require('discord.js');
const { prefix, token,} = require('./config.json');
const PlayingStatus = require('./PlayingStatus.js');



var jsdom = require('jsdom');
$ = require('jquery')(new jsdom.JSDOM().window);
var tts = false;
var lastChannel = 0;

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

  // switch (commandName) {
  //   case `play`:
  //     execute(message, serverQueue);
  //     break;
  //   case `${prefix}playnow`:
  //     if (serverQueue) serverQueue.songs = [];
  //     execute(message, serverQueue);
  //     break;
  //   case `${prefix}skip`:
  //     skip(message, serverQueue);
  //     break;
  //   case `${prefix}stop`:
  //     stop(message, serverQueue);
  //     break;
  //   case `roll`:
  //     roll(message);
  //     break;
  //   case `${prefix}tts`:
  //     tts = !tts;
  //     if (tts) {message.channel.send("I'll read your rolls out loud.");}
  //     else {message.channel.send("I'll shut up.");}
  //     break;
  //   case `${prefix}oof`:
  //     if (serverQueue) serverQueue.songs = [];
  //     execute(message, serverQueue, 'https://www.youtube.com/watch?v=HoBa2SyvtpE', 3);
  //     break;
  //   case `${prefix}penis`:
  //     execute(message, serverQueue, 'https://www.youtube.com/watch?v=1t8iu2PFWj4');
  //     break;
  //   case `${prefix}say`:
  //     message.channel.send(message.content.substring(5), {tts: true});
  //     break;
  //   default:
  //     // message.channel.send("switch end");
  // }
});

// async function execute(message, serverQueue, url, volume) {
//   // either grab the url from the passed parameter or the message body
//   const args = (typeof url !== 'undefined') ? ["",url] : message.content.split(/[ ]+/);
//   //typeof might not be working
//   // is the user who called the command in a voice channel?
//   const voiceChannel = message.member.voice.channel;
//   if (!voiceChannel)
//     return message.channel.send(
//       "You need to be in a voice channel to play music!"
//     );
//   const permissions = voiceChannel.permissionsFor(message.client.user);
//   if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
//     return message.channel.send(
//       "I need the permissions to join and speak in your voice channel!"
//     );
//   }

//   // get song info for requested song url from youtube

//   var url = args[1]; // video url should be here unless search is to be done
//   try { // is it a youtube video url?
//     ytdl.validateURL(url);
//     songInfo = await ytdl.getInfo(url).catch(error => {console.log(error);});
//     console.log("after getinfo", songInfo);
//   } catch (notVideo) {
//     try { // is it a youtube playlist?
//       ytpl.validateID(url);
//       songInfo = await ytpl.getPlaylistID(url);
//       // TODO: actually do something with playlist ID
//     } catch (notPlaylist) { // it's not, do a search
//       var url = 'https://www.googleapis.com/youtube/v3/search';
//       var params = {
//           part: 'snippet',
//           key: youtube,
//           q: args.slice(1).join(' ')
//       };
//       const result = await $.ajax({
//         url: url,
//         type: 'GET',
//         data: params,
//       });
//       try {
//         var songInfo = await ytdl.getInfo(result.items[0].id.videoId);
//       } catch (noResults) { // no search results
//         // console.log(args[1] + ' ' + noResults);
//         return message.channel.send("I haven't heard that one before.");
//       }
//     } // end notPlaylist catch
//   } // end notVideo catch

//   const song = {
//     title: songInfo.title,
//     url: songInfo.video_url
//   };

//   // is there already an active queue?
//   if (!serverQueue || serverQueue.songs.length == 0) {
//     // Creating the contract for our queue
//     const queueContruct = {
//      textChannel: message.channel,
//      voiceChannel: voiceChannel,
//      connection: null,
//      songs: [],
//      volume: 5,
//      playing: true,
//     };
//     // Setting the queue using our contract
//     client.queues.set(message.guild.id, queueContruct);
//     // Pushing the song to our songs array
//     queueContruct.songs.push(song);

//     try {
//      // Here we try to join the voicechat and save our connection into our object.
//      var connection = await voiceChannel.join();
//      queueContruct.connection = connection;
//      // Calling the play function to start a song
//      play(message.guild, queueContruct.songs[0], volume, songInfo);
//     } catch (err) {
//      // Printing the error message if the bot fails to join the voicechat
//      console.log(err);
//      client.queues.delete(message.guild.id);
//      return message.channel.send(err);
//     }
//   } else { // queue already exists. just add to it
//     serverQueue.songs.push(song);
//     console.log(serverQueue.songs);
//     return message.channel.send(`${song.title} has been added to the queue!`);
//   }
// }

// function play(guild, song, volume, songInfo) {
//   // override volume for specific track if I specify
//   const volMod = (typeof volume !== 'undefined') ? volume : 1;
//   const serverQueue = client.queues.get(guild.id);
//   if (!song) {
//     // serverQueue.voiceChannel.leave();
//     // queue.delete(guild.id);
//     playMessage();
//     return;
//   }

//   // ytdl.downloadFromInfo(songInfo, { filter: 'audioonly' });
//   // create a stream and pass it the URL of our song.
//   // We also add two listeners that handle the end and error event.
//   const dispatcher = serverQueue.connection
//     .play(ytdl(song.url, {
//       highWaterMark : 1<<23, //8 MB buffer
//       filter: 'audioonly'
//     }))
//     .on("finish", () => {
//       serverQueue.songs.shift(); // next in queue
//       play(guild, serverQueue.songs[0]); // recursive call to play again
//     })
//     .on("error", error => console.error(error));
//   dispatcher.setVolumeLogarithmic(serverQueue.volume*volMod / 5);
//   serverQueue.textChannel.send(`Start playing: **${song.title}**`);
//   client.user.setPresence({ activity: { name: `${song.title}` }, status: 'online' });
// }

// function skip(message, serverQueue) {
//   if (!message.member.voice.channel)
//     return message.channel.send(
//       "You have to be in a voice channel to stop the music!"
//     );
//   if (!serverQueue || serverQueue.songs.length == 0)
//     return message.channel.send(
//       "I haven't even started performing yet!"
//     );
//   serverQueue.connection.dispatcher.end();
// }

// function stop(message, serverQueue) {
//   if (!message.member.voice.channel)
//     return message.channel.send(
//       "You have to be in a voice channel to stop the music!"
//     );
//   if (!serverQueue || serverQueue.songs.length == 0)
//     return message.channel.send(
//       "Hold your tomatoes, I'm not playing anything!"
//     );
//   serverQueue.songs = [];
//   serverQueue.connection.dispatcher.end();
// }





client.login(token);
