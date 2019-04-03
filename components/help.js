const { Component } = require( '../component' );
const fs = require( 'fs' );
const _ = require( 'lodash' );

const ID = 'help';

class Help extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-help/, this.help );
        this.addCommand( /^\?help/, this.help );
        this.addCommand( /^\?roll/, this.rollHelp );
        this.addCommand( /^\?random/, this.randomHelp );
        this.addCommand( /^\?math/, this.mathHelp );
        this.addCommand( /^-math$/, this.mathHelp );
        this.addCommand( /^\?coinflip/, this.coinflipHelp );
        this.addCommand( /^\?burger/, this.burgerHelp );
        this.addCommand( /^\?add[bB]urger/, this.addBurgerHelp );
        this.addCommand( /^\?slots/, this.slotsHelp );
        this.addCommand( /^-slots$/, this.slotsHelp );
        this.addCommand( /^\?!/, this.playHelp );
        this.addCommand( /^\?play/, this.playHelp );
        this.addCommand( /^-play$/, this.playHelp );
        this.addCommand( /^\?endAudio/, this.endAudioHelp );
        this.addCommand( /^\?secrets/, this.secretsHelp );
        this.addCommand( /^\?allowance/, this.allowanceHelp );
        this.addCommand( /^\?balance/, this.balanceHelp );
        this.addCommand( /^\?slotstats/, this.slotStatsHelp );
        this.addCommand( /^\?(.+)/, this.helpInfo );
    }

    help() {
        const COMMANDS = [
            'roll', 'random', 'math', 'coinflip', 'burger', 'slots', 'play', 'endAudio', 'secrets', 'balance',
            'allowance', 'slotstats'
        ].map( c => `-${c}`.padEnd( 25 ) );
        this.setAction( 'message', 'Here is a list of commands!\n' +
            'To learn more about any of them, try them with a ? upfront. example: `?roll`.\n' +
            _.chunk( COMMANDS, 3 ).map( chunk => `\`${chunk.join( '' )}\`` ).join( '\n' )
        );
    }

    helpInfo( val ) {
        this.setAction( 'message', `There is no help file for \`${val}\`. Try \`-help\` to see most commands.` );
    }

    rollHelp() {
        this.setAction( 'message',
            `-roll
Rolls a number in a given range.
valid uses:
    \`-roll [max]\` - Rolls between 1 and \`max\`.
    \`-roll [min] [max]\` - Rolls between \`min\` and \`max\`.`
        );
    }

    randomHelp() {
        this.setAction( 'message',
            `-random
Returns a random element of a given list.
valid uses:
    \`-random [list]\` - Returns a random element of \`list\`.
    \`-random pick[number] [list]\` - Returns \`number\` many random elements of \`list\`.
\`list\` must contain at least two elements and can be space or comma delimited. Spaces take priority.`
        );
    }

    mathHelp() {
        this.setAction( 'message',
            `-math
Your easy access calculator!
valid use: \`-math [expression]\` - Evaluates expression.
Accepted Operators are \`+\`, \`-\`, \`*\`, \`/\`, \`**\`, \`()\`.`
        );
    }

    coinflipHelp() {
        this.setAction( 'message',
            `-coinflip
valid uses:
    \`-coinflip\` - Returns heads or tails.
    \`-coinflip [heads] [tails]\` - Returns heads or tails, with an assigned message to each.`
        );
    }

    burgerHelp() {
        this.setAction( 'message',
            `\`-burger\`
Unleashes a sweet picture.`
        );
    }

    slotsHelp() {
        this.setAction( 'message',
            `\`-slots\`
Try your luck at the slots!
    \`-slots coin\` - ($1) For the slow rollers
    \`-slots grid\` - ($5) For the high rollers
    \`-slots maze\` - ($20) For the foolish who want to win it all`
        );
    }

    addBurgerHelp() {
        this.setAction( 'message',
            `\`-addburger\`
valid use: \`-addburger <link url>\` - Add another burger!`
        );
    }

    playHelp() {
        const files = fs.readdirSync( './audio' ).map( f => f.padEnd( 25 ) );
        this.setAction( 'message', 'Play a sound!\nEither `-play 20.mp3` or `!20` will work.\n' +
            _.chunk( files, 3 ).map( chunk => `\`${chunk.join( '' )}\`` ).join( '\n' )
        );
    }

    endAudioHelp() {
        this.setAction( 'message',
            `\`-endAudio\`
So that you can fight back against Kevin Slow Theme! This ejects buckbot from the audio channel.`
        );
    }

    secretsHelp() {
        this.setAction( 'message',
            `\`-secrets\`
This command is only sometimes enabled. It may give hints on any secrets.`
        );
    }

    balanceHelp() {
        this.setAction( 'message',
            `\`-balance\`
Check your bank balance! This will go up automatically with allowance, and you can spend it on stuff like gambling >:3`
        );
    }

    allowanceHelp() {
        this.setAction( 'message',
            `\`-allowance\`
Check how long until you get allowance next.`
        );
    }

    slotStatsHelp() {
        this.setAction( 'message',
            `\`-slotstats\`
Gives your various lottery statistics.`
        );
    }
}

module.exports = { help: new Help() };
