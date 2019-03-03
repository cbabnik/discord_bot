// monitor.js
// Monitor is not a class (at this moment), but a process that injects some behavior onto certain events of client.
// Monitor acts as the funnel for all INPUT on client. It makes no decisions on filtering input, but forwards potential
// command input to the dispatcher. Monitor may also watch audio, images, etc. Monitor is responsible for logging too.

const fs = require('fs');
const { format } = require('util');
const { LOG_DIRECTORY } = require('./constants').CONFIG_DEFAULTS;

const Monitor = (client, dispatcher, logDirectory=LOG_DIRECTORY) => {

    fs.mkdir(logDirectory+"/messages", { recursive: true }, (err) => {});
    fs.mkdir(logDirectory+"/messageDeletions", { recursive: true }, (err) => {});
    fs.mkdir(logDirectory+"/messageEdits", { recursive: true }, (err) => {});
    fs.mkdir(logDirectory+"/reactions", { recursive: true }, (err) => {});

    const formatMessage = (msg) => format("[%s] %s: %s%s\r\n",
        msg.createdAt,
        msg.author.username,
        msg.tts?'[tts] ':'',
        msg.content
    );

    const cb = (err) => {};

    client.on('message', async msg => {
        dispatcher.message(msg);
        const logFile = logDirectory + "/messages/" + msg.channel.name + ".log";
        fs.writeFile(logFile, formatMessage(msg), {flag: 'a'}, cb);
    });

    client.on('messageDelete', async (msg) => {
        if ( dispatcher.messageDelete )
            dispatcher.messageDelete(msg);
        const logFile = logDirectory + "/messageDeletions/" + msg.channel.name + ".log";
        fs.writeFile(logFile, formatMessage(msg), {flag: 'a'}, cb);
    });

    client.on('messageUpdate', async (oldMsg, newMsg) => {
        if ( dispatcher.messageUpdate )
            dispatcher.messageUpdate(msg);
        const logMessage = format('[OLD] %s\n[NEW] %s', formatMessage(oldMsg), formatMessage(newMsg));
        const logFile = logDirectory + "/messageEdits/" + oldMsg.channel.name + ".log";
        fs.writeFile(logFile, logMessage, {flag: 'a'}, cb);
    });

    client.on('messageReactionAdd', async (reaction) => {
        if ( dispatcher.messageReactionAdd )
            dispatcher.messageReactionAdd(reaction);
        const logMessage = format('%s\n%s', formatMessage(reaction.message), reaction.emoji.name);
        const logFile = logDirectory + "/reactions/" + reaction.message.channel.name + ".log";
        fs.writeFile(logFile, logMessage, {flag: 'a'}, cb);
    });
};

module.exports = { Monitor };