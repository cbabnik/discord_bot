const { Component } = require( '../component' );
const _ = require( 'lodash' );
const debug = require( 'debug' )( 'basic' );
const { BUCKS, ACTIONS, CONFIG_DEFAULTS } = require( '../constants' );

const ID = 'bank';
const DAYMS = 1000*24*60*60; // can be moved to constants

class Bank extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-balance$/, this.getAmount );
        this.addCommand( /^-give (.+) (\d+)$/, this.give );
        this.addCommand( /^-give (.+) (-\d+)$/, this.stealWarning );
        this.addCommand( /^-bankruptcy$/, this.bankruptcyInfo );
        this.addCommand( /^\?bankruptcy$/, this.bankruptcyInfo );
        this.addCommand( /^-declare bankruptcy\. I am sure\.$/, this.declareBankruptcy );
    }

    bootUp( actor ) {
        this.actor = actor;
        const nextDay = new Date();
        nextDay.setHours( 24 );
        nextDay.setMinutes( 0 );
        nextDay.setSeconds( 1 );
        nextDay.setMilliseconds( 0 );
        const currentTime = new Date();
        if ( this.json['lastDay'] ) {
            const lastDay = new Date( this.json['lastDay'] );
            const timePassed = currentTime.getTime() - lastDay.getTime();
            if ( timePassed > DAYMS ) {
                this.newDay();
            }
        } else {
            this.newDay();
        }
        setTimeout( () => {
            this.newDay();
            setInterval( () => {
                this.newDay();
            }, DAYMS );
        }, nextDay.getTime() - currentTime.getTime() );
    }

    newDay( ) {
        let lastDayTime = _.get(this.json, 'lastDay', 0);
        const currentTime = new Date();
        if (currentTime.getTime() - lastDayTime < DAYMS) {
            return;
        }
        const today = new Date();
        today.setHours( 0 );
        today.setMinutes( 0 );
        today.setSeconds( 1 );
        today.setMilliseconds( 0 );
        this.json['lastDay'] = today.getTime();
        this.saveJSON();

        Object.keys(this.json).forEach(k => {
            if (this.json[k].bankrupt) {
                if (_.get(this.json[k], 'credits', 0) < 0) {
                    const halfDebt = Math.ceil(-_.get(this.json[k], 'credits', 0)/2);
                    this.addAmount(k, halfDebt);
                } else {
                    _.set(this.json[k], 'credits', 0);
                }
            }
        });
    }

    getAmount( metaInfo ) {
        const id = metaInfo.authorId;
        const user = metaInfo.author;
        const amount = _.get(this.json, `${id}.credits`, 0);
        if (_.get(this.json, `${id}.bankrupt`, false)) {
            this.setAction( 'message', `You are Bankrupt. Your debt of ${-amount} will be bailed out in ${1+Math.floor(Math.log2(-amount))} days` );
        } else if ( amount === 0 ) {
            this.setAction( 'message', `Sorry **${user}**, you're flat out broke.` );
        } else if ( amount < 0 ) {
            this.setAction( 'message', `Dang **${user}**, you're in debt! You owe slots ${-amount} credits.` );
        } else {
            this.setAction( 'message', `**${user}** has **${amount}** credits banked.` );
        }
    }

    bankruptcyInfo() {
        this.setAction( 'message', 'You can declare bankruptcy and lose all your stuff. If you do, you will be ' +
            'bailed out of debt gradually. Each day that passed while bankrupt your debt will be halved, until you are ' +
            'out of debt. If you are sure you want to declare bankruptcy, use the command `-declare bankruptcy. I am sure.` ' +
            'Don\'t use this will nilly though! Curtis will see it and take away things you didn\'t even know you had.');
    }

    declareBankruptcy(metaInfo) {
        const id = metaInfo.authorId;
        const user = metaInfo.author;
        this.setAction(ACTIONS.MESSAGE, `**${user}** has declared Bankruptcy!!`);
        this.setAction(ACTIONS.CHANNEL_ID, CONFIG_DEFAULTS.MAIN_CHANNEL );
        if (_.get(this.json, `${id}.dbankrupt`, false)) {
            this.setAction(ACTIONS.MESSAGE, undefined);
        } else if (_.get(this.json, `${id}.bankrupt`, false)) {
            this.setAction(ACTIONS.MESSAGE, `**${user}** has declared **DOUBLE Bankruptcy**!!! (Double Bankruptcy is something that really sucks btw)`);
            _.set(this.json, `${id}.dbankrupt`, true);
        }
        _.set(this.json, `${id}.bankrupt`, true);
        if (this.balance(id) > 0) {
            _.set(this.json, `${id}.credits`, 0);
        }
        this.saveJSON();
    }

    // API

    balance( id, type ) {
        return _.get( this.json, `${id}.${type?type:'credits'}`, 0 );
    }

    addAmount( id, value, type ) {
        type = type?type:'credits';
        value = Number( value );
        const balance = this.balance( id, type );
        if ( isNaN( balance + value ) ) {
            debug( 'bank: add tried to set to NaN' );
            return;
        }
        _.set( this.json, `${id}.${type?type:'credits'}`, balance + value );
        if ( _.get(this.json, `${id}.bankrupt`, false) && !_.get(this.json, `${id}.dbankrupt`, false) && balance + value >= 0) {
            _.set(this.json, `${id}.bankrupt`, false);
            this.actor.handle( {
                message: `**user#${id}** is no longer bankrupt!`,
                channelId: CONFIG_DEFAULTS.MAIN_CHANNEL
            }, null);
        }
        this.saveJSON();
    }

    payAmount( id, value, type ) {
        type = type?type:'credits';
        value = Number( value );
        const balance = this.balance( id, type );
        if ( isNaN( balance - value ) ) {
            debug( 'bank: pay tried to set to NaN' );
            return false;
        }
        if ( value < 0 ) {
            debug( 'bank: tried to pay negative' );
            return false;
        }
        if ( value > balance ) {
            return false;
        }
        _.set( this.json, `${id}.${type}`, balance - value );
        this.saveJSON();
        return true;
    }

    give( user, amnt, metaInfo ) {
        const id = BUCKS[user.toUpperCase()];
        if ( !id ) {
            this.setAction( 'message', `Sorry, I could not find user **${user}**` );
            return;
        }

        if ( this.payAmount( metaInfo.authorId, amnt ) ) {
            this.addAmount( id, amnt );
            this.setAction( 'message', `**${metaInfo.author}** has given ${amnt} credits to **${user}**` );
        } else {
            this.setAction( 'message', `**${metaInfo.author}**, you don't have enough credits. Check with \`-balance\`` );
        }
    }

    stealWarning() {
        this.setAction( 'message', 'Are you trying to steal? shame on you.' );
    }
}

module.exports = { bank: new Bank() };
