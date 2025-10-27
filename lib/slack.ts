import { GenericMessageEvent, UsersListResponse, WebClient } from '@slack/web-api';
import { SocketModeClient } from '@slack/socket-mode';
import { Client as IRCClient } from 'irc';
import * as mapping from './mapping';

const triggerWords = (process.env.SLACK_TRIGGER_WORDS ?? 'ircbot,!').split(',');

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
const socketModeClient = new SocketModeClient({ appToken: process.env.SLACK_APP_TOKEN ?? '' });
socketModeClient.on('message', ({ body, ack }: { body: { event: GenericMessageEvent }, ack: () => Promise<void> }) => {
  ack().catch((err: unknown) => {
    console.error("Error acknowledging Slack message:", err);
  })
  if (body.event.channel == process.env.SLACK_CHANNEL_ID) {
    handleSlackInput(body.event).catch((err: unknown) => {
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
  // Prepopulate username mappings for IRC inbound messages
  for await (const page of slackClient.paginate("users.list")) {
    const userListPage = page as UsersListResponse;
    userListPage.members?.forEach((user) => {
      if (user.name && user.id && !user.deleted) {
        mapping.setNativeUser(user.id, user.name);
      }
    });
  }
}

export async function getUserName(slackId: string) {
  const userInfo = await slackClient.users.info({ user: slackId });
  return userInfo.user?.name;
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
    const userName = await getUserName(context.user);
    // This block should never happen
    if(!userName) {
      return "Could not find your Slack user info.";
    }
    if(ircClient) {
      const composed = await mapping.slackToIrc(`[<@${context.user}>] ${messageText}`);
      ircClient.say(process.env.IRC_CHANNEL ?? '', composed);
    }
    return false;
  },

  'link': async function(args: string[], context: GenericMessageEvent) {
    let response;
    switch(args.length) {
      case 1: {
        response = mapping.link(context.user, args[0]);
        break;
      }
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
        // no args, unlink all
        response = mapping.unlink(context.user);
        break;
      }
      case 1: {
        // 1 arg, unlink my slack name from the passed irc name
        response = mapping.unlink(context.user,
                                  args[0]);
        break;
      }
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

