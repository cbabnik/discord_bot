const { Component } = require( '../component' );
const { BETA, PERMISSION_LEVELS } = require( '../constants' );
const { bank } = require( './bank' );

const ID = 'admin';

class Admin extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^#say (.*)$/, this.betaSay );
        this.addCommand( /^#give (\d+) (-?\d+)$/, this.adminGive );
    }

    betaSay( msg ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        this.setAction( 'channel', BETA.MAIN_CHANNEL );
        this.setAction( 'message', msg );
    }

    adminGive( id, val ) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        this.setAction( 'channel', BETA.MAIN_CHANNEL );
        this.setAction( 'message', `**user#${id}** has been granted ${val} credits!` );
        bank.addAmount( id, val );
    }
}

module.exports = { admin: new Admin() };
