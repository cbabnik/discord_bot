/* no-console: 2 */
slots = "all"
var args = process.argv.slice(2);
if (args.length === 1) {
    slots = args[0]
}

const cslots_machine = require('../src/components/slot_machines/cslots');
const gslots_machine = require('../src/components/slot_machines/gslots');
const mslots_machine = require('../src/components/slot_machines/mslots');
const bslots_machine = require('../src/components/slot_machines/bslots');
const bgslots_machine = require('../src/components/slot_machines/bgslots');

const { statistics } = require( '../src/components/statistics' );
const { bank } = require( '../src/components/bank' );

const { CONFIG } = require( '../src/core/constants' );

const _ = require( 'lodash' );

const sinon = require( 'sinon' );

const metaInfo = {
    channelId: CONFIG.MAIN_CHANNEL,
    author: 'test',
    authorId: '0'
};
const report = {};
let lastWinnings = 0;
let lastBuckrolls = 0;


( async () => {
    await new Promise(resolve => setTimeout(resolve, 500));

    sinon.stub( statistics.storage, "apply" ).callsFake( async () => '' )
    sinon.stub( statistics.storage, "add" ).callsFake( async () => '' )
    sinon.stub( bank.storage, "add" ).callsFake( async () => 0 )
    sinon.stub( bank.storage, "get" ).callsFake( async () => 0 )

    sinon.stub( bslots_machine, "createImage" ).callsFake( async () => '' )
    sinon.stub( bank, "addAmount" ).callsFake( async () => '' )
    sinon.stub( bank, "balance" ).callsFake( async () => 0 )

    if (slots === "all" || slots === "buck") {
        lastWinnings = 0
        for ( let i = 0; i < 100000; i++ ) {
            if ( i%10000 === 0 ) {
                console.log( `bslots simulation ${i/1000}%` );
            }
            const r = await bslots_machine.roll( metaInfo.user, metaInfo.userId );
            lastWinnings += r.winnings
        }
        report.buck = {}
        report.buck.winnings = lastWinnings
    }
    if (slots === "all" || slots === "coin") {
        lastWinnings = 0
        for ( let i = 0; i < 1000000; i++ ) {
            if ( i%100000 === 0 ) {
                console.log( `cslots simulation ${i/10000}%` );
            }
            const r = await cslots_machine.roll( metaInfo.user, metaInfo.userId );
            lastWinnings += r.winnings
        }
        report.coin = {}
        report.coin.winnings = lastWinnings
    }
    if (slots === "all" || slots === "grid") {
        lastWinnings = 0
        lastBuckrolls = 0
        for ( let i = 0; i < 100000; i++ ) {
            if ( i%10000 === 0 ) {
                console.log( `gslots simulation ${i/1000}%` );
            }
            const r = await gslots_machine.roll( metaInfo.user, metaInfo.userId );
            lastWinnings += r.winnings
            lastBuckrolls += r.buckrolls
        }
        report.grid = {}
        report.grid.winnings = lastWinnings
        report.grid.buckrolls = lastBuckrolls
    }
    if (slots === "all" || slots === "maze") {
        lastWinnings = 0
        lastBuckrolls = 0
        for ( let i = 0; i < 100000; i++ ) {
            if ( i%10000 === 0 ) {
                console.log( `mslots simulation ${i/1000}%` );
            }
            const r = await mslots_machine.roll( metaInfo.user, metaInfo.userId );
            lastWinnings += r.winnings
            lastBuckrolls += r.buckrolls
        }
        report.maze = {}
        report.maze.winnings = lastWinnings
        report.maze.buckrolls = lastBuckrolls
    }
    if (slots === "all" || slots === "bgrid") {
        lastWinnings = 0
        lastBuckrolls = 0
        for ( let i = 0; i < 10000; i++ ) {
            if ( i%1000 === 0 ) {
                console.log( `bgslots simulation ${i/100}%` );
            }
            const r = await bgslots_machine.roll( metaInfo.user, metaInfo.userId );
            lastWinnings += r.winnings
            lastBuckrolls += r.buckrolls
        }
        report.bgrid = {}
        report.bgrid.winnings = lastWinnings
        report.bgrid.buckrolls = lastBuckrolls
    }
    
    console.log(report)
    
})();