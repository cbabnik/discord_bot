const { Component } = require( '../component' );
const { BUCKS, CONFIG_DEFAULTS } = require( '../constants' );
const { bank } = require( './bank' );
const debug = require( 'debug' )( 'basic' );

const ID = 'payroll';

const ALLOWANCE_AMOUNT = 3;
const HOURS_BETWEEN_PAYMENT = 12;
const PERIOD = 1000*60*60*HOURS_BETWEEN_PAYMENT;

class Payroll extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^#admin_payroll (\d+)$/, this.forcedPayout );
        this.addCommand( /^-allowance/, this.allowanceInfo );
    }

    bootUp( actor ) {
        const nextPayout = this.nextPayout();
        const currentTime = new Date();
        const lastPayout = this.json['lastPayout'];
        if ( lastPayout ) {
            const timePassed = currentTime.getTime() - lastPayout.getTime();
            if ( timePassed > PERIOD ) {
                const paysPassed = Math.floor( timePassed/PERIOD );
                this.payout( ALLOWANCE_AMOUNT*paysPassed );

                const previousPayout = new Date( nextPayout );
                previousPayout.setHours( previousPayout.getHours()-HOURS_BETWEEN_PAYMENT );

                this.setAction( 'message', `Sorry guys, I missed ${paysPassed} pay period! I believe I owe you all ${ALLOWANCE_AMOUNT*paysPassed} credits in allowance.` );
                this.setAction( 'channel', CONFIG_DEFAULTS.MAIN_CHANNEL );
                debug( 'Payroll just paid out!' );
                actor.handle( this.commitAction(), null );

                this.overwritePayoutTime( previousPayout );
            }
        }
        setTimeout( () => {
            this.payout( ALLOWANCE_AMOUNT );
            debug( 'Payroll just paid out!' );
            this.setAction( 'message', `Allowance of ${ALLOWANCE_AMOUNT} credits has been paid out!` );
            this.setAction( 'channel', CONFIG_DEFAULTS.MAIN_CHANNEL );
            actor.handle( this.commitAction(), null );
            setInterval( () => {
                this.payout( ALLOWANCE_AMOUNT );
                debug( 'Payroll just paid out!' );
                this.setAction( 'message', `Allowance of ${ALLOWANCE_AMOUNT} credits has been paid out!` );
                this.setAction( 'channel', CONFIG_DEFAULTS.MAIN_CHANNEL );
                actor.handle( this.commitAction(), null );
            }, PERIOD );
        }, nextPayout.getTime() - currentTime.getTime() );
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
            this.payout( amnt, true );
        }
    }

    // HELPERS

    payout( amnt ) {
        Object.values( BUCKS ).forEach( id => {
            bank.addAmount( id, amnt );
        } );
        this.json['lastPayout'] = new Date();
        this.saveJSON();
    }

    overwritePayoutTime( date ) {
        this.json['lastPayout'] = date;
        this.saveJSON();
    }

    nextPayout() {
        const am1019 = new Date();
        am1019.setHours( 10 );
        am1019.setMinutes( 19 );
        am1019.setSeconds( 0 );
        am1019.setMilliseconds( 0 );
        const currentTime = new Date();
        const nextPayout = new Date( am1019 );
        if ( currentTime.getTime() > am1019.getTime() + PERIOD ) {
            nextPayout.setHours( nextPayout.getHours()+2*HOURS_BETWEEN_PAYMENT );
        } else if ( currentTime.getTime() > am1019.getTime() ) {
            nextPayout.setHours( nextPayout.getHours()+HOURS_BETWEEN_PAYMENT );
        }
        return nextPayout;
    }
}

module.exports = { payroll: new Payroll() };
