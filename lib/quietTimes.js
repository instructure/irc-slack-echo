/**
 * This file contains methods dealing with handling
 * the quiet time feature.
 */

var config = require('../config');

module.exports = {

  /**
   * Determines if we are in 'quiet times'
   * @return {Boolean}
   */
  isInQuietTimes: function () {
    var curDateTime = new Date();
    var hours = curDateTime.getHours();
    return ((hours > config.quietTimes.startQuiet) &&
           (hours < config.quietTimes.endQuiet));
  },

  /**
   * Sends back the quiet time message
   * @return {String}
   */
  getQuietMessage: function () {
    return 'Thanks for your message.  Chances are no one is around ' +
           'at the moment.  Leave your client connected and someone will respond ' +
           'during normal business hours.';
  }

};
