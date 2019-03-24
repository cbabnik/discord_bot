// actor.js
// Actor simplifies things such as sending a message to a channel, but it also governs the WAY it is sent.
// Maybe you want to say happy birthday to someone at a specific date, just set instruction.timing, actor will take care
// of the sloppy details.
// More importantly this class gives more dynamic/fluid behavior. For example, Lunes could get nicknamed SirPoops for
// a day and every component would say SirPoops instead of Lunes if you declare that behavior here, All Audio can be
// muted or given a different volume for awhile. The instructions specify "what" but this class has a lot of say on the
// "how"

const { CONFIG_DEFAULTS } = require('./constants');
const debug = require('debug')('actor');
const debugExtra = require('debug')('extra');
const ytdl = require('ytdl-core');
const fs = require('fs');

let messagesForEdit = {};

const Actor = ( client ) => {

    const DEFAULT_INSTRUCTIONS = {
        channel: "use_source",

        message: undefined,
        messageId: undefined,
        editId: undefined,
        image: undefined,
        imageLink: undefined,

        voiceChannel: '533736402085478412',
        audioFile: undefined,
        audioYoutube: undefined,
        endAudio: false,

        repeat: 1,
        delay: 0,
        timing: undefined,

        next: undefined,
    };

    const handle = ( instructionPkg, msg ) => {
        logForDebug(instructionPkg);
        const ins = { ...DEFAULT_INSTRUCTIONS, ...instructionPkg };

        // timing
        // ______
        if (ins.delay > 0) {
            setTimeout(() => {
                handle({...ins, delay: 0}, msg);
            }, ins.delay*1000);
            return;
        }
        if (ins.timing) {
            const currentMS = new Date().getTime();
            const desiredMS = Date.parse(ins.timing);
            handle({...ins, delay: (desiredMS-currentMS)/1000, timing: undefined}, msg);
            return;
        }

        // set
        // ___
        if ( ins.channel==="use_source" ) {
            ins.channel = msg.channel.id;
        }
        const channel = client.channels.get(ins.channel);

        // actions
        // _______
        let embeds = {};
        if ( ins.image ) {
            if ( !ins.audioFile.includes('.') ) {
                ins.audioFile += '.jpg';
            }
            embeds.files = [{
                attachment: './images/' + ins.image,
                name: ins.image
            }];
        } else if ( ins.imageLink ) {
            embeds.files = [ins.imageLink];
        }
        if ( ins.editId ) {
            if (ins.message) {
                messagesForEdit[ins.editId].edit(ins.message, embeds)
                    .catch(err => debug('Edit Error: ' + err.message));
            } else if (Object.keys(embeds).length !== 0) {
                messagesForEdit[ins.editId].edit(embeds)
                    .catch(err => debug('Edit Embeds Error: ' + err.message));
            }
        } else {
            if (ins.message) {
                channel.send(ins.message, embeds)
                    .then(newMsg => {if (ins.messageId) {
                        messagesForEdit[ins.messageId] = newMsg;
                        handle({...ins, message: undefined, messageId: undefined}, msg);
                    }})
                    .catch(err => debug('Send Error: ' + err.message));
                if (ins.messageId) return;
            } else if (Object.keys(embeds).length !== 0) {
                channel.send(embeds)
                    .then(newMsg => {if (ins.messageId) {
                        messagesForEdit[ins.messageId] = newMsg;
                        handle({...ins, message: undefined, messageId: undefined}, msg);
                    }})
                    .catch(err => debug('Send Embeds Error: ' + err.message));
                if (ins.messageId) return;
            }
        }

        if ( ins.endAudio ) {
            try {
                client.voiceConnections.array().forEach((c) => {
                    c.channel.leave();
                });
            } catch (err) {
                debug('Error leaving channels: ' + err.message);
            }
        }
        if ( ins.audioFile ) {
            if ( !ins.audioFile.includes('.') ) {
                ins.audioFile += '.mp3';
            }
            const path = './audio/' + ins.audioFile;
            try {
                if ( fs.existsSync(path) ) {
                    const vc = client.channels.get(ins.voiceChannel);
                    vc.join().then(connection => {
                        // if no extension, assume .mp3
                        const broadcast = client.createVoiceBroadcast();
                        broadcast.playFile(path);
                        connection.playBroadcast(broadcast);
                    });
                } else {
                    debug(`File ${ins.audioFile} not found`);
                }
            } catch (err) {
                debug('Error with ' + ins.audioFile + ': ' + err.message);
            }
        } else if ( ins.audioYoutube ) {
            try {
                const vc = client.channels.get(ins.voiceChannel);
                vc.join().then(connection => {
                    const broadcast = client.createVoiceBroadcast();
                    const stream = ytdl(ins.audioYoutube, { filter : 'audioonly' });
                    broadcast.playStream(stream);
                    connection.playBroadcast(broadcast);
                });
            } catch (err) {
                debug('Error with ' + ins.audioFile + ': ' + err.message);
            }
        }

        // chaining instructions
        // _____________________
        if ( ins.repeat > 1 ) {
            if (ins.repeat > 10) {
                ins.repeat = 10;
            }
            handle({...ins, repeat: ins.repeat-1}, msg);
            return;
        }
        if ( ins.next ) {
            handle({channel:instructionPkg.channel, ...ins.next}, msg);
        }
    };

    const logForDebug = (instructionPkg) => {
        let msgShortened = '';
        if (instructionPkg.message) {
            if (instructionPkg.message.length > 40) {
                msgShortened = instructionPkg.message.slice(0,37) + '...';
            } else {
                msgShortened = instructionPkg.message;
            }
        }

        let audioInfo = '';
        if (instructionPkg.audioFile) {
            audioInfo = '<' + instructionPkg.audioFile + '>';
        }

        let delayInfo = '';
        if (instructionPkg.delay !== 0 && instructionPkg.delay !== undefined) {
            delayInfo = ' [delay '+instructionPkg.delay+'s]';
        } else if (instructionPkg.timing) {
            delayInfo = ' [timing '+instructionPkg.timing+']';
        }

        let repeatInfo = '';
        if (instructionPkg.repeat > 1) {
            repeatInfo = ' [repeat '+instructionPkg.repeat+'x]';
        } else if (instructionPkg.next) {
            repeatInfo = ' [hasNext]';
        }

        debug('%s%s%s%s', msgShortened, audioInfo, delayInfo, repeatInfo);
        debugExtra(instructionPkg);
    };

    return {
        handle
    };
};

module.exports = { Actor };
