// client.js
// This class is a thin wrapper around Discord's client. Any behavior to the client itself, regardless of the commands
// that use it should be here. This means to reconnect the client when it disconnects, to accept or ignore invites, etc

const Discord = require('discord.js');
const { CLIENT_CONNECTED } = require('./constants');
const debug = require('debug')('basic');

const Client = (max_messages, login_token) => {
    const cli = new Discord.Client({
        messageCacheMaxSize: max_messages
    });

    // try to login every 60 seconds if disconnected
    cli.login(login_token).then( () => cli.setInterval(
        function tryLogin() {
            try {
                if (cli.status !== CLIENT_CONNECTED) {
                    cli.login(login_token);
                }
            } catch (err) {
                debug('Client error: ' + err.message);
            }
        },
        60000
    ));

    let bytes_sent = {};
    let strikes = {};
    // after ~5 seconds of inactivity disconnect from voice channels
    cli.setInterval( () => {
        cli.voiceConnections.array().forEach((c) => {
            let vc = c.channel;
            let n = vc.name;

            const streamCount = c.player.streamingData.count;
            if (streamCount === bytes_sent[n]) {
                strikes[n] = strikes[n]+1 || 1;
                if (strikes[n] > 2) {
                    vc.leave();
                    strikes[n] = 0;
                }
            } else {
                strikes[n] = 0;
            }
            bytes_sent[n] = streamCount;
        });
    }, 2000);
    return cli;
};

module.exports = {Client};
