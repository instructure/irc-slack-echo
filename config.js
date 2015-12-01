module.exports = {
  slack: {
    host: 'my.slack.com',
    incomingWebhookToken: 'your incoming webhook token',
    outgoingWebhookToken: 'your outgoing webhook token',
    outgoingWebhookServer: {
      port: 666,
      domain: 'your.webhook.server.com',
      hookPath: '/irc-echo'
    },
    echoChannel: '#irc-echo',
    botName: 'IRCBot',
  },
  irc: {
    server: 'your.irc.net',
    nick: 'slackbot',
    channel: '#mychan'
  },
  quietTimes: {
    startQuiet: 0, // Midnight
    endQuiet: 8, // 8am
    idleTime: 600000 // If no message within 10 minutes.
  }
};
