// filter.js
// originally part of dispatcher, handles input gathering, filtering, and preprocessing

const debug = require( 'debug' )( 'dispatcher' );
const { BUCKS, CONFIG, ALPHA, BETA } = require( './constants' );
const Storage = require( './pdata' );
const STORAGE_ID = 'alias';
let data = undefined;
(async () => {data = await Storage( STORAGE_ID )})();

const Filter = ( client, dispatcher ) => {

    const filterChannel = ( msg ) => {
        if ( BUCKS.BUCKBOT === msg.author.id ) {
            return false;
        }
        if ( CONFIG.VERSION === ALPHA.VERSION ) {
            if ( msg.channel.id !== ALPHA.MAIN_CHANNEL ) {
                return false;
            }
        } else if ( CONFIG.VERSION !== BETA.VERSION ){
            return false;
        } else if ( msg.channel.id === ALPHA.MAIN_CHANNEL ) {
            return false;
        }
        return true;
    };

    const applyAliases = async ( userId, content ) => {
        const aliases = await data.get( `${userId}` );

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

    const applyTransformation = async ( content ) => {
        content = content.replace( RegExp( "“" ), "\"")
        return content;
    }

    const filterContent = async ( msg ) => {
        let content = msg.content;
        content = await applyAliases(msg.author.id, content)
        content = await applyTransformation(content)
        return content;
    }

    client.on( 'message', async ( msg ) => {
        if ( ! filterChannel( msg ) ) {
            return;
        }
        dispatcher.process( await filterContent(msg), msg )
    } );

    // eslint-disable-next-line no-unused-vars
    client.on( 'messageDelete', async ( msg ) => {
        if ( ! filterChannel( msg ) ) {
            return;
        }
        dispatcher.rawPost( ":eye:", msg )
    } );

    // eslint-disable-next-line no-unused-vars
    client.on( 'messageUpdate', async ( oldMsg, newMsg ) => {
        // stub
    } );

    // eslint-disable-next-line no-unused-vars
    client.on( 'messageReactionAdd', async ( reaction ) => {
        if (reaction.me) {
            return
        }
        dispatcher.processReaction( reaction )
    } );

    // eslint-disable-next-line no-unused-vars
    client.on( 'messageReactionRemove', async ( reaction ) => {
        if (reaction.me) {
            return
        }
        dispatcher.processReaction( reaction )
    } );

};

module.exports = { Filter };