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
      mapping.link('coolname', 'rob');
    });

    after(function () {
      mapping.unlink('coolname', 'rob');
    });

    it('does not replace names in URLS', function () {
      var message = 'Check out http://github.com/rob/coolrepo';
      var newMessage = mapping.ircToSlack(message);
      expect(newMessage).to.equal(message);
    });

    it('allows replacement of words outside of a url', function () {
      var message = 'rob: Check out http://github.com/rob/coolrepo';
      var newMessage = mapping.ircToSlack(message);
      var expected = '<@coolname>: Check out http://github.com/rob/coolrepo';
      expect(newMessage).to.equal(expected);
    });

    it('does not replace names in the middle of other words', function () {
      var message = 'Worry, not it is not a problem';
      var newMessage = mapping.ircToSlack(message);
      expect(newMessage).to.equal(message);
    });

    it('does the replacement with a non-letter character afterwards', function () {
      var message = 'rob: what is the plan?';
      var newMessage = mapping.ircToSlack(message);
      expect(newMessage).to.equal('<@coolname>: what is the plan?');
    });

    it('does the replacement when the message is just a one word question', function () {
      var message = 'rob?';
      var newMessage = mapping.ircToSlack(message);
      expect(newMessage).to.equal('<@coolname>?');
    });

    it('does not replace it at the end of of a word', function () {
      var message = 'throb is a verb or a noun';
      var newMessage = mapping.ircToSlack(message);
      expect(newMessage).to.equal(message);
    });

    it('it replaces the message if it is a single highlight word', function () {
      var message = 'rob';
      var newMessage = mapping.ircToSlack(message);
      expect(newMessage).to.equal('<@coolname>');
    });

    it('replaces the word with a @ before it', function () {
      var message = 'hey @rob';
      var newMessage = mapping.ircToSlack(message);
      expect(newMessage).to.equal('hey <@coolname>');
    })




  });
});
