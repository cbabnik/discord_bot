const { BUCKS, ALIASES, CONFIG } = require( './constants' );
const archiver = require( 'archiver' );
const fs = require( 'fs' );
const debug = require( 'debug' )( 'basic' );

let client;
let guildMembers;

exports.setClient = ( cli ) => {
    client = cli;
};

exports.getClient = () => {
    return client;
};

exports.getGuild = () => {
    return client.guilds.resolve( CONFIG.GUILD )
};

// accepts:
// bugslinger (registered name)
// spookslinger (current nickname)
// 106853033526247424 (actual id)
// bugs (aliases) 
exports.getId = ( username ) => {
    const upperUser = username.toUpperCase();
    if ( Object.keys( BUCKS ).includes( upperUser ) ) {
        return BUCKS[upperUser];
    }
    if ( Object.keys( ALIASES ).includes( upperUser ) ) {
        return ALIASES[upperUser];
    }
    let user = client.users.resolve( upperUser );
    if ( user ) {
        return user.id;
    }
    return undefined;
};

// prioritizes giving back:
// user nickname
// user name
// "user#{id}"
exports.getUser = ( id ) => {
    const user = client.users.resolve( id );
    if ( user ) {
        if ( user.nickname ) {
            return user.nickname;
        }
        return user.username;
    }
    return `user#${id}`;
};

exports.getVoiceChannel = ( id ) => {
    if ( !guildMembers ) {
        guildMembers = client.guilds.resolve( CONFIG.GUILD ).members;
    }
    const member = guildMembers.resolve( id );
    if ( member ) {
        return member.voice.channelID;
    } else {
        debug( member );
    }
};

exports.backupOnRepeat = () => {
    backup();
    setInterval( () => {
        backup();
    }, 3600000 ); // one hour hard coded
};

const backup = () => {
    const now = new Date();
    const dateStr = toFileString( now );
    const fileName = `backups/backup_${dateStr}.zip`;

    const output = fs.createWriteStream( fileName );
    const archive = archiver( 'zip' );

    archive.directory( 'storage/' ).pipe( output );
    archive.finalize();
    debug( 'Data Backed up!' );
};
exports.backup = backup;

const tomorrow = () => {
    const am = new Date();
    am.setHours( 24 );
    am.setMinutes( 0 );
    am.setSeconds( 15 );
    am.setMilliseconds( 0 );
    return am;
};
const today = () => {
    const am = new Date();
    am.setHours( 0 );
    am.setMinutes( 0 );
    am.setSeconds( 15 );
    am.setMilliseconds( 0 );
    return am;
};
const toFileString = ( date ) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
};
exports.time = {
    tomorrow,
    today,
    toFileString,
};