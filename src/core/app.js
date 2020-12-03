/* eslint-disable no-console */
if ( process.argv.length === 2 || !['--alpha','--beta'].includes( process.argv[2] ) ) {
    console.log( 'Use --alpha or --beta' );
    process.exit( 1 );
}

// setup
// ______________________________

const util = require( './util' );
const { LOGIN_TOKEN } = require( '../../auth.js' );
const { MAX_MESSAGES, CONFIG, ALPHA } = require( './constants' );
const fs = require( 'fs' );
if ( !fs.existsSync( './storage' ) ) {
    fs.mkdirSync( './storage', {}, () => {} );
}
if ( !fs.existsSync( CONFIG.STORAGE_DIRECTORY ) ) {
    fs.mkdirSync( CONFIG.STORAGE_DIRECTORY, { recursive: true }, () => {} );
}

// construction
// ______________________________

const { Client } = require( './client' );
const { DispatcherGenerator } = require( './dispatch' );
const { Filter } = require( './filter' );
const { Scanner } = require( './scan' );
const { Actor } = require( './actor' );

const client = Client( MAX_MESSAGES, LOGIN_TOKEN );
const actor = Actor( client );
const dispatcher = DispatcherGenerator( Scanner )( actor );
Filter( client, dispatcher );
util.setClient( client );

// behavior on app crash or close
// ______________________________

const rl = require( 'readline' ).createInterface( {
    input: process.stdin,
    output: process.stdout
} );
rl.on( 'SIGINT', () => {
    process.emit( 'SIGINT' );
} );
process.on( 'SIGINT', () => {
    process.exit( 0 );
} );
process.on( 'exit', (code) => {
    console.log( 'Shutdown detected!' );
    console.log( `Exitting with code: ${code}` );
    util.backup();
    console.log( 'Backed up data.' );
    util.getClient().destroy();
    console.log( 'Client destroyed.' );
    if (code != 0) {
        // Curtis should get alerted in some way. Email? SMS?
        console.log( 'script should get triggered to email Curtis now' )
    }
} );

// initialization
// ______________________________

const componentsNames = ['utility', 'audio', 'quotes', 'pictures'];
if ( fs.existsSync( './src/components/secret.js' ) ) {
    componentsNames.push( 'secret' );
}
const alphaComponentNames = ['admin']
if ( CONFIG.VERSION === ALPHA.VERSION ) {
    alphaComponentNames.forEach( comp_name => {
        componentsNames.push( comp_name )
    })
}

const components = [];
componentsNames.forEach( c => {
    const comp = require( `../components/${c}` )[c];
    dispatcher.registerComponent( comp );
    components.push( comp );
} );

