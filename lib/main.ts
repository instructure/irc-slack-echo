import 'dotenv/config'

import { Client as IRCClient } from 'irc';

import { ircToSlack } from './mapping';
import { setClient as setSlackIrcClient, sendEcho } from './slack';
import { handleCommand } from './ircCommands';

/*
 * Set up the IRC client
 */

const client = new IRCClient(process.env.IRC_SERVER ?? '', process.env.IRC_NICK ?? '', {
  userName: process.env.IRC_PASSWORD ? process.env.IRC_NICK : undefined,
  password: process.env.IRC_PASSWORD,
  channels: process.env.IRC_CHANNEL ? [process.env.IRC_CHANNEL] : [],
  port: 6697,
  sasl: !!process.env.IRC_PASSWORD,
  debug: true,
  showErrors: true,
  secure: true,
  autoConnect: false,
  autoRejoin: true,
  retryCount: 3
});

setSlackIrcClient(client).catch((err: unknown) => {
  console.error("Error setting Slack IRC client:", err);
});

/*
 * Set up the IRC listeners
 */

client.addListener('message', function(from: string, to: string, message: string) {
  const room = to;
  console.log(from + ' => ' + room + ': ' + message);

  // propagate the message to slack, even if it was a command
  message = ircToSlack(message);

  const echoMessage = "[" + from + "] " + message;
  sendEcho(echoMessage).catch((err: unknown) => {
    console.error("Error sending message to Slack:", err);
  });

  // handle any commands
  const botResponse = handleCommand(from, to, message);
  if (botResponse) {
    client.say(process.env.IRC_CHANNEL ?? '', botResponse);
    sendEcho("[" + (process.env.IRC_NICK ?? '') + "] " + botResponse).catch((err: unknown) => {
      console.error("Error sending response to Slack:", err);
    });
  }
});

client.addListener('error', function(message: string) {
  console.log("ERROR: " + message);
});

console.log("Connecting to IRC");
client.connect(function(...args){
  console.log("connect called back", args);
});
