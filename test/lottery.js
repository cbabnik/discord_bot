const seed = require("./seed.js")

const { CONFIG } = require( '../src/core/constants' );

const cslots_machine = require('../src/components/slot_machines/cslots');
const gslots_machine = require('../src/components/slot_machines/gslots');
const mslots_machine = require('../src/components/slot_machines/mslots');
const bslots_machine = require('../src/components/slot_machines/bslots');
const bgslots_machine = require('../src/components/slot_machines/bgslots');

const _ = require( 'lodash' );

const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;

const metaInfo = {
    channelId: CONFIG.MAIN_CHANNEL,
    author: 'test',
    authorId: '0'
};

describe( 'Lottery', () => {

    before( () => {
        sinon.restore();
        sinon.stub( bslots_machine, "createImage" ).callsFake( async () => '' )
    } );

    after( () => {
        sinon.restore();
    } );

    beforeEach( () => {
        seed( 'test', {global: true} );
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
            const r = mslots_machine.results( wins );
            expect( r.winnings ).to.equal( -773955000 );
            expect( r.deerWins ).to.equal( -992250*3 );
        } );
    } );

    describe( '-cslots', () => {
        it( 'Wins appropriate amount', () => {
            let totalWinnings = 0
            for ( let i = 0; i < 100000; i++ ) {
                const r = cslots_machine.roll( metaInfo.user, metaInfo.userId );
                totalWinnings += r.winnings
            }
            expect( totalWinnings ).to.equal( 95575 );
        } );
    } );

    describe( '-gslots', () => {
        it( 'Wins appropriate amount', async () => {
            let totalWinnings = 0
            let buckrolls = 0
            for ( let i = 0; i < 10000; i++ ) {
                const r = await gslots_machine.roll( metaInfo.user, metaInfo.userId );
                totalWinnings += r.winnings
                buckrolls += r.buckrolls
            }
            expect( totalWinnings ).to.equal( 27655 );
            expect( buckrolls ).to.equal( 174 );
        } );
    } );

    describe( '-mslots', () => {
        it( 'Wins appropriate amount', async  () => {
            let totalWinnings = 0
            let buckrolls = 0
            for ( let i = 0; i < 1000; i++ ) {
                const r = await mslots_machine.roll( metaInfo.user, metaInfo.userId );
                totalWinnings += r.winnings
                buckrolls += r.buckrolls
            }
            expect( totalWinnings ).to.equal( 15905 );
            expect( buckrolls ).to.equal( 299 );
        } );
    } );

    describe( '-bslots', () => {
        it( 'Wins appropriate amount', async () => {
            let totalWinnings = 0
            for ( let i = 0; i < 200; i++ ) {
                const r = await bslots_machine.roll( metaInfo.user, metaInfo.userId );
                totalWinnings += r.winnings
            }
            expect( totalWinnings ).to.equal( 4929 );
        } );
    } );
} );