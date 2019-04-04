const { Component } = require( '../component' );
const _ = require( 'lodash' );
const debug = require( 'debug' )( 'basic' );
const { BUCKS } = require( '../constants' );

const ID = 'bank';

class Bank extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-balance$/, this.getAmount );
        this.addCommand( /^-give (.+) (\d+)$/, this.give );
        this.addCommand( /^-give (.+) (-\d+)$/, this.stealWarning );
    }

    getAmount( metaInfo ) {
        const id = metaInfo.authorId;
        const user = metaInfo.author;
        const amount = _.get( this.json, `${id}.credits`, 0 );
        if ( amount === 0 ) {
            this.setAction( 'message', `Sorry **${user}**, you're flat out broke.` );
        } else if ( amount < 0 ) {
            this.setAction( 'message', `Dang **${user}**, you're in debt! You owe slots ${-amount} credits.` );
        } else {
            this.setAction( 'message', `**${user}** has **${amount}** credits banked.` );
        }
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
        this.saveJSON();
    }

    payAmount( id, value, type ) {
        type = type?type:'credits';
        value = Number( value );
        const balance = this.balance( id, type );
        if ( isNaN( balance - value ) ) {
            debug( 'bank: pay tried to set to NaN' );
            return;
        }
        if ( value > balance ) {
            return false;
        }
        _.set( this.json, `${id}.${type}`, balance - value );
        this.saveJSON();
        return true;
    }

    give(user, amnt, metaInfo) {
        const id = BUCKS[player.toUpperCase()];
        if (!id) {
            this.setAction('message', `Sorry, I could not find user **${user}**`);
            return;
        }

        if (this.payAmount(metaInfo.authorId, amnt)) {
            this.addAmount(id, amnt);
            this.setAction('message', `**${metaInfo.author}** has given ${amnt} credits to **${user}**`);
        } else {
            this.setAction('message', `**${metaInfo.author}**, you don't have enough credits. Check with \`-balance\``);
        }
    }

    stealWarning() {
        this.setAction('message', 'Are you trying to steal? shame on you.');
    }
}

module.exports = { bank: new Bank() };
