// dispatch.js
// Dispatcher takes text and asks scanner if it matches any commands.
// For each matching command the assigned callback is executed, using the regex groups as parameters of the callback.
// Dispatcher forwards the instruction results of each command to the actor.
// Dispatcher is a glorified map of commands basically.

const debug = require( 'debug' )( 'dispatcher' );
const { BUCKS, CONFIG_DEFAULTS, ALPHA, BETA } = require( './constants' );

const { Storage } = require( './pdata' );
const STORAGE_ID = 'alias';
const data = new Storage( STORAGE_ID );

const DispatcherGenerator = ( Scanner ) => ( client, actor ) => {

    const commandLinkDict = {};
    const scanner = Scanner();

    let next_id = 0;

    // groups in the regex are treated as parameters to the callback
    const registerCommand = ( regex, component, cb ) => {
        commandLinkDict[next_id] = {regex, component, cb};
        scanner.addRegex( regex, next_id );
        next_id += 1;
    };

    const registerComponent = ( component ) => {
        const clist = component.getAllCommands();
        clist.forEach( c => {
            registerCommand( c.regex, component, c.cb );
        } );
        component.setActor( actor ); // indiscriminately give components access to actor
    };

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

        if ( edit ) {
            if ( msg.editable ) {
                msg.edit( contentEdit );
            }
        }

        return content;
    };

    client.on( 'message', async ( msg ) => {
        if ( ! filter( msg ) ) {
            return;
        }
        const content = filterContent( msg );
        const commandId = scanner.scan( content );
        if ( commandId ) {
            dispatch( content, commandLinkDict[commandId], msg );
        }
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

    const dispatch = async ( text, commandLink, msg ) => {
        const metaInfo = {
            author: msg.author.username,
            authorId: msg.author.id,
            tts: msg.tts,
            time: msg.createdAt,
            channel: msg.channel.name,
            channelId: msg.channel.id,
            channelType: msg.channel.type,
        };
        const {regex, component, cb} = commandLink;
        const params = text.match( regex ).slice( 1 );
        debug( '%s [%s.%s(%s)]', text, component.id, cb.name, params );
        await cb.call( component, ...params, metaInfo );
        const instructions = component.commitAction();
        actor.handle( instructions, msg );
    };

    return {
        registerComponent
    };
};

module.exports = { DispatcherGenerator };
