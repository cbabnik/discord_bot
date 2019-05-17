const { Component } = require( '../component' );
const { BUCKS, CONFIG_DEFAULTS } = require( '../constants' );
const { bank } = require( './bank' );
const debug = require( 'debug' )( 'basic' );

const ID = 'payroll';

const ALLOWANCE_AMOUNT = 3;
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
            this.setAction( 'message', `Sorry guys, I missed ${misses} pay period! ` +
                `I believe I owe you all ${ALLOWANCE_AMOUNT*misses} credits in allowance.` );
            this.setAction( 'channelId', CONFIG_DEFAULTS.MAIN_CHANNEL );
        } else {
            this.setAction( 'message', `Allowance of ${ALLOWANCE_AMOUNT} credits has been paid out!` );
            this.setAction( 'channelId', CONFIG_DEFAULTS.MAIN_CHANNEL );
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
