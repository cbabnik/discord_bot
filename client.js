const Discord = require('discord.js');

const Client = (max_messages, login_token) => {
    const cli = Discord.Client(options = {
        messageCacheMaxSize: max_messages
    });

    // try to login every 60 seconds if disconnected
    cli.setInterval(
        () => {
            if (!cli.status === Discord.isConnected)
            cli.login(login_token)
        },
        60000
    );

    return cli;
};

module.exports = {Client};
