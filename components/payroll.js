const { Component } = require( '../component' );
const { BUCKS, CONFIG_DEFAULTS } = require( '../constants' );
const { bank } = require( './bank' );
const { inventory } = require( './inventory' );
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
            this.setAction( 'channelId', CONFIG_DEFAULTS.MAIN_CHANNEL );
            this.payout(misses*ALLOWANCE_AMOUNT)
        } else {
            this.setAction( 'message', `Allowance of ${ALLOWANCE_AMOUNT} credits has been paid out!` );
            this.setAction( 'channelId', CONFIG_DEFAULTS.MAIN_CHANNEL );
            this.payout(ALLOWANCE_AMOUNT)
        }
        this.bypassDispatcher();
    }

    // COMMANDS

    allowanceInfo() {
        const nextPayout = this.nextPayout();

        const ms = nextPayout.getTime() - new Date().getTime();
        const hours = Math.floor( ms/1000/60/60%24 );
        const minutes = Math.floor( ms/1000/60%60 );
        const seconds = Math.floor( ms/1000%60 );

        if ( hours > 0 ) {
            this.setAction( 'message', `Allowance is due in ${hours} hours, and ${minutes} minutes. The amount is set to ${ALLOWANCE_AMOUNT} credits.` );
        } else if ( minutes > 0 ) {
            this.setAction( 'message', `Allowance is due in ${minutes} minutes, and ${seconds} seconds. The amount is set to ${ALLOWANCE_AMOUNT} credits.` );
        } else if ( seconds > 0 ) {
            if ( Math.random() > 0.5 ) {
                this.setAction( 'message', `Allowance is due in ${seconds} seconds! Oh boy!` );
            } else {
                this.setAction( 'message', `Allowance is due in ${seconds} seconds! Get Ready!` );
            }
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
            let multiplier = 1;
            if (inventory.has(id, 'goldenmarble')) {
                multiplier *= 1.1;
            }
            if (inventory.has(id, 'platinummarble')) {
                multiplier *= 1.2;
            }
            if (inventory.has(id, 'modmarble')) {
                multiplier *= 1.1;
            }
            bank.addAmount( id, amnt*multiplier );

            // IRS
            if (inventory.has(id, 'lumpOfCoal')) {
                bank.addAmount( id, -2 );
                const to = bank.mostInDebtTo( id );
                bank.payOffLoan( id, to, 2 );
            }
        } );
    }
}

module.exports = { payroll: new Payroll() };
