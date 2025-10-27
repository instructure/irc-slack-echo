import { readFileSync, writeFileSync } from 'node:fs'

const userMapPath = 'userMap.json';

const userMap = JSON.parse(readFileSync(userMapPath, 'utf8'));

function writeUserMap() {
  // synchronously write the user map file
  var userMapString = JSON.stringify(userMap);
  writeFileSync(userMapPath, userMapString);
}

export function ircToSlack(originalMessage: string) {
  var modifiedMessage = originalMessage;
  var urlRegex = /https?:\/\//;
  var words = modifiedMessage.split(' ');
  Object.keys(userMap).forEach((key) => {
    var val = userMap[key];
    var replaced = words.map((word) => {
      if (urlRegex.test(word)) {
        return word;
      } else {
        var re = new RegExp('\\b' + key + '\\b', 'i');
        if (re.test(word)) {
          if (word.indexOf('@') > -1) {
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
  var key = Object.keys(userMap).find(key => userMap[key] == slackName);
  return key || slackName;
}

export function link(slackName: string, ircName: string) {
  userMap[ircName] = slackName;
  writeUserMap();
  return "Mapped " + slackName + "(slack) to " + ircName + "(irc)";
}

export function unlink(slackName: string, ircName?: string) {
  var response = "Unmapped " + slackName + "(slack) from " + ircName + "(irc)";
  if (ircName) {
    delete userMap[ircName];
  } else {
    response = "";
    Object.keys(userMap).forEach((key) => {
      var val = userMap[key];
      if (val == slackName) {
        delete userMap[key];
        response += "Unmapped " + val + "(slack) from " + key + "(irc)\n";
      }
    });
  }
  writeUserMap();
  return response;
}

export function list() {
  var output = "(slack)\t-> (irc)\n";
  Object.keys(userMap).forEach((key) => {
    var val = userMap[key];
    output += val + "\t-> " + key + "\n";
  });
  return output;
}
