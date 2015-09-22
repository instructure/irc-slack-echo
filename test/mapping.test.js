/*eslint-env mocha */
var expect = require('chai').expect;
var fs = require('fs');

describe('Mapping', function () {
  var userMapPath = 'userMap.json';
  var originalUserMap;
  var mapping;
  before(function () {
    originalUserMap = fs.readFileSync(userMapPath, 'utf8');
    fs.writeFileSync(userMapPath, '{}');
    mapping = require('../lib/mapping');
  });

  after(function () {
    fs.writeFileSync(userMapPath, originalUserMap);
  });

  describe('ircToSlack', function () {
    before(function () {
      mapping.link('slackname', 'ircusername');
    });

    after(function () {
      mapping.unlink('slackname', 'ircusername');
    })

    it('does not replace names in URLS', function () {
      var message = 'Check out http://github.com/ircusername/coolrepo';
      var newMessage = mapping.ircToSlack(message);
      expect(newMessage).to.equal(message);
    });

  });

})