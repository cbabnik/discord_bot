const { Component } = require( '../component' );
const _ = require( 'lodash' );

const bigInt = require( 'big-integer' );

const ID = 'utility';

class Utility extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-roll (\d+)$/, ( max ) => this.roll( 1,max ) );
        this.addCommand( /^-roll (-?\d+) (-?\d+)$/, this.roll );
        this.addCommand( /^-roll/, this.rollInfo );
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
    }

    rollInfo() {
        this.setAction( 'message', 'Try `-roll [min] [max]`' );
    }

    roll( min, max ) {
        const result = bigInt.randBetween( min,max );
        this.setAction( 'message', result.toString() );
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
}

module.exports = { utility: new Utility() };
