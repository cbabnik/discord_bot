const { Component } = require( './component' );
const { BUCKS, CONFIG } = require( '../core/constants' );
const { bank } = require( './bank' );
const { statistics } = require( './statistics' );
const debug = require( 'debug' )( 'basic' );

const ID = 'payroll';

const ALLOWANCE_AMOUNT = 5;
const PERIOD = 1000*60*60*12;

class Payroll extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^#admin_payroll (\d+)$/, this.forcedPayout );
        this.addCommand( /^-allowance/, this.allowanceInfo );
    }

    bootUp() {
        const am1019 = new Date();
        am1019.setHours( 10 );
        am1019.setMinutes( 19 );
        am1019.setSeconds( 15 );
        am1019.setMilliseconds( 0 );
        this.addScheduledEvent( am1019, 'timestamps.default', PERIOD );
    }

    scheduledEvent( misses ) {
        debug( 'Payroll just paid out!' );
        if ( misses > 0 ) {
            this.setAction( 'message', `Sorry guys, I missed ${misses} pay periods! ` +
                `I believe I owe you all ${ALLOWANCE_AMOUNT*misses} credits in allowance.` );
            this.setAction( 'channelId', CONFIG.MAIN_CHANNEL );
            this.payout( misses*ALLOWANCE_AMOUNT );
        } else {
            this.setAction( 'message', `Allowance of ${ALLOWANCE_AMOUNT} credits has been paid out!` );
            this.setAction( 'channelId', CONFIG.MAIN_CHANNEL );
            this.payout( ALLOWANCE_AMOUNT );
        }
        this.bypassDispatcher();
    }

    // COMMANDS

    async allowanceInfo(mi) {
        const id = mi.authorId;
        const name = mi.author;

        const now = Date.now();
        const last_time = await this.storage.get(`${id}.last`);
        await this.storage.set(`${id}.last`, now );
        if (last_time) {
            const time_passed = now - last_time
            if (time_passed < 500) {
                if (Math.random() > 0.90) {
                    this.setAction( 'message', `Quit spamming. I ignore allowances that are less than 500ms apart.` );
                }
                return
            }
        }

        const nextPayout = this.nextPayout();

        const ms = nextPayout.getTime() - new Date().getTime();
        const hours = Math.floor( ms/1000/60/60%24 );
        const minutes = Math.floor( ms/1000/60%60 );
        const seconds = Math.floor( ms/1000%60 );
        const milliseconds = Math.floor( ms%1000 );

        statistics.storage.apply(`closest_to_1019.${id}`, ms, ms, Math.min)

        if ( hours > 0 ) {
            this.setAction( 'message', `Allowance is due in ${hours} hours, and ${minutes} minutes. The amount is set to ${ALLOWANCE_AMOUNT} credits.` );
        } else if ( minutes > 0 ) {
            this.setAction( 'message', `Allowance is due in ${minutes} minutes, and ${seconds} seconds. The amount is set to ${ALLOWANCE_AMOUNT} credits.` );
        } else if ( seconds > 10 ) {
            this.setAction( 'message', `Allowance is due in ${seconds} seconds! Get Ready!` );
        } else if ( seconds > 3 ) {
            this.setAction( 'message', `Allowance is due in ${seconds} seconds! Oh boy!` );
        } else if ( seconds > 0 ) {
            this.setAction( 'message', `Allowance is due in ${seconds} seconds! Oh papa!` );
        } else if ( milliseconds > 250 ) {
            this.setAction( 'message', `Allowance is due in ${milliseconds} milliseconds! Try to get closer!` );
        } else if ( milliseconds > 100 ) {
            bank.addAmount( id, 1 );
            this.setAction( 'message', `${milliseconds} milliseconds **${name}**! 1 credit consolation prize. Try to get closer!` );
        } else if ( milliseconds > 10 ) {
            this.payout( ALLOWANCE_AMOUNT );
            this.setAction( 'message', `${milliseconds} milliseconds **${name}**! Badda Boom! You triggered a bonus payout!` );
        } else if ( milliseconds > 0 ) {
            this.payout( 50 );
            this.setAction( 'message', `${milliseconds} milliseconds **${name}**! Freaking Bullseye! Everyone gets 50 credits` );
        }
        if ( nextPayout.getHours() === 22 ) {
            this.setAction( 'audioFile', 'kevin1019' );
        } else {
            this.setAction( 'audioFile', 'coltsu1019' );
        }
    }

    nextPayout() {
        const am1019 = new Date();
        am1019.setHours( 10 );
        am1019.setMinutes( 19 );
        am1019.setSeconds( 15 );
        am1019.setMilliseconds( 0 );
        const currentTime = new Date();
        const nextPayout = new Date( am1019 );
        if ( currentTime.getTime() > am1019.getTime() + PERIOD ) {
            nextPayout.setHours( nextPayout.getHours()+2*12 );
        } else if ( currentTime.getTime() > am1019.getTime() ) {
            nextPayout.setHours( nextPayout.getHours()+12 );
        }
        return nextPayout;
    }

    forcedPayout( amnt, metaInfo ) {
        const id = metaInfo.authorId;
        if ( id === BUCKS.LUNES || id === BUCKS.KENRICASUEBERRY ) {
            this.setAction( 'message', `Spending Money! ${amnt} credits each!` );
            this.payout( amnt );
        }
    }

    // HELPERS

    payout( amnt ) {
        debug( 'Payroll just paid out!' );
        Object.values( BUCKS ).forEach( id => {
            bank.addAmount( id, amnt );
        } );
    }
}

module.exports = { payroll: new Payroll() };
