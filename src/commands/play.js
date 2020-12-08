const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const PlayingStatus = require('../PlayingStatus.js');


module.exports = {
  name: 'play',
  description: 'play a song',
  args: true,
  usage: '<url to play>',
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

    // get song info for requested song url from youtube
    let songInfo = await getYouTube(message, args);
    if (!songInfo) { return };

    const song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url
    };


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
          songInfo
        );
      } catch (err) {
        // Printing the error message if the bot fails to join the voicechat
        console.log(err);
        message.client.queues.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else { // queue already exists. just add to it
      serverQueue.songs.push(song);
      console.log(`Queue for server "${message.guild.name}": \n`, serverQueue.songs);
      return message.channel.send(`${song.title} has been added to the queue!`);
    }
  },
};

async function getYouTube(message, args) {
  var url = args[0]; // video url should be here unless search is to be done
  if (ytdl.validateURL(url)) {
    try {
      songInfo = await ytdl.getInfo(url)
      return songInfo;
    }
    catch (error) {
      console.log('ytdl getinfo failed', error);
    }
  }
  try { // is it a youtube video url?
    ytdl.validateURL(url);

  } catch (notVideo) {
    try { // is it a youtube playlist?
      ytpl.validateID(url);
      songInfo = await ytpl.getPlaylistID(url);
      // TODO: actually do something with playlist ID
    } catch (notPlaylist) { // it's not, do a search
      var url = 'https://www.googleapis.com/youtube/v3/search';
      var params = {
        part: 'snippet',
        // key: youtube,
        q: args.slice(0).join(' ')
      };
      const result = await $.ajax({
        url: url,
        type: 'GET',
        data: params,
      });
      try {
        var songInfo = await ytdl.getInfo(result.items[0].id.videoId);
      } catch (noResults) { // no search results
        // console.log(args[1] + ' ' + noResults);
        return message.channel.send("I haven't heard that one before.");
      }
    } // end notPlaylist catch
  } // end notVideo catch
}


function play(message, serverQueue, song, songInfo) {
  // queue is empty, go back to non-music state
  if (!song) {
    // serverQueue.voiceChannel.leave();
    message.client.queues.delete(message.guild.id);
    // either go back to idle bard messages or show song info from other server
    PlayingStatus.songMessage(message.client); 
    return;
  }
  // console.log(song);

  // ytdl.downloadFromInfo(songInfo, { filter: 'audioonly' });
  // create a stream and pass it the URL of our song.
  // We also add two listeners that handle the end and error event.
  const dispatcher = serverQueue.connection
    .play(ytdl(song.url, {
      highWaterMark: 1 << 23, //8 MB buffer
      filter: 'audioonly'
    }))
    .on("finish", () => {
      serverQueue.songs.shift(); // next in queue
      play(message, serverQueue, serverQueue.songs[0]); // recursive call to play again
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  PlayingStatus.songMessage(message.client);
}