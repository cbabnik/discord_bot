const fs = require( 'fs' );

const { Client } = require( './client' );
const { DispatcherGenerator } = require( './dispatch' );
const { Monitor } = require( './monitor' );
const { Scanner } = require( './scan' );
const { Actor } = require( './actor' );
const { LOGIN_TOKEN } = require( './auth' );
const { MAX_MESSAGES } = require( './constants' );

const client = Client( MAX_MESSAGES, LOGIN_TOKEN );
const actor = Actor( client );
const dispatcher = DispatcherGenerator( Scanner )( actor );
Monitor( client, dispatcher );

dispatcher.registerComponent( require( './components/utility' ).utility );
dispatcher.registerComponent( require( './components/help' ).help );
dispatcher.registerComponent( require( './components/audio' ).audio );
dispatcher.registerComponent( require( './components/pictures' ).pictures );
dispatcher.registerComponent( require( './components/lottery' ).lottery );
dispatcher.registerComponent( require( './components/bank' ).bank );
dispatcher.registerComponent( require( './components/admin' ).admin );

if ( fs.existsSync( './components/secret.js' ) ) {
    dispatcher.registerComponent( require( './components/secret' ).secret );
}

const { payroll } = require( './components/payroll' );
dispatcher.registerComponent( payroll );

// client needs some time to setup, so we'll just give it a second.
setTimeout( () => {
    payroll.bootUp( actor );
}, 1000 );