// dispatch.js
// Dispatcher takes text and asks scanner if it matches any commands.
// For each matching command the assigned callback is executed, using the regex groups as parameters of the callback.
// Dispatcher forwards the instruction results of each command to the actor.
// Dispatcher is a glorified map of commands basically.

const DispatcherGenerator = ( Scanner ) => ( actor ) => {

    const commandLinkDict = {};
    const scanner = Scanner();

    let next_id = 0;

    // groups in the regex are treated as parameters to the callback
    const registerCommand = (regex, component, cb) => {
        commandLinkDict[next_id] = {regex, component, cb};
        scanner.addCommand(regex, next_id);
        next_id += 1;
    };

    const registerComponent = (component) => {
        const clist = component.getAllCommands();
        clist.forEach(c => {
            registerCommand(c.regex, component, c.cb);
        });
    };

    const message = async (msg) => {
        const commands = scanner.scan(msg.content);
        commands.forEach(c => {
            const metaInfo = {
                author: msg.author.username,
                tts: msg.tts,
                time: msg.createdAt,
                channel: msg.channel.name
            };
            dispatch( msg.content, commandLinkDict[c], metaInfo )
        });
    };

    const dispatch = async (text, commandLink, metaInfo) => {
        const {regex, component, cb} = commandLink;
        const params = text.match(regex).slice(1);
        await cb.call(component, ...params, metaInfo);
        const instructions = component.commitAction();
        actor.handle(instructions);
    };

    return {
        registerComponent,
        message
    };
};

module.exports = { DispatcherGenerator };