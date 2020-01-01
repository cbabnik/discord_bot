// filter.js
// originally part of dispatcher, handles input gathering, filtering, and preprocessing

const debug = require( 'debug' )( 'dispatcher' );
const { BUCKS, CONFIG_DEFAULTS, ALPHA, BETA } = require( './constants' );
const { Storage } = require( './pdata' );
const STORAGE_ID = 'alias';
const data = new Storage( STORAGE_ID );

const Filter = ( client, dispatcher ) => {

    const filter = ( msg ) => {
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
    const filterContent = ( msg ) => {
        let content = msg.content;
        const userId = msg.author.id;
        const aliases = data.get( `${userId}` );

        if ( aliases[content] ) {
            if ( aliases[content].edit ) {
                if ( msg.editable ) {
                    msg.edit( aliases[content].text );
                }
            }
            return aliases[content].text;
        }

        let contentEdit = ''+content;
        let edit = false;
        Object.keys( aliases ).forEach( ( from ) => {
            const a = aliases[from];
            if ( a.inline ) {
                content = content.replace( RegExp( from ), a.text );
                if ( a.edit ) {
                    edit = true;
                    contentEdit = a.text.replace( RegExp( from ), a.text );
                }
            }
        } );

        return content;
    };

    client.on( 'message', async ( msg ) => {
        if ( ! filter( msg ) ) {
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