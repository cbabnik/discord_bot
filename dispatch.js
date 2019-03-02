// dispatch.js
// Dispatcher takes text and asks scanner if it matches any commands.
// For each matching command the assigned callback is executed, using the regex groups as parameters of the callback.
// Dispatcher forwards the instruction results of each command to the actor.
// Dispatcher is a glorified map of commands basically.

const DispatcherGenerator = ( Scanner ) => ( actor ) => {

    const dict = {};
    const scanner = Scanner();

    let next_id = 0;

    // groups in the regex are treated as parameters to the callback
    const registerCommand = (regex, callback) => {
        dict[next_id] = {regex, callback};
        scanner.addCommand(regex, next_id);
        next_id += 1;
    };

    const registerComponent = (component) => {
        const clist = component.getAllCommands();
        clist.forEach(c => {
            registerCommand(c.regex, c.cb);
        });
    };

    const message = async (msg) => {
        const commands = scanner.scan(msg.content);
        commands.forEach(c => {
            console.log(msg);
            const metaInfo = { author: msg.author.username };
            dispatch( msg.content, dict[c].regex, dict[c].callback, metaInfo )
        });
    };

    const dispatch = async (text, regex, callback, metaInfo) => {
        const params = text.match(regex).slice(1);
        const instructions = await callback(...params, metaInfo);
        actor.handle(instructions);
    };

    return {
        registerComponent,
        message
    };
};

module.exports = { DispatcherGenerator };