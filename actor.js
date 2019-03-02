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
        message: undefined,
        channel: CONFIG_DEFAULTS.MAIN_CHANNEL,
        next: undefined
    };

    const handle = ( instructionPkg ) => {
        const ins = { ...DEFAULT_INSTRUCTIONS, ...instructionPkg };
        if ( ins.message ){
            const channel = client.channels.get('533736402085478410');
            channel.send(ins.message);
        }
        if ( instructionPkg.next ) {
            handle(instructionPkg.next);
        }
    };

    return {
        handle
    };
};

module.exports = { Actor };