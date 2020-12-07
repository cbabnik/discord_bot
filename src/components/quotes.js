const { Component } = require( './component' );
const { BUCKS } = require( '../core/constants' );
const { getId, getUser } = require( '../core/util' );
const _ = require( 'lodash' );

const ID = 'quotes';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

class Quotes extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-new ?[qQ]uote ([^ ]+) "(.+)"$/, ( username, quote ) => this.newQuote( username, undefined, quote ), 'quotes' );
        this.addCommand( /^-new ?[qQ]uote ([^ ]+) (.+) "(.+)"$/, this.newQuote, 'quotes' );
        this.addCommand( /^-new ?[qQ]uote ([^ ]+) (.+)$/, ( username, quote ) => this.newQuote( username, undefined, quote ), 'quotes' );
        this.addCommand( /^-quote ([^ ]+) (\d+)$/, this.quote, 'quotes' );
        this.addCommand( /^-quote ([^ ]+)$/, ( username ) => this.quote( username, undefined ), 'quotes' );
        this.addCommand( /^-quote$/, () => this.quote( 'random', undefined ), 'quotes' );
    }

    newQuote( username, date, quote ) {
        const id = getId( username );
        if ( !id ) {
            this.setAction( 'message', 'The given username could not be matched' );
            return;
        }

        if ( !date ) {
            const time = new Date();
            const m = MONTH_NAMES[time.getMonth()];
            const y = time.getFullYear();

            date = `${y} ${m}`;
        }

        this.storage.append(id, {message: quote, date})
        this.setAction( 'message', 'Quote accepted.' );
    }

    async quote( username, idx ) {
        let id;
        if ( username === 'random' ) {
            const keys = await this.storage.storage.keys();
            if ( keys.length === 0 ) {
                this.setAction( 'message', 'No one has any quotes' );
                return;
            }
            id = _.sample( keys );
            username = getUser(id)
        } else {
            id = getId( username );
            if ( !id ) {
                this.setAction( 'message', 'The given username could not be matched' );
                return;
            }
        }

        const quotes = await this.storage.get( id, [] );
        if ( !quotes || quotes.length === 0 ) {
            this.setAction( 'message', `**${username}** does not have any quotes yet.` );
            return;
        }

        if ( typeof idx === 'undefined' ) {
            idx = Math.floor( quotes.length*Math.random() );
        }
        const quote = quotes[idx%quotes.length];
        const quoteMsg = quote.message;
        const quoteDate = quote.date;

        this.setAction( 'message', `:
        
*${quoteMsg}*

-**${username}**, ${quoteDate}` );
    }
}

module.exports = { quotes: new Quotes() };
