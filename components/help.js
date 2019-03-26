const { Component } = require('../component');
const fs = require('fs');
const _ = require('lodash');

const ID = 'help';

class Help extends Component {
    constructor() {
        super(ID);
        this.addCommand(/^-help$/, this.help);
        this.addCommand(/^\?help$/, this.help);
        this.addCommand(/^\?roll/, this.rollHelp);
        this.addCommand(/^\?random/, this.randomHelp);
        this.addCommand(/^\?math/, this.mathHelp);
        this.addCommand(/^\?coinflip/, this.coinflipHelp);
        this.addCommand(/^\?burger/, this.burgerHelp);
        this.addCommand(/^\?add[bB]urger/, this.addBurgerHelp);
        this.addCommand(/^\?slots/, this.slotsHelp);
        this.addCommand(/^\?(.*)/, this.helpInfo);
        this.addCommand(/^\?!/, this.playHelp);
        this.addCommand(/^\?play/, this.playHelp);
        this.addCommand(/^\?(.+)/, this.helpInfo);
    }

    help() {
        this.setAction('message',
            `commands:
\`-roll\` - Rolls a number in a given range.
\`-random\` - Returns a random element of a given list.
\`-math\` - Evaluates an expression.
\`-coinflip\` - Returns heads or tails.
\`-burger\` - Unleashes a sweet picture.
\`-slots\` - Have some fun.
\`-play\` - Guys, there's no limit or permissions attached to this yet.`
        );
    }

    helpInfo(val) {
        this.setAction('message', `There is no help file for ${val}. try just \`-help\` to see most commands.`);
    }

    rollHelp() {
        this.setAction('message',
            `-roll
Rolls a number in a given range.
valid uses:
    \`-roll <max>\` - Rolls between 1 and max.
    \`-roll <min> <max>\` - Rolls between min and max.`
        );
    }

    randomHelp() {
        this.setAction('message',
            `-random
Returns a random element of a given list.
valid use: \`-random <list>\` - Returns a random member of list.
List must contain at least two elements and can be space or comma delimited. Spaces take priority.`
        );
    }

    mathHelp() {
        this.setAction('message',
            `-math
valid use: \`-math <expression>\` - Evaluates expression.
Accepted Operators are \`+\`, \`-\`, \`*\`, \`/\`, \`**\`, \`()\`.`
        );
    }

    coinflipHelp() {
        this.setAction('message',
            `-coinflip
valid uses:
\`-coinflip\` - Returns heads or tails.
\`-coinflip <heads> <tails>\` - Returns heads or tails, with an assigned message to each.`
        );
    }

    burgerHelp() {
        this.setAction('message',
            `\`-burger\`
Unleashes a sweet picture.`
        );
    }

    slotsHelp() {
        this.setAction('message',
            `\`-slots\`
valid uses:
\`-slots coin\`
\`-slots grid\`
\`-slots maze\``
        );
    }

    addBurgerHelp() {
        this.setAction('message',
            `\`-addburger\`
valid use: \`-addburger <link url>\` - Add another burger!`
        );
    }

    playHelp() {
        const files = fs.readdirSync('./audio').map(f => f.padEnd(25));
        this.setAction('message', 'Play a sound!\n' +
            _.chunk(files, 4).map(chunk => `\`${chunk.join('')}\``).join('\n')
        );
    }
}

module.exports = { help: new Help() };
