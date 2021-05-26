const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const fs = require('fs');
const PlayingStatus = require('../PlayingStatus.js');
const { youtubeKey } = require('../config.json');
const { title } = require('process');


// Flag to enable youtube searching if no song found. 
// Requires youtube api key to be in config.json
const doSearch = true;

module.exports = {
  name: 'play',
  description: 'play a song',
  args: true,
  usage: '<url or path to play>',
  async execute(message, args) {
    // is the user who called the command in a voice channel?
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a voice channel to play music!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "I need the permissions to join and speak in your voice channel!"
      );
    }

    let song;

    // assume first item of args is a url
    const url = args[0];
    // treat args as a filesystem path by converting spaces to slashes
    const path = String.raw`${args.join(' ')}`.replace(/\\/g, '/'); // makes windows slashes not be escape characters

    // determine song source and format and create an appropriate song variable
    if (ytdl.validateURL(url)) {
      // get song info for requested song url from youtube
      const songInfo = await getYouTube(url);
      if (songInfo !== undefined) {
        song = {
          title: songInfo.videoDetails.title,
          location: songInfo.videoDetails.video_url,
          stream: ytdl(songInfo.videoDetails.video_url)
        };
      }
    } else if (isFile(path)) {      // local file
      song = {
        title: path, //TODO get title from file tags
        location: path,
        stream: path
      }
    } else if (isDirectory(path)) { // local directory
      //TODO
    } else {                        // do a youtube search
      if (doSearch) {
        try {
          const songInfo = await youTubeSearch(message, args)
          if (songInfo !== undefined) {
            song = {
              title: songInfo.videoDetails.title,
              location: songInfo.videoDetails.video_url,
              stream: ytdl(songInfo.videoDetails.video_url)
            };
          }
        } catch (error) {
          console.log("youtube search error:", error);
        }
      }
    }

    if (song === undefined) {
      console.log("undefined song in play module, args:", args);
      return message.channel.send("I haven't heard that one before.");
    }

    // get this server's queue out of the client's queues map
    const serverQueue = message.client.queues.get(message.guild.id);

    // is there already an active queue?
    if (!serverQueue || serverQueue.songs.length == 0) {
      // Creating the contract for our queue
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
      };
      // Setting the queue using our contract
      message.client.queues.set(message.guild.id, queueContruct);
      // Pushing the song to our songs array
      queueContruct.songs.push(song);

      try {
        // Here we try to join the voicechat and save our connection into our object.
        const connection = await voiceChannel.join();
        queueContruct.connection = connection;
        // Calling the play function to start a song
        play(
          message,
          message.client.queues.get(message.guild.id),
          queueContruct.songs[0],
        );
      } catch (err) {
        // Printing the error message if the bot fails to join the voicechat
        console.log(err);
        message.client.queues.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else { // queue already exists. just add to it
      serverQueue.songs.push(song);
      logQueue(message); // print queue to console
      return message.channel.send(`${song.title} has been added to the queue!`);
    }
  },
};

async function getYouTube(url) {
  try {  // is it a youtube video url?
    songInfo = await ytdl.getInfo(url);
    return songInfo;
  }
  catch (error) {
    console.log('ytdl getinfo failed', error);
    return;
  }
}

async function youTubePlaylist(url) {
  try { // is it a youtube playlist?
    ytpl.validateID(url);
    songInfo = await ytpl.getPlaylistID(url);
    // TODO: actually do something with playlist ID
  } catch (error) {
    console.log(error);
  }
}

// run a youtube search of args and return the first video result
async function youTubeSearch(message, args) {
  const url = 'https://www.googleapis.com/youtube/v3/search';
  const params = {
    part: 'snippet',
    key: youtubeKey,
    q: args.slice(0).join(' ')
  };
  const result = await $.ajax({
    url: url,
    type: 'GET',
    data: params,
  });
  try {
    const songInfo = await ytdl.getInfo(result.items[0].id.videoId);
    return songInfo;
  } catch (error) { // no search results
    console.log("youtube search error 1:", error);
    return;
  }
}

// check if passed in string refers to a valid local file 
function isFile(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (error) {
    return false;
  }
}

// check if passed in string refers to a valid local file system path
function isDirectory(path) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (error) {
    return false;
  }
}

// print queue to console
function logQueue(message) {
  const serverQueue = message.client.queues.get(message.guild.id);
  if (serverQueue !== undefined) {

    // filter out the stream attribute before printing to log because it's long and ugly
    const filteredSongs = serverQueue.songs.map(song => {
      const { stream, ...rest } = song;
      return rest;
    });
    console.log(`Queue for server "${message.guild.name}": \n`, filteredSongs);
  } else {
    console.log(`Queue for server "${message.guild.name}" is empty`);
  }
}

function play(message, serverQueue, song) {
  // queue is empty, go back to non-music state
  if (!song) {
    // serverQueue.voiceChannel.leave();
    message.client.queues.delete(message.guild.id);
    // either go back to idle bard messages or show song info from other server
    PlayingStatus.songMessage(message.client);
    return;
  }
  // console.log(song);

  // Play the stream stored in the song object
  // We also add two listeners that handle the end and error event.
  const dispatcher = serverQueue.connection
    .play(song.stream)
    .on("finish", () => {
      serverQueue.songs.shift(); // next in queue
      play(message, serverQueue, serverQueue.songs[0]); // recursive call to play again
      logQueue(message); // print queue to console
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  PlayingStatus.songMessage(message.client);
}