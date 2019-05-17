if ( process.argv.length === 2 || !['--alpha','--beta'].includes( process.argv[2] ) ) {
    process.exit( 1 );
}

const fs = require( 'fs' );
const util = require( './util' );
const rl = require( 'readline' ).createInterface({
    input: process.stdin,
    output: process.stdout
});

const { Client } = require( './client' );
const { DispatcherGenerator } = require( './dispatch' );
const { Monitor } = require( './monitor' );
const { Scanner } = require( './scan' );
const { Actor } = require( './actor' );
const { LOGIN_TOKEN } = require( './auth' );
const { MAX_MESSAGES, CONFIG_DEFAULTS, ALPHA, BETA } = require( './constants' );

const client = Client( MAX_MESSAGES, LOGIN_TOKEN );
const actor = Actor( client );
const dispatcher = DispatcherGenerator( Scanner )( actor );
Monitor( client, dispatcher );
util.setClient( client );

const componentsNames = ['utility', 'help', 'audio', 'pictures', 'lottery', 'admin', 'requests',
    'quotes', 'fun', 'payroll', 'bank', 'calendar'];
const components = [];
componentsNames.forEach(c => {
    const comp = require( `./components/${c}` )[c];
    dispatcher.registerComponent(comp);
    components.push(comp);
});

if ( !fs.existsSync( CONFIG_DEFAULTS.STORAGE_DIRECTORY ) ) {
    fs.mkdirSync( CONFIG_DEFAULTS.STORAGE_DIRECTORY, {}, () => {} );
}

if ( CONFIG_DEFAULTS.VERSION === ALPHA.VERSION ) {
    // register any components which are still under initial test here.
}

if ( fs.existsSync( './components/secret.js' ) ) {
    dispatcher.registerComponent( require( './components/secret' ).secret );
}

setTimeout( () => {
    if ( CONFIG_DEFAULTS.VERSION === BETA.VERSION ) {
        setInterval(() => {
            components.forEach(c => {c.saveJSON()});
            util.backup();
        },1000*60*60);
    }

    rl.on('SIGINT', () => {
        process.emit('SIGINT');
    });
    process.on('SIGINT', () => {
        process.exit(0);
    });

    process.on('exit', () => {
        console.log('Doing exit cleanup...');
        components.forEach(c => {c.saveJSON()});
        if ( CONFIG_DEFAULTS.VERSION === BETA.VERSION ) {
            util.backup();
        }
        console.log('Done.');
    });
}, 5000 );
