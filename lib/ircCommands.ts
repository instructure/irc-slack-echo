var commands = {
  // Empty commands...
  'empty': function() {
    return "Yes...?";
  },

  // various pings
  'ping': function() {
    return 'pong'
  },
  'Ping': function() {
    return 'Pong';
  },
  'ping!': function() {
    return 'pong!';
  },
  'Ping!': function() {
    return 'Pong!';
  },
  'PING': function() {
    return 'PONG';
  },
  'PING!': function() {
    return 'PONG!';
  },
  'bing': function() {
    return 'How about Duck Duck Go?';
  },

  // TELL
  'tell': function() {
    return "I'm still learning how to tell people things.";
  },
};

function getCommand(message: string) {
  var splitMessage = message.split(' ');
  if (splitMessage.length > 0) {
    if (splitMessage[0] == process.env.IRC_NICK ||
        splitMessage[0] == process.env.IRC_NICK + ':') {
      if (splitMessage.length == 1) {
        return {
          cmd: 'empty',
          args: []
        }
      }
      return {
        cmd: splitMessage[1],
        args: splitMessage.slice(2)
      }
    }
  }
}

function isValidCommand(cmd: string): cmd is keyof typeof commands {
  return commands.hasOwnProperty(cmd);
}

export function handleCommand(from: string, to: string, message: string) {
  var parsed = getCommand(message);
  if (parsed) {
    if (isValidCommand(parsed.cmd)) {
      return commands[parsed.cmd]();
    } else {
      return "I'm sorry, I don't know what you mean.";
    }
  }
}
