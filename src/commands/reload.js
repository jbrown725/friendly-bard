module.exports = {
  name: 'reload',
  description: 'Reloads a command',
  args: true,
  usage: '<command name>',
  execute(message, args) {
    // make sure a command name was passed and that such a command exists
    const commandName = args[0].toLowerCase();
    const command = message.client.commands.get(commandName)
      || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return message.channel.send(`There is no command with name or alias \`${commandName}\`, ${message.author}!`);

    // delete the require cache so that a new require actually does something
    delete require.cache[require.resolve(`./${command.name}.js`)];
    // find the command, require it again, and set the updated command to the commands
    try {
      const newCommand = require(`./${command.name}.js`);
      message.client.commands.set(newCommand.name, newCommand);
      message.channel.send(`Command \`${command.name}\` was reloaded!`);
    } catch (error) {
      console.error(error);
      message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
    }
  },
};