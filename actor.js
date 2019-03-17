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
const ytdl = require('ytdl-core');

const Actor = ( client ) => {

    const DEFAULT_INSTRUCTIONS = {
        channel: CONFIG_DEFAULTS.MAIN_CHANNEL,

        message: undefined,
        image: undefined,
        imageLink: undefined,

        voiceChannel: "533736402085478412",
        audioFile: undefined,
        audioYoutube: undefined,

        repeat: 1,
        delay: 0,
        timing: undefined,

        next: undefined,
    };

    const handle = ( instructionPkg ) => {
        logForDebug(instructionPkg);
        const ins = { ...DEFAULT_INSTRUCTIONS, ...instructionPkg };

        const channel = client.channels.get(ins.channel);

        // timing
        // ______
        if (ins.delay > 0) {
            setTimeout(() => {
                handle({...ins, delay: 0});
            }, ins.delay*1000);
            return;
        }
        if (ins.timing) {
            const currentMS = new Date().getTime();
            const desiredMS = Date.parse(ins.timing);
            handle({...ins, delay: (desiredMS-currentMS)/1000, timing: undefined});
            return;
        }

        // actions
        // _______
        let embeds = {};
        if ( ins.image ) {
            embeds.files = [{
                attachment: './images/' + ins.image,
                name: ins.image
            }]
        }
        else if ( ins.imageLink ) {
            embeds.files = [ins.imageLink]
        }
        if ( ins.message )
            channel.send(ins.message, embeds)
                .catch(err => console.log("Send Error: " + err.message));
        else if (Object.keys(embeds).length !== 0)
            channel.send(embeds)
                .catch(err => console.log("Send Embeds Error: " + err.message));

        if ( ins.audioFile ) {
            try {
                const vc = client.channels.get(ins.voiceChannel);
                vc.join().then(connection => {
                    const broadcast = client.createVoiceBroadcast();
                    broadcast.playFile('./audio/' + ins.audioFile);
                    connection.playBroadcast(broadcast);
                });
            } catch (err) {
                console.log("Error with " + ins.audioFile + ": " + err.message);
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
                console.log("Error with " + ins.audioFile + ": " + err.message);
            }
        }

        // chaining instructions
        // _____________________
        if ( ins.repeat > 1 ) {
            if (ins.repeat > 10)
                ins.repeat = 10;
            handle({...ins, repeat: ins.repeat-1});
            return;
        }
        if ( ins.next )
            handle({channel:instructionPkg.channel, ...ins.next})
    };

    const logForDebug = (instructionPkg) => {
        let msgShortened = "";
        if (instructionPkg.message)
            if (instructionPkg.message.length > 40)
                msgShortened = instructionPkg.message.slice(0,37) + "...";
            else
                msgShortened = instructionPkg.message;

        let audioInfo = "";
        if (instructionPkg.audioFile)
            audioInfo = "<" + instructionPkg.audioFile + ">";

        let delayInfo = "";
        if (instructionPkg.delay !== 0 && instructionPkg.delay !== undefined)
            delayInfo = " [delay "+instructionPkg.delay+"s]";
        else if (instructionPkg.timing)
            delayInfo = " [timing "+instructionPkg.timing+"]";

        let repeatInfo = "";
        if (instructionPkg.repeat > 1)
            repeatInfo = " [repeat "+instructionPkg.repeat+"x]";
        else if (instructionPkg.next)
            repeatInfo = " [hasNext]";

        debug("%s%s%s%s", msgShortened, audioInfo, delayInfo, repeatInfo)
    };

    return {
        handle
    };
};

module.exports = { Actor };