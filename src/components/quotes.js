const { Component } = require( './component' );
const { BUCKS } = require( '../core/constants' );
const { getId } = require( '../core/util' );
const _ = require( 'lodash' );

const ID = 'quotes';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

class Quotes extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-new ?[qQ]uote ([^ ]+) "(.+)"$/, ( username, quote ) => this.newQuote( username, undefined, quote ) );
        this.addCommand( /^-new ?[qQ]uote ([^ ]+) (.+) "(.+)"$/, this.newQuote );
        this.addCommand( /^-new ?[qQ]uote ([^ ]+) (.+)$/, ( username, quote ) => this.newQuote( username, undefined, quote ) );
        this.addCommand( /^-quote ([^ ]+) (\d+)$/, this.quote );
        this.addCommand( /^-quote ([^ ]+)$/, ( username ) => this.quote( username, undefined ) );
        this.addCommand( /^-quote$/, () => this.quote( 'random', undefined ) );
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

        if ( !this.json[id] ) {
            this.json[id] = [];
        }

        this.json[id].push( {message: quote, date} );
        

        this.setAction( 'message', 'Quote accepted.' );
    }

    quote( username, idx ) {
        let id;
        if ( username === 'random' ) {
            const keys = Object.keys( BUCKS ).filter( k => _.get( this.json, BUCKS[k], [] ).length > 0 );
            if ( keys.length === 0 ) {
                this.setAction( 'message', 'No one has any quotes' );
                return;
            }
            const k = _.sample( keys );
            username = k.charAt( 0 ).toUpperCase() + k.toLowerCase().slice( 1 );
            id = BUCKS[k];
        } else {
            id = getId( username );
            if ( !id ) {
                this.setAction( 'message', 'The given username could not be matched' );
                return;
            }
        }

        const quotes = _.get( this.json, id, [] );
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
