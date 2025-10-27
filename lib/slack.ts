import { GenericMessageEvent, WebClient } from '@slack/web-api';
import { SocketModeClient } from '@slack/socket-mode';
import { Client as IRCClient } from 'irc';
import * as mapping from './mapping';

const triggerWords = (process.env.SLACK_TRIGGER_WORDS ?? 'ircbot,!').split(',');

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
const socketModeClient = new SocketModeClient({ appToken: process.env.SLACK_APP_TOKEN ?? '' });
socketModeClient.on('message.channels', ({ payload }: { payload: { event: GenericMessageEvent } }) => {
  if (payload.event.channel == process.env.SLACK_CHANNEL_ID) {
    handleSlackInput(payload.event).catch((err: unknown) => {
      console.error("Error handling Slack input:", err);
    });
  }
})

let ircClient: IRCClient | null = null;

async function sendToSlack(message: string) {
  await slackClient.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID ?? '',
    text: message,
  })
}

export { sendToSlack as sendEcho };
export async function setClient(client: IRCClient) {
  ircClient = client;
  await socketModeClient.start();
  console.log("Slack socket connected")
}

/* slack response methods */
const slackBotMethods = {
  // eslint-disable-next-line @typescript-eslint/require-await
  'ping': async function() {
    // don't care about args here
    return "pong";
  },

  'say': async function(args: string[], context: GenericMessageEvent) {
    const messageText = args.join(' ');
    const userInfo = await slackClient.users.info({ user: context.user });
    // This block should never happen
    if(!userInfo.user?.name) {
      return "Could not find your Slack user info.";
    }
    const composed = "[" + mapping.slackNameToIrcName(userInfo.user.name) + "] " + messageText;
    if(ircClient) {
      ircClient.say(process.env.IRC_CHANNEL ?? '', composed);
    }
    return false;
  },

  'link': async function(args: string[], context: GenericMessageEvent) {
    let response;
    switch(args.length) {
      case 1: {
        const userInfo = await slackClient.users.info({ user: context.user });
        // This block should never happen
        if(!userInfo.user?.name) {
          response = "Could not find your Slack user info.";
          break;
        }
        response = mapping.link(userInfo.user.name,
                                args[0]);
        break;
      }
      case 2:
        response = mapping.link(args[0],
                                args[1]);
        break;
      default:
        response = "I guess I should tell you how to use link..";
        break;
    }

    if (response) {
      await sendToSlack(response);
    }
  },

  'unlink': async function(args: string[], context: GenericMessageEvent) {
    let response;
    switch(args.length) {
      case 0: {
        const userInfo = await slackClient.users.info({ user: context.user });
        // This block should never happen
        if(!userInfo.user?.name) {
          response = "Could not find your Slack user info.";
          break;
        }
        // no args, unlink all
        response = mapping.unlink(userInfo.user.name);
        break;
      }
      case 1: {
        const userInfo = await slackClient.users.info({ user: context.user });
        // This block should never happen
        if(!userInfo.user?.name) {
          response = "Could not find your Slack user info.";
          break;
        }
        // 1 arg, unlink my slack name from the passed irc name
        response = mapping.unlink(userInfo.user.name,
                                  args[0]);
        break;
      }
      case 2:
        // 2 args, slack name first, irc name second
        response = mapping.unlink(args[0],
                                  args[1]);
        break;
      default:
        response = "I guess I should tell you how to unlink..";
        break;
    }
    if (response) {
      await sendToSlack(response);
    }
  },

  'show': async function(args: string[]) {
    let response;
    switch(args.length) {
      case 0:
        response = mapping.list();
        break;
    }
    if (response) {
      await sendToSlack(response);
    }
  },
}

function isValidMethod(cmd: string): cmd is keyof typeof slackBotMethods {
  return cmd in slackBotMethods;
}

async function handleSlackInput(payload: GenericMessageEvent) {
  if(!payload.text || !ircClient) {
    return;
  }
  
  let deTriggered = payload.text;
  let foundTrigger = false as boolean;
  triggerWords.forEach((word) => {
    if (deTriggered.startsWith(word)) {
      deTriggered = deTriggered.slice(word.length).trim();
      foundTrigger = true;
    }
  });
  if (!foundTrigger) {
    return;
  }
  // remove trigger word
  let words = deTriggered.split(' ');
  if (words[0] == ':') {
    words = words.slice(1);
  }

  const command = words[0];
  const args = words.slice(1);
  if (isValidMethod(command)) {
    const response = await slackBotMethods[command](args, payload);
    if (response) {
      await sendToSlack(response);
    }
  } else {
    await slackBotMethods.say(words, payload);
  }
};

