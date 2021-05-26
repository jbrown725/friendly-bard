
module.exports = {
  name: 'stop',
  description: 'stop playing and empty queue',
  execute(message, args) {
    // get this server's queue out of the client's queues map
    const serverQueue = message.client.queues.get(message.guild.id);

    if (!message.member.voice.channel) {
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    }
    if (!serverQueue || serverQueue.songs.length == 0) {
      return message.channel.send(
        "Hold your tomatoes, I'm not playing anything!"
      );
    }
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  },
};
