const { Component } = require( '../component' );
const { CONFIG_DEFAULTS, PERMISSION_LEVELS } = require( '../constants' );
const { bank } = require( './bank' );

const ID = 'admin';

class Admin extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^#say (.*)$/, this.betaSay );
        this.addCommand( /^#give (\d+) (-?\d+)$/, this.adminGive );
        this.addCommand( /^#shutdown$/, this.shutdown );
    }

    betaSay( msg ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        this.setAction( 'channelId', CONFIG_DEFAULTS.MAIN_CHANNEL );
        this.setAction( 'message', msg );
    }

    adminGive( id, val, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        this.setAction( 'channelId', CONFIG_DEFAULTS.MAIN_CHANNEL );
        this.setAction( 'message', `**user#${id}** has been granted ${val} credits!` );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            bank.addAmount( id, val );
        }
    }

    shutdown(metaInfo) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            process.exit(0);
        }
    }
}

module.exports = { admin: new Admin() };
