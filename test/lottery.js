const { lottery } = require( '../components/lottery' );
const { bank } = require( '../components/bank' );
const { pictures } = require( '../components/pictures' );
const { CONFIG_DEFAULTS } = require( '../constants' );
const _ = require( 'lodash' );

const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const seed = require( 'seed-random' );

const START_AMOUNT = 999999999;
const metaInfo = {
    channelId: CONFIG_DEFAULTS.MAIN_CHANNEL,
    author: 'test',
    authorId: '0'
};
let hasMantle;

describe( 'Lottery', () => {

    before( () => {
        sinon.restore();
        sinon.stub( lottery, 'saveJSON' );
        sinon.stub( lottery, 'offLimitsFor' );
        sinon.stub( lottery, 'isOffLimits' ).callsFake( () => false );
        sinon.stub( lottery, 'createImage' ).callsFake( () => '' );
        sinon.stub( bank, 'saveJSON' );
        sinon.stub( pictures, 'saveJSON' );

        hasMantle = sinon.stub( lottery, 'hasHolyMantle' ).callsFake( () => false );
    } );

    after( () => {
        sinon.restore();
    } );

    beforeEach( () => {
        seed( 'test', {global: true} );
        lottery.useLodashInContext();

        lottery.json = {};
        bank.json = {
            '0': {
                'credits': START_AMOUNT
            }
        };

        hasMantle.resetHistory();
    } );

    afterEach( () => {
        seed.resetGlobal();
    } );

    const wins = {
        ':deer:': 3,
        ':poop:': 1,
        ':melon:': 3,
        ':cherries:': 5,
        ':tangerine:': 4,
        ':lemon:': 2,
        ':two:': 1,
        ':three:': 4,
        ':five:': 3,
        ':seven:': 2,
    };

    const overrules = [
        {emote: ':poop:',  multiply: undefined, value: -10}
    ];

    describe( 'results', () => {
        it( 'multiply interaction is correct', () => {
            const r = lottery.results( wins );
            expect( r.winnings ).to.equal( -773955000 );
            expect( r.deerWins ).to.equal( -992250 );
        } );
        it( 'overrules work', () => {
            const r = lottery.results( wins, overrules );
            expect( r.winnings ).to.equal( 764032500 );
            expect( r.deerWins ).to.equal( 992250 );
        } );
    } );

    describe( '-cslots', () => {
        it( 'Passes all tests', () => {
            for ( let i = 0; i < 100; i++ ) {
                lottery.coinslots( metaInfo );
            }
            // wins an appropriate amount
            const totalWinnings = lottery.json['0']['coin']['winnings'];
            expect( totalWinnings ).to.equal( 98 );
            // bank is modified correctly
            expect( bank.json['0']['credits'] ).to.equal( START_AMOUNT + totalWinnings - 100 );
            // holy mantle not called
            expect( hasMantle.called ).to.equal( true );
        } );
    } );

    describe( '-gslots', () => {
        it( 'Passes all tests', () => {
            for ( let i = 0; i < 100; i++ ) {
                lottery.gridslots( metaInfo );
            }
            // wins an appropriate amount
            const totalWinnings = lottery.json['0']['grid']['winnings'] + _.get( lottery.json['0'], 'buck.winnings', 0 );
            expect( totalWinnings ).to.equal( 695 );
            // bank is modified correctly
            expect( bank.json['0']['credits'] ).to.equal( START_AMOUNT + totalWinnings - 500 );
            // holy mantle called
            expect( hasMantle.called ).to.equal( true );
        } );
    } );

    describe( '-mslots', () => {
        it( 'Passes all tests', () => {
            for ( let i = 0; i < 100; i++ ) {
                lottery.mazeSlots( metaInfo );
            }
            // wins an appropriate amount
            const totalWinnings = lottery.json['0']['maze']['winnings'] + _.get( lottery.json['0'], 'buck.winnings', 0 );
            expect( totalWinnings ).to.equal( 1230 );
            // bank is modified correctly
            expect( bank.json['0']['credits'] ).to.equal( START_AMOUNT + totalWinnings - 2000 );
            // holy mantle called
            expect( hasMantle.called ).to.equal( true );
        } );
    } );

    describe( '-bslots', () => {
        it( 'Passes all tests', () => {
            for ( let i = 0; i < 100; i++ ) {
                lottery.buckSlots( 'test','0' );
            }
            // wins an appropriate amount
            const totalWinnings = lottery.json['0']['buck']['winnings'];
            expect( totalWinnings ).to.equal( 3377 );
            // bank is modified correctly
            expect( bank.json['0']['credits'] ).to.equal( START_AMOUNT + totalWinnings );
            // holy mantle not called
            expect( hasMantle.called ).to.equal( false );
        } );
    } );
} );