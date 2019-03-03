// actor.js
// Actor simplifies things such as sending a message to a channel, but it also governs the WAY it is sent.
// Maybe you want to say happy birthday to someone at a specific date, just set instruction.timing, actor will take care
// of the sloppy details.
// More importantly this class gives more dynamic/fluid behavior. For example, Lunes could get nicknamed SirPoops for
// a day and every component would say SirPoops instead of Lunes if you declare that behavior here, All Audio can be
// muted or given a different volume for awhile. The instructions specify "what" but this class has a lot of say on the
// "how"

const { CONFIG_DEFAULTS } = require('./constants');

const Actor = ( client ) => {

    const DEFAULT_INSTRUCTIONS = {
        channel: CONFIG_DEFAULTS.MAIN_CHANNEL,

        voiceChannel: undefined,
        audioFile: undefined,

        repeat: 1,
        delay: 0,
        timing: undefined,

        message: undefined,
        next: undefined,
    };

    const handle = ( instructionPkg ) => {
        const ins = { ...DEFAULT_INSTRUCTIONS, ...instructionPkg };

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
            handle({...ins, delay: desiredMS-currentMS, timing: undefined});
            return;
        }

        // actions
        // _______
        if ( ins.message ) {
            const channel = client.channels.get(ins.channel);
            channel.send(ins.message);
        }
        if ( ins.audioFile ) {
            // STUB
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

    return {
        handle
    };
};

module.exports = { Actor };