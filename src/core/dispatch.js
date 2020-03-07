// dispatch.js
// Dispatcher takes text and asks scanner if it matches any commands.
// For each matching command the assigned callback is executed, using the regex groups as parameters of the callback.
// Dispatcher forwards the instruction results of each command to the actor.
// Dispatcher is a glorified map of commands basically.

const debug = require( 'debug' )( 'dispatcher' );
const { switchboard } = require( '../components/switchboard' );

const DispatcherGenerator = ( Scanner ) => ( actor ) => {

    const commandLinkDict = {};
    const scanner = Scanner();

    let next_id = 0;

    // groups in the regex are treated as parameters to the callback
    const registerCommand = ( regex, component, cb, groupName ) => {
        commandLinkDict[next_id] = {regex, component, cb, groupName};
        scanner.addRegex( regex, next_id );
        next_id += 1;
    };

    const registerComponent = ( component ) => {
        const clist = component.getAllCommands();
        clist.forEach( c => {
            registerCommand( c.regex, component, c.cb, c.groupName );
        } );
        component.setActor( actor ); // indiscriminately give components access to actor
    };

    const process = async ( content, msg ) => {
        const commandId = scanner.scan( content );
        if ( commandId ) {
            const cmd = commandLinkDict[commandId];
            if (switchboard.isEnabled(cmd.groupName)) {
                dispatch( content, cmd, msg );
            }
        }
    };

    const rawPost = async ( content, msg ) => {
        actor.handle( { message: content }, msg );
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
            message: msg,
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
        process,
        rawPost,
    };
};

module.exports = { DispatcherGenerator };