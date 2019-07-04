const { Component } = require( '../component' );
const _ = require( 'lodash' );

const bigInt = require( 'big-integer' );

const ID = 'utility';

const { Storage } = require('../pdata');
const alias_data = new Storage('alias');

class Utility extends Component {
    constructor() {
        super( ID );
        // first one in the list is not working for some reason
        this.addCommand( /^-notwork$/, this.rollInfo );
        this.addCommand( /^-random pick(\d+) (\S+(?: \S+)+)$/, this.random );
        this.addCommand( /^-random pick(\d+) (\S+(?:,[^\s,]+)+)$/, this.random );
        this.addCommand( /^-random pick (\d+) (\S+(?: \S+)+)$/, this.random );
        this.addCommand( /^-random pick (\d+) (\S+(?:,[^\s,]+)+)$/, this.random );
        this.addCommand( /^-random (\S+(?:,[^\s,]+)+)$/, ( list ) => this.random( 1,list ) );
        this.addCommand( /^-random (\S+(?: \S+)+)$/, ( list ) => this.random( 1,list ) );
        this.addCommand( /^-random \S+$/, this.randomInfoB );
        this.addCommand( /^-random/, this.randomInfo );
        this.addCommand( /^-math ([ \-+*/.()\d]*)$/, this.calculate );
        this.addCommand( /^-coinflip$/, () => this.coinflip( '', '' ) );
        this.addCommand( /^-coinflip (\S+) (\S+)$/, this.coinflip );
        this.addCommand( /^-coinflip/, this.coinflipInfo );
        this.addCommand( /^-roll (\d+)$/, ( max ) => this.roll( 1,max ) );
        this.addCommand( /^-roll (\d+)d(\d+)$/, ( dice, max ) => this.rollExtra( dice, 1, max ) );
        this.addCommand( /^-roll (\d+)d(\d+)-(\d+)$/, this.rollExtra );
        this.addCommand( /^-roll maidstats$/, this.rollMaidStats );
        this.addCommand( /^-roll (-?\d+) (-?\d+)$/, this.roll );
        this.addCommand( /^-roll/, this.rollInfo );
        this.addCommand( /^-alias "([^"]*)" "([^"]*)"$/, (t, f, mi) => this.alias(t, f, {inline:false, edit:false}, mi) );
        this.addCommand( /^-alias --inline "([^"]*)" "([^"]*)"$/, (t, f, mi) => this.alias(t, f, {inline:true, edit:false}, mi) );
        this.addCommand( /^-alias --edit "([^"]*)" "([^"]*)"$/, (t, f, mi) => this.alias(t, f, {inline:false, edit:true}, mi) );
        this.addCommand( /^-alias --inline --edit "([^"]*)" "([^"]*)"$/, (t, f, mi) => this.alias(t, f, {inline:true, edit:true}, mi) );
        this.addCommand( /^-alias --edit --inline "([^"]*)" "([^"]*)"$/, (t, f, mi) => this.alias(t, f, {inline:true, edit:true}, mi) );
        this.addCommand( /^-aliases$/, this.aliasPrint );
        this.addCommand( /^-aliases clear$/, this.aliasClearAll );
    }

    rollInfo() {
        this.setAction( 'message', 'Try `-roll [min] [max]`' );
    }

    roll( min, max ) {
        const result = bigInt.randBetween( min,max );
        this.setAction( 'message', `You rolled: **${result.toString()}**` );
    }

    rollExtra( dice, min, max ) {
        let rolls = '';
        let total = 0;
        for ( let i = 0; i < dice; i++ ) {
            const val = bigInt.randBetween( min, max );
            total += val;
            rolls += `\`${val}\` `;
        }
        this.setAction( 'message', `You rolled: ${rolls}. Total: **${total}**` );
    }

    rollMaidStats() {
        let message = 'Your stats are:';
        let totalvalue = 0;
        ['Athletics', 'Affection', 'Skill', 'Cunning', 'Luck', 'Will'].forEach( stat => {
            const rollA = bigInt.randBetween( 1,6 );
            const rollB = bigInt.randBetween( 1,6 );
            const total = rollA+rollB;
            const value = Math.floor( total/3 );
            totalvalue += value;
            message += `\n\`${rollA}\`+\`${rollB}\` = ${total} / 3 = **${stat}: ${value}**`;
        } );
        this.setAction( 'message', message );
        if ( totalvalue <= 9 ) {
            this.queueAction();
            this.setAction( 'message', 'Since you have a total of less than or equal to 9, you get a second maid power.' );
        }
    }

    randomInfo() {
        this.setAction( 'message', 'Try `-random [a] [b] [c]`' );
    }
    randomInfoB() {
        this.setAction( 'message', 'You need more than one option to random between' );
    }

    random( n, options ) {
        if ( options.includes( ' ' ) ) {
            options = options.split( ' ' );
        } else {
            options = options.split( ',' );
        }
        n = Number( n );
        if ( n === 1 ) {
            this.setAction( 'message', _.sample( options ) );
        } else if ( n === 0 ) {
            this.setAction( 'message', '(What were you expecting?)' );
            this.setAction( 'delay', 3 );
        } else if ( n > options.length ) {
            this.setAction( 'message', 'number has to be less than or equal to the number of elements to random between.' );
        } else {
            this.setAction( 'message', _.sampleSize( options, n ).join( ' ' ) );
        }
    }

    // WARNING: be very careful to validate input for this function
    calculate( str ) {
        try {
            const result = eval( str );
            this.setAction( 'message', 'The result is: ' + result.toString() );
        } catch ( _ ) {
            this.setAction( 'message', 'No value could be determined.' );
        }
    }

    coinflip( a, b ) {
        if ( Math.random() >= 0.5 ) {
            this.setAction( 'message', a );
            this.setAction( 'image', 'heads.jpg' );
        } else {
            this.setAction( 'message', b );
            this.setAction( 'image', 'tails.jpg' );
        }
    }

    coinflipInfo() {
        this.setAction( 'message', 'Invalid use, try `-coinflip HEADS TAILS`' );
    }

    alias(from, to, options, metaInfo) {
        console.log(metaInfo);
        const id = metaInfo.authorId;
        const aliases = alias_data.get(id, {});
        aliases[from] = {text: to, ...options};
        alias_data.set(id, aliases);
        this.setAction( 'message', 'Alias set.');
    }

    aliasClearAll(metaInfo) {
        const id = metaInfo.authorId;
        alias_data.set(id, {});
        this.setAction( 'message', 'Your aliases have been cleared.');
    }

    aliasPrint(metaInfo) {
        const id = metaInfo.authorId;
        let msg = 'Your aliases:';
        const aliases = alias_data.get(id, {});
        Object.keys(aliases).forEach((k) => {
            msg += `\n\`${k}\` - \`${aliases[k].text}\``
        });
        this.setAction( 'message', msg);
    }
}

module.exports = { utility: new Utility() };
