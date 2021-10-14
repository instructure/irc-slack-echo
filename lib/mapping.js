var fs = require('fs');

var userMapPath = 'userMap.json';

var userMap = JSON.parse(fs.readFileSync(userMapPath, 'utf8'));

var writeUserMap = function() {
  // synchronously write the user map file
  var userMapString = JSON.stringify(userMap);
  var fsSuccess = fs.writeFileSync(userMapPath, userMapString);
  return fsSuccess;
};

module.exports = {
  ircToSlack: function (originalMessage) {
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
  },

  slackNameToIrcName: function(slackName) {
    var key = Object.keys(userMap).find(key => userMap[key] == slackName);
    return key || slackName;
  },

  link: function(slackName, ircName) {
    userMap[ircName] = slackName;
    var writeError = writeUserMap();
    if (writeError) {
      return "Error writing user map file. " + writeError;
    }
    return "Mapped " + slackName + "(slack) to " + ircName + "(irc)";
  },

  unlink: function(slackName, ircName) {
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
    var writeError = writeUserMap();
    if (writeError) {
      return "Error writing user map file. " + writeError;
    }
    return response;
  },

  list: function() {
    var output = "(slack)\t-> (irc)\n";
    Object.keys(userMap).forEach((key) => {
      var val = userMap[key];
      output += val + "\t-> " + key + "\n";
    });
    return output;
  }
};
