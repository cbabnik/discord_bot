const { BUCKS, ALIASES, CONFIG_DEFAULTS } = require( './constants' );
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

exports.getId = ( username ) => {
    const upperUser = username.toUpperCase();
    if ( Object.keys( BUCKS ).includes( upperUser ) ) {
        return BUCKS[upperUser];
    }
    if ( Object.keys( ALIASES ).includes( upperUser ) ) {
        return ALIASES[upperUser];
    }
    let user = client.users.find( u => u.username.toUpperCase() === upperUser );
    if (user) {
        return user.id;
    }
    user = client.users.find( u => u.nickname?u.nickname.toUpperCase() === upperUser:false );
    if (!user) {
        return undefined
    }
    return user.id;
};

exports.getUser = ( id ) => {
    const user = client.users.find( u => u.id === id );
    if ( user ) {
        if (user.nickname)
            return user.nickname;
        return user.username;
    }
    return `user#${id}`
};

exports.getVoiceChannel = ( id ) => {
    if ( !guildMembers ) {
        guildMembers = client.guilds.get( CONFIG_DEFAULTS.GUILD ).members;
    }
    const member = guildMembers.find( m => m.user.id === id );
    if ( member ) {
        return member.voiceChannelID;
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
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const dateStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const fileName = `backups/backup_${dateStr}.zip`;

    const output = fs.createWriteStream( fileName );
    const archive = archiver( 'zip' );

    archive.directory( 'storage/' ).pipe( output );
    archive.finalize();
    debug( 'Data Backed up!' );
};
exports.backup = backup;
