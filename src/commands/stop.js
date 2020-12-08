
module.exports = {
  name: 'stop',
  description: 'stop playing and empty queue',
  execute(message, args) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    if (!serverQueue || serverQueue.songs.length == 0)
      return message.channel.send(
        "Hold your tomatoes, I'm not playing anything!"
      );
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  },
};
function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue || serverQueue.songs.length == 0)
    return message.channel.send(
      "Hold your tomatoes, I'm not playing anything!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}