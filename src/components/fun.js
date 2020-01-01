const { Component } = require( '../component' );
const _ = require( 'lodash' );
const { getId }  = require( '../util' );
const { PERMISSION_LEVELS, CONFIG_DEFAULTS } = require( '../constants' );
const { bank } = require( './bank' );

const ID = 'fun';

class Fun extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-brag$/, this.brag );
        this.addCommand( /^-wewon (.*)$/, this.wewon );
    }

    brag ( metaInfo ) {
        if ( this.json.brags ) {
            this.setAction( 'message', _.replace( _.sample( this.json.brags ), /USER/, `**${metaInfo.author}**` ) );
        } else {
            this.setAction( 'message', 'No brags found' );
        }
    }

    wewon ( names, metaInfo ) {
        const id = metaInfo.authorId;
        const channelId = metaInfo.channelId;

        if ( channelId !== CONFIG_DEFAULTS.MAIN_CHANNEL ) {
            this.setAction( 'message', 'Do this in a public channel' );
            return;
        }

        if ( !PERMISSION_LEVELS.SUPERUSER.includes( id ) ) {
            this.setAction( 'message', 'You don\'t have the permissions to do this' );
            return;
        }

        const ids = names.split( ' ' ).map( getId );
        ids.push( id );
        if ( ids.length !== 5 ) {
            this.setAction( 'message', '5 man games only.' );
            return;
        }
        if ( ids.includes( undefined ) ) {
            this.setAction( 'message', 'One of those users did not match an id' );
            return;
        }
        if ( _.uniq( ids ).length !== 5 ) {
            this.setAction( 'message', 'Nuh uh. Try again.' );
            return;
        }

        const lastTime = _.get( this.json, 'wewon', 0 );
        const currentTime = new Date().getTime();
        _.set( this.json, 'wewon', currentTime );

        if ( currentTime < lastTime ) {
            this.setAction( 'message', 'Uh uh. This feature is gone.' );
            _.set( this.json, 'wewon', currentTime + 24*60*60*1000*1000 );
            return;
        }
        if ( currentTime - lastTime < 1000*60*20 ) {
            this.setAction( 'message', 'Do you really not want to have buck bot privledges anymore?' );
            _.set( this.json, 'wewon', currentTime + 24*60*60*1000*1000 );
            return;
        }

        ids.forEach( ( id ) => {
            bank.addAmount( id, 1 );
            this.setAction( 'message', 'The game winners each get 1 credit!' );
        } );
    }
}

module.exports = { fun: new Fun() };
