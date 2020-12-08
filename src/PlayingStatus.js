module.exports = {
  bardMessage(client) {
    // if exactly one server is playing music, continue displaying song info 
    if (client.queues.size != 1) {
      var chance = Math.floor(Math.random() * 69)
      if (chance == 0) { // 1 in 69 chance
        var message = songs[Math.floor(Math.random() * songs.length)];
        if (message == "a song of healing") {
          var heal = Math.ceil(Math.random() * 6);
          var points = (heal == 1 ? "point" : "points")
          lastChannel.send("Friendly Bard played a song of healing. You all gain "
            + heal + " hit " + points + ". Rejoice!",
            { tts: true });
        }
      }
      else {
        // get a random adjective and noun from statuses.json
        var adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        var noun = nouns[Math.floor(Math.random() * nouns.length)];
        var message = adjective + " " + noun;
      }

      client.user.setPresence({
        activity: { name: message },
        status: 'online'
      });
    }
  },

  songMessage(client) {
    // only set status if one server is playing a song
    if (client.queues.size == 1) {
      // grab song info from only active server queue
      const song = client.queues.values().next().value.songs[0];
      client.user.setPresence({ activity: { name: `${song.title}` }, status: 'online' });
    }
    // otherwise default to idle message
    else {
      this.bardMessage(client);
    }
  },
}
const adjectives = [
  "a rousing",
  "a stunning",
  "a beautiful",
  "a lively",
  "a jaunty",
  "a somber",
  "a melodious",
  "a joyful",
  "a jazzy",
  "a frantic",
  "an upbeat",
  "a drunken",
  "a very bad",
  "a funkadelic",
  "a soothing",
  "a bold",
  "his trademark"
];
const nouns = [
  "song",
  "ballad",
  "chorus",
  "elegy",
  "ditty",
  "jingle",
  "melody",
  "throat warble",
  "tune"
];
const songs = [
  "Freebird",
  "Destroy the Orcs",
  "a song of healing",
  "penis music",
  "with a barmaid",
  "way too loud"
];

