// client.js
// This class is a thin wrapper around Discord's client. Any behavior to the client itself, regardless of the commands
// that use it should be here. This means to reconnect the client when it disconnects, to accept or ignore invites, etc

const Discord = require('discord.js');

const Client = (max_messages, login_token) => {
    const cli = new Discord.Client(options = {
        messageCacheMaxSize: max_messages
    });

    // try to login every 60 seconds if disconnected
    cli.login(login_token).then( () => cli.setInterval(
        async function tryLogin() {
            try {
                if (cli.status !== Discord.isConnected)
                    await cli.login(login_token)
            }
            catch (err) {
                console.log("Client error: " + err.message);
            }
        },
        60000
    ));

    let voice_activity = {};
    // after ~3 seconds of inactivity disconnect from voice channels
    cli.setInterval( () => {
        cli.voiceConnections.array().forEach((c) => {
            vc = c.channel;
            n = vc.name;

            const streamCount = c.player.streamingData.count;
            if (streamCount === voice_activity[n])
                vc.leave();
            voice_activity[n] = streamCount;
        })
    }, 3000);
    return cli;
};

module.exports = {Client};
