import { writeFileSync } from 'node:fs'
import { getUserName } from './slack';

const userMapPath = 'userMap.json';

// TODO replace this terrible thing with a remote data store of some sort
const userMap = new Map<string, string>();// JSON.parse(readFileSync(userMapPath, 'utf8'));

function writeUserMap() {
  // synchronously write the user map file
  const userMapString = JSON.stringify(Object.fromEntries(userMap));
  writeFileSync(userMapPath, userMapString);
}

const slackUserMap = new Map<string, string>();
const slackInverseUserMap = new Map<string, string[]>();
export function setNativeUser(slackId: string, slackName: string) {
  slackUserMap.set(slackId, slackName);
  if (!slackInverseUserMap.has(slackName)) {
    slackInverseUserMap.set(slackName, []);
  }
  const existing = slackInverseUserMap.get(slackName);
  if (existing && !existing.includes(slackId)) {
    existing.push(slackId);
  }
}

export function ircToSlack(message: string) {
  if(userMap.size === 0 && slackUserMap.size === 0) {
    return message;
  }
  const urlRegex = /https?:\/\//;
  const mentionRegex = new RegExp('\\b(@?(' + Array.from(userMap.keys()).concat(Array.from(slackInverseUserMap.keys())).join('|') + '))\\b', 'ig');
  console.log("Mention regex:", mentionRegex);
  return message.split(' ').map((word) => {
    if (urlRegex.test(word)) {
      return word;
    } else {
      return word.replaceAll(mentionRegex, (match, fullMention: string, username: string) => {
        const userMapId = userMap.get(username);
        const slackInverseIds = slackInverseUserMap.get(username);
        if(userMapId) {
          return match.replace(fullMention, '<@' + userMapId + '>');
        } else if(slackInverseIds?.length == 1) {
          return match.replace(fullMention, '<@' + slackInverseIds[0] + '>');
        } else {
          return match;
        }
      })
    }
  }).join(' ');
}

const slackMentionRegex = /<@([A-Z0-9]+)>/g;

async function slackIdToIrcName(slackId: string) {
  for (const [key, value] of userMap.entries()) {
    if (value === slackId)
      return key;
  }

  if(slackUserMap.has(slackId)) {
    return slackUserMap.get(slackId);
  }

  const ret = await getUserName(slackId);
  if(ret) {
    slackUserMap.set(slackId, ret);
  }
  return ret;
}


export async function slackToIrc(message: string) {
  let modifiedMessage = message;
  let match;
  while ((match = slackMentionRegex.exec(message)) !== null) {
    const slackId = match[1];
    const ircName = await slackIdToIrcName(slackId);
    modifiedMessage = modifiedMessage.replace(match[0], ircName ?? '@unknown');
  }
  return modifiedMessage;
}

export function link(slackId: string, ircName: string) {
  userMap.set(ircName, slackId);
  writeUserMap();
  return "Mapped <@" + slackId + "> to " + ircName;
}

export function unlink(slackId: string, ircName?: string) {
  let response = "Unmapped <@" + slackId + "> from " + (ircName ?? 'ALL');
  if (ircName) {
    userMap.delete(ircName);
  } else {
    response = "";
    userMap.forEach((val, key) => {
      if (val == slackId) {
        userMap.delete(key);
        response += "Unmapped <@" + val + "> from " + key;
      }
    });
  }
  writeUserMap();
  return response;
}

export function list() {
  if(userMap.size === 0) {
    return "No mappings exist.";
  }
  let output = "";
  userMap.forEach((val, key) => {
    output += `<@${val}> -> ${key}\n`;
  });
  return output;
}
