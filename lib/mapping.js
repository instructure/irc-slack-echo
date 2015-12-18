var _ = require('underscore');
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
    _.each(userMap, function (val, key, list) {
      var replaced = words.map(function (word) {
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
    return _.invert(userMap)[slackName] || slackName
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
      _.each(userMap, function(val, key, list) {
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
    _.each(userMap, function(val, key, list) {
      output += val + "\t-> " + key + "\n";
    });
    return output;
  }
};
