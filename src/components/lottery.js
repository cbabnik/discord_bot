let _ = require( 'lodash' );
const uuidv4 = require( 'uuidv4' );
const { Component } = require( './component' );
const { BUCKS, CONFIG, ACTIONS, PERMISSION_LEVELS } = require( '../core/constants' );
const { bank } = require( './bank' );
const { statistics } = require( './statistics' )

const ID = 'lottery';

const cslots_machine = require('./slot_machines/cslots');
const gslots_machine = require('./slot_machines/gslots');
const mslots_machine = require('./slot_machines/mslots');
const bslots_machine = require('./slot_machines/bslots');
const bgslots_machine = require('./slot_machines/bgslots');

class Lottery extends Component {
    constructor() {
        super( ID );
        this.waitUntil = new Date().getTime();

        this.addCommand( /^-cslots$/, (mi) => this.roll("cslots", mi), "cslots" );
        this.addCommand( /^-slots coin$/, (mi) => this.roll("cslots", mi), "cslots" );
        this.addCommand( /^-gslots$/, (mi) => this.roll("gslots", mi), "gslots" );
        this.addCommand( /^-slots grid$/, (mi) => this.roll("gslots", mi), "gslots" );
        this.addCommand( /^-mslots$/, (mi) => this.roll("mslots", mi), "mslots" );
        this.addCommand( /^-slots maze$/, (mi) => this.roll("mslots", mi), "mslots" );
        this.addCommand( /^-bgslots$/, (mi) => this.roll("bgslots", mi), "bgslots" );
        this.addCommand( /^-slots big grid$/, (mi) => this.roll("bgslots", mi), "bgslots" );
        this.addCommand( /^-privacy on$/ , this.privacyOn );
        this.addCommand( /^-privacy off$/ , this.privacyOff );
    }

    async roll(slot_machine_name, mi) {
        const user = mi.author;
        const id = mi.authorId;
        let machine;
        switch (slot_machine_name)
        {
            case "cslots": machine = cslots_machine; break;
            case "gslots": machine = gslots_machine; break;
            case "mslots": machine = mslots_machine; break;
            case "bgslots": machine = bgslots_machine; break;
        }
        const cost = machine.cost();

        // holy mantle here

        if ( mi.channelId !== CONFIG.MAIN_CHANNEL ) {
            this.setAction( 'message', 'Please make your slot rolls public.' );
            return;
        }
        if ( machine.onceAtATime() && this.isOffLimits() ) {
            this.setAction( 'message', 'Please wait your turn. Someone else is rolling' );
            return;
        }
        if ( !await bank.payAmount( id, cost ) ) {
            this.setAction( 'message', `Sorry **${user}**, but this costs **${cost}** credit(s). You don't have enough.` );
            return;
        }

        let results
        try {
            results = await machine.roll(user, id)
        } catch (err) {
            console.error(err)
        }
        if (results === undefined || !results.winnings === undefined) {
            this.setAction('message', `Sorry **${user}** There was an error with the slot machine. You've been refunded.`)
            bank.addAmount( id, cost )
            return;
        }
        let defaults = {
            buckrolls: 0,
            winnings: 0,
            frameDelay: 1,
            increasingDelay: 0,
            images: [],
        }
        results = { ...defaults, ...results }

        const winnings = results.winnings;
        await bank.addAmount(id, winnings)
        const totalWinnings = await statistics.add(`lottery_winnings.${id}.${slot_machine_name}`, winnings)
        statistics.add(`lottery_spent.${id}.${slot_machine_name}`, cost)
        statistics.add(`lottery_profit.${id}.${slot_machine_name}`, winnings-cost)
        if (winnings > cost) {
            statistics.add(`lottery_attempts.${id}.${slot_machine_name}.win`)
        } else if (winnings === cost) {
            statistics.add(`lottery_attempts.${id}.${slot_machine_name}.tie`)
        } else if (winnings > 0 && winnings < cost) {
            statistics.add(`lottery_attempts.${id}.${slot_machine_name}.partial_win`)
        } else if (winnings === 0) {
            statistics.add(`lottery_attempts.${id}.${slot_machine_name}.loss`)
        } else if (winnings < 0) {
            statistics.add(`lottery_attempts.${id}.${slot_machine_name}.poop`)
        }
        statistics.storage.apply(`lottery_best.${id}.${slot_machine_name}`, winnings, winnings, Math.max);
        statistics.storage.apply(`lottery_worst.${id}.${slot_machine_name}`, winnings, winnings, Math.min);
        (async (statistics) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            let attempts = 0;
            attempts += await statistics.storage.get(`lottery_attempts.${id}.${slot_machine_name}.win`)
            attempts += await statistics.storage.get(`lottery_attempts.${id}.${slot_machine_name}.tie`)
            attempts += await statistics.storage.get(`lottery_attempts.${id}.${slot_machine_name}.partial_win`)
            attempts += await statistics.storage.get(`lottery_attempts.${id}.${slot_machine_name}.loss`)
            attempts += await statistics.storage.get(`lottery_attempts.${id}.${slot_machine_name}.poop`)
            statistics.storage.set(`lottery_average.${id}.${slot_machine_name}`, totalWinnings/attempts);
        })(statistics);
        statistics.add(`lottery_buckrolls_earned.${id}.${slot_machine_name}`, results.buckrolls)

        results.frames[results.frames.length-1] += `\nYour new balance is ${await bank.balance( id )}`
        const uuid = uuidv4();
        this.setAction("message", results.frames[0])
        if(results.images.length > 0) this.setAction("image", results.images[0]);
        this.setAction("messageId", uuid)
        for(var i = 1; i < results.frames.length; i++) {
            this.queueAction()
            this.setAction("message", results.frames[i])
            this.setAction("delay", results.frameDelay + results.increasingDelay*i)    
            this.setAction("editId", uuid)
        }
        const num_frames = results.frames.length;
        let totalDelay = results.frameDelay * (num_frames-1) + results.increasingDelay*(num_frames)*(num_frames-1)/2

        if (results.buckrolls) {
            for(var i = 0; i < results.buckrolls; i++) {
                const results = await bslots_machine.roll(user, id)
                this.queueAction();
                this.setAction("delay", 1)  
                this.setAction("message", results.frames[0])  
                this.setAction("image", results.images[0])
                statistics.add(`lottery_winnings.${id}.bslots`, results.winnings)
                bank.addAmount(id, results.winnings)
            }
            totalDelay += 1*results.buckrolls
        }

        this.offLimitsFor(totalDelay)
    }

    privacyOn( mi ) {
        this.storage.set( `${mi.authorId}.privacy`, true );
        this.setAction( 'message', 'Option set.' );
    }
    privacyOff( mi ) {
        this.storage.set( `${mi.authorId}.privacy`, false );
        this.setAction( 'message', 'Option set.' );
    }

    // helpers

    offLimitsFor( seconds ) {
        this.waitUntil = new Date().getTime() + 1000*seconds;
    }

    isOffLimits() {
        return new Date().getTime() < this.waitUntil;
    }
}

module.exports = { lottery: new Lottery() };
