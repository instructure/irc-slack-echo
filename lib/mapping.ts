import { writeFileSync } from 'node:fs'

const userMapPath = 'userMap.json';

// TODO replace this terrible thing with a remote data store of some sort
const userMap = new Map<string, string>();// JSON.parse(readFileSync(userMapPath, 'utf8'));

function writeUserMap() {
  // synchronously write the user map file
  const userMapString = JSON.stringify(Object.fromEntries(userMap));
  writeFileSync(userMapPath, userMapString);
}

export function ircToSlack(originalMessage: string) {
  let modifiedMessage = originalMessage;
  const urlRegex = /https?:\/\//;
  const words = modifiedMessage.split(' ');
  userMap.forEach((val, key) => {
    const replaced = words.map((word) => {
      if (urlRegex.test(word)) {
        return word;
      } else {
        const re = new RegExp('\\b' + key + '\\b', 'i');
        if (re.test(word)) {
          if (word.includes('@')) {
            key = '@' + key;
          }
          return word.replace(key, '<@' + val + '>');
        } else {
          return word;
        }
      }
    });
    modifiedMessage = replaced.join(' ');
  });
  return modifiedMessage;
}

export function slackNameToIrcName(slackName: string) {
  const key = Object.keys(userMap).find(key => userMap.get(key) == slackName);
  return key ?? slackName;
}

export function link(slackName: string, ircName: string) {
  userMap.set(ircName, slackName);
  writeUserMap();
  return "Mapped " + slackName + "(slack) to " + ircName + "(irc)";
}

export function unlink(slackName: string, ircName?: string) {
  let response = "Unmapped " + slackName + "(slack) from " + (ircName ?? 'ALL') + "(irc)";
  if (ircName) {
    userMap.delete(ircName);
  } else {
    response = "";
    userMap.forEach((val, key) => {
      if (val == slackName) {
        userMap.delete(key);
        response += "Unmapped " + val + "(slack) from " + key + "(irc)\n";
      }
    });
  }
  writeUserMap();
  return response;
}

export function list() {
  let output = "(slack)\t-> (irc)\n";
  userMap.forEach((val, key) => {
    output += val + "\t-> " + key + "\n";
  });
  return output;
}
