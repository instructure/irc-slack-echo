var irc = require('irc');

var ircCommands = require('./ircCommands');
var mapping = require('./mapping');
var slack = require('./slack');

var config = require('../config');


/*
 * Set up the IRC client
 */

var client = new irc.Client(config.irc.server, config.irc.nick, {
  userName: config.irc.nick,
  password: config.irc.password,
  channels: [config.irc.channel],
  port: 6697,
  debug: true,
  sasl: true
  showErrors: true,
  secure: true,
  autoConnect: false,
  autoRejoin: true,
  retryCount: 3
});

slack.setClient(client);


/*
 * Set up the IRC listeners
 */

client.addListener('message', function(from, to, message) {
  var room = to;
  console.log(from + ' => ' + room + ': ' + message);

  // propagate the message to slack, even if it was a command
  message = mapping.ircToSlack(message);

  slack.sendEcho(message, from);

  // handle any commands
  var botResponse = ircCommands.handleCommand(from, to, message);
  if (botResponse) {
    client.say(config.irc.channel, botResponse);
    slack.sendEcho(botResponse, client.nick);
  }
});

client.addListener('error', function(message) {
  console.log("ERROR: " + message);
});

console.log("Connecting to IRC");
client.connect(function(){
  console.log("connect called back", arguments);
});
