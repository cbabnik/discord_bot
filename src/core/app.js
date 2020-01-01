/* eslint-disable no-console */
if ( process.argv.length === 2 || !['--alpha','--beta'].includes( process.argv[2] ) ) {
    console.log( 'Use --alpha or --beta' );
    process.exit( 1 );
}

// setup
// ______________________________

const util = require( './util' );
const { LOGIN_TOKEN } = require( './auth.js' );
const { MAX_MESSAGES, CONFIG_DEFAULTS, ALPHA } = require( './constants' );
const fs = require( 'fs' );
if ( !fs.existsSync( './storage' ) ) {
    fs.mkdirSync( './storage', {}, () => {} );
}
if ( !fs.existsSync( CONFIG_DEFAULTS.STORAGE_DIRECTORY ) ) {
    fs.mkdirSync( CONFIG_DEFAULTS.STORAGE_DIRECTORY, { recursive: true }, () => {} );
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
process.on( 'exit', () => {
    //util.backup();
    //console.log( 'Backed up data.' );
} );

// initialization
// ______________________________

const componentsNames = ['utility', 'audio', 'quotes', 'pictures'];
if ( fs.existsSync( './src/components/secret.js' ) ) {
    componentsNames.push( 'secret' );
}

const components = [];
componentsNames.forEach( c => {
    const comp = require( `../components/${c}` )[c];
    dispatcher.registerComponent( comp );
    components.push( comp );
} );
if ( CONFIG_DEFAULTS.VERSION === ALPHA.VERSION ) {
    // register any components which are still under initial test here.
}

