// dispatch.js
// Dispatcher takes text and asks scanner if it matches any commands.
// For each matching command the assigned callback is executed, using the regex groups as parameters of the callback.
// Dispatcher forwards the instruction results of each command to the actor.
// Dispatcher is a glorified map of commands basically.

const debug = require( 'debug' )( 'dispatcher' );
const { BUCKS, CONFIG_DEFAULTS, ALPHA, BETA } = require( './constants' );

const DispatcherGenerator = ( Scanner ) => ( actor ) => {

    const commandLinkDict = {};
    const scanner = Scanner();

    let next_id = 0;

    // groups in the regex are treated as parameters to the callback
    const registerCommand = ( regex, component, cb ) => {
        commandLinkDict[next_id] = {regex, component, cb};
        scanner.addCommand( regex, next_id );
        next_id += 1;
    };

    const registerComponent = ( component ) => {
        const clist = component.getAllCommands();
        clist.forEach( c => {
            registerCommand( c.regex, component, c.cb );
        } );
    };

    const message = async ( msg ) => {
        if ( BUCKS.BUCKBOT === msg.author.id ) {
            return;
        };
        if (CONFIG_DEFAULTS.VERSION === ALPHA.VERSION ) {
            if (msg.channel.id !== ALPHA.MAIN_CHANNEL) {
                return;
            }
        } else if (CONFIG_DEFAULTS.VERSION !== BETA.VERSION ){
            return;
        } else if (msg.channel.id === ALPHA.MAIN_CHANNEL) {
            return;
        }
        const command = scanner.scan( msg.content );
        if ( command ) {
            dispatch( msg.content, commandLinkDict[command], msg );
        }
    };

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
        registerComponent,
        message
    };
};

module.exports = { DispatcherGenerator };
