// filter.js
// originally part of dispatcher, handles input gathering, filtering, and preprocessing

const debug = require( 'debug' )( 'dispatcher' );
const { BUCKS, CONFIG_DEFAULTS, ALPHA, BETA } = require( './constants' );
const { Storage } = require( './pdata' );
const STORAGE_ID = 'alias';
const data = new Storage( STORAGE_ID );

const Filter = ( client, dispatcher ) => {

    const filterChannel = ( msg ) => {
        if ( BUCKS.BUCKBOT === msg.author.id ) {
            return false;
        }
        if ( CONFIG_DEFAULTS.VERSION === ALPHA.VERSION ) {
            if ( msg.channel.id !== ALPHA.MAIN_CHANNEL ) {
                return false;
            }
        } else if ( CONFIG_DEFAULTS.VERSION !== BETA.VERSION ){
            return false;
        } else if ( msg.channel.id === ALPHA.MAIN_CHANNEL ) {
            return false;
        }
        return true;
    };

    const applyAliases = ( userId, content ) => {
        const aliases = data.get( `${userId}` );

        if ( aliases[content] ) {
            return aliases[content].text;
        }

        Object.keys( aliases ).forEach( ( from ) => {
            const a = aliases[from];
            if ( a.inline ) {
                content = content.replace( RegExp( from ), a.text );
            }
        } );

        return content;
    };

    const filterContent = ( msg ) => {
        let content = msg.content;
        content = applyAliases(msg.author.id, content)
        return content;
    }

    client.on( 'message', async ( msg ) => {
        if ( ! filterChannel( msg ) ) {
            return;
        }
        dispatcher.process( filterContent(msg), msg )
    } );

    // eslint-disable-next-line no-unused-vars
    client.on( 'messageDelete', async ( msg ) => {
        // stub
    } );

    // eslint-disable-next-line no-unused-vars
    client.on( 'messageUpdate', async ( oldMsg, newMsg ) => {
        // stub
    } );

    // eslint-disable-next-line no-unused-vars
    client.on( 'messageReactionAdd', async ( reaction ) => {
        // stub
    } );

};

module.exports = { Filter };