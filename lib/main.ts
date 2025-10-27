import 'dotenv/config'

import { Client as IRCClient } from 'irc';

import { ircToSlack } from './mapping';
import { setClient as setSlackIrcClient, sendEcho } from './slack';
import { handleCommand } from './ircCommands';

/*
 * Set up the IRC client
 */

const client = new IRCClient(process.env.IRC_SERVER || '', process.env.IRC_NICK || '', {
  userName: process.env.IRC_NICK || '',
  password: process.env.IRC_PASSWORD || '',
  channels: [process.env.IRC_CHANNEL || ''],
  port: 6697,
  sasl: true,
  debug: true,
  showErrors: true,
  secure: true,
  autoConnect: false,
  autoRejoin: true,
  retryCount: 3
});

setSlackIrcClient(client);


/*
 * Set up the IRC listeners
 */

client.addListener('message', function(from, to, message) {
  var room = to;
  console.log(from + ' => ' + room + ': ' + message);

  // propagate the message to slack, even if it was a command
  message = ircToSlack(message);

  var echoMessage = "[" + from + "] " + message;
  sendEcho(echoMessage);

  // handle any commands
  var botResponse = handleCommand(from, to, message);
  if (botResponse) {
    client.say(process.env.IRC_CHANNEL || '', botResponse);
    sendEcho("[" + process.env.IRC_NICK + "] " + botResponse);
  }
});

client.addListener('error', function(message) {
  console.log("ERROR: " + message);
});

console.log("Connecting to IRC");
client.connect(function(){
  console.log("connect called back", arguments);
});
