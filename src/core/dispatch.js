// dispatch.js
// Dispatcher takes text and asks scanner if it matches any commands.
// For each matching command the assigned callback is executed, using the regex groups as parameters of the callback.
// Dispatcher forwards the instruction results of each command to the actor.
// Dispatcher is a glorified map of commands basically.

const debug = require( 'debug' )( 'dispatcher' );
const { switchboard } = require( '../components/switchboard' );
const { statistics } = require( '../components/statistics' );

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
        component.setActor( actor ); // indiscriminately give components access to 
        component.subscribeReaction = subscribeReaction(component);
    };

    const process = async ( content, msg ) => {
        const commandId = scanner.scan( content );
        if ( commandId ) {
            const cmd = commandLinkDict[commandId];
            if (switchboard.isEnabled(cmd.groupName)) {
                if (cmd.groupName) {
                    statistics.add(`feature_used.${msg.author.id}.${cmd.groupName}`)
                }
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

    reaction_mapping = {}
    const processReaction = async ( reaction ) => {
        let obj, cb, args, component
        if (reaction_mapping[reaction.message.id + reaction._emoji.name]) {
            obj = reaction_mapping[reaction.message.id + reaction._emoji.name]
        } else if (reaction_mapping[reaction.message.id]) {
            obj = reaction_mapping[reaction.message.id]
        } else {
            return;
        }
        cb = obj.cb
        args = obj.args
        component = obj.component

        if (obj.remove){
            // can't implement yet
        }

        const msg_reacted_to = reaction.message;
        const emoji = reaction._emoji.name;
        await cb.call( component, msg_reacted_to, emoji, args );
        const instructions = component.commitAction();
        actor.handle( instructions, msg_reacted_to );
    }
    const subscribeReaction = (comp) => async ( msg_id, cb, additional_args={}, emoji=undefined, remove=false) => {
        if (emoji) {
            reaction_mapping[msg_id + emoji] = {cb, args: additional_args, component: comp, remove}
        } else {
            reaction_mapping[msg_id] = {cb, args: additional_args, component: comp, remove}
        }
    }

    return {
        registerComponent,
        processReaction,
        process,
        rawPost,
    };
};

module.exports = { DispatcherGenerator };
