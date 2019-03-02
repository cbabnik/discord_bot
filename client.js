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
        async () => {
            if (cli.status !== Discord.isConnected)
                await cli.login(login_token)
        },
        60000
    ));


    return cli;
};

module.exports = {Client};
