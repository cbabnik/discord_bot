// persistent data storage
// for now this uses json, but may be changed to SQL in the future

const fs = require( 'fs' );
const archiver = require( 'archiver' );
const _ = require( 'lodash' );
const {CONFIG, BETA} = require( './constants' );
const { time } = require( './util' );

class Storage {
    constructor( id ) {
        this.id = id;
        this.jsonFile = '../../' + CONFIG.STORAGE_DIRECTORY+id+'.json';

        const dp = pdata.find( ( dp ) => {
            return dp.id === id;
        } );
        if ( dp ) {
            this.json = dp.json;
        } else {
            this.json = fs.existsSync( this.jsonFile )?require( this.jsonFile ):{};
        }

        pdata.push( this );
    }

    save() {
        if ( fs.existsSync( this.jsonFile ) || this.json !== {} ) {
            fs.writeFileSync( this.jsonFile, JSON.stringify( this.json ), 'utf8', () => {} );
        }
    }

    get( field, default_val=0 ) {
        return _.get( this.json, field, default_val );
    }

    set( field, value ) {
        _.set( this.json, field, value );
    }

    apply( field, operand, default_val=0, fn ) {
        _.set( this.json, field, fn( _.get( this.json, field, default_val ) , operand ) );
    }

    add( field, operand, default_val=0 ) {
        this.apply( field, operand, default_val, _.sum );
    }
}

const pdata = [];

const saveAll = () => {
    pdata.forEach( c => c.save() );
};

const backup = () => {
    const now = new Date();
    const dateStr = time.toFileString( now );
    const fileName = `backups/backup_${dateStr}.zip`;

    const output = fs.createWriteStream( fileName );
    const archive = archiver( 'zip' );

    archive.directory( 'storage/' ).pipe( output );
    archive.finalize();
};

/*
const rl = require( 'readline' ).createInterface( {
    input: process.stdin,
    output: process.stdout
} );
setTimeout( () => {
    if ( CONFIG_DEFAULTS.VERSION === BETA.VERSION ) {
        setInterval( () => {
            saveAll();
            //backup();
        },1000*60*60 );
    }

    rl.on( 'SIGINT', () => {
        process.emit( 'SIGINT' );
    } );
    process.on( 'SIGINT', () => {
        process.exit( 0 );
    } );

    process.on( 'exit', () => {
        console.log( 'Doing pdata exit cleanup...' );
        saveAll();
        //backup();
        console.log( 'Done pdata.' );
    } );
}, 5000 );
*/
module.exports = { Storage };
