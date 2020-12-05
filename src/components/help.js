const { Component } = require( './component' );
const fs = require( 'fs' );
const _ = require( 'lodash' );

const ID = 'help';

class Help extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-help/, this.help, 'help' );
        this.addCommand( /^\?help/, this.help, 'help' );
        this.addCommand( /^-list/, this.playListHelp, 'play' );
        this.addCommand( /^!list/, this.playListHelp, 'play' );
        this.addCommand( /^\?roll/, this.rollHelp, 'roll' );
        this.addCommand( /^\?random/, this.randomHelp, 'random' );
        this.addCommand( /^\?math/, this.mathHelp, 'math' );
        this.addCommand( /^-math$/, this.mathHelp, 'math' );
        this.addCommand( /^\?coinflip/, this.coinflipHelp, 'coinflip' );
        this.addCommand( /^\?burger/, this.burgerHelp, 'burger' );
        this.addCommand( /^\?add[bB]urger/, this.addBurgerHelp, 'burger' );
        this.addCommand( /^\?slotstats/, this.slotStatsHelp, 'slots' );
        this.addCommand( /^\?slotstatistics/, this.slotStatisticsHelp, 'slots' );
        this.addCommand( /^\?slots/, this.slotsHelp, 'slots' );
        this.addCommand( /^-slots$/, this.slotsHelp, 'slots' );
        this.addCommand( /^\?!/, this.playHelp, 'play' );
        this.addCommand( /^\?play/, this.playHelp, 'play' );
        this.addCommand( /^-play$/, this.playHelp, 'play' );
        this.addCommand( /^\?endAudio/, this.endAudioHelp, 'play' );
        this.addCommand( /^\?secrets/, this.secretsHelp, 'secrets' );
        this.addCommand( /^\?allowance/, this.allowanceHelp, 'allowance' );
        this.addCommand( /^\?balance/, this.balanceHelp, 'bank' );
        this.addCommand( /^\?give/, this.giveHelp, 'bank' );
        this.addCommand( /^-request$/, this.requestHelp, 'requests' );
        this.addCommand( /^\?request/, this.requestHelp, 'requests' );
        this.addCommand( /^\?requests/, this.requestHelp, 'requests' );
        this.addCommand( /^\?calendar/, this.calendarHelp, 'calendar' );
        this.addCommand( /^\?(?:next) ?[hH]oliday/, this.eventsHelp, 'next holiday' );
        this.addCommand( /^\?(?:all) ?[hH]olidays/, this.eventsHelp, 'holiday' );
        this.addCommand( /^\?(?:next) ?[bB]irthday/, this.eventsHelp, 'next birthday' );
        this.addCommand( /^\?(?:all) ?[bB]irthdays/, this.eventsHelp, 'birthdays');
        this.addCommand( /^\?live/, this.liveHelp, 'live' );
        this.addCommand( /^\?new ?[qQ]uote/, this.quoteHelp, 'quote' );
        this.addCommand( /^\?quote/, this.quoteHelp, 'quote' );
        this.addCommand( /^-new ?[qQ]uote$/, this.quoteHelp, 'new quote' );
        this.addCommand( /^\?(.+)/, this.helpInfo, 'help' );
    }

    help() {
        const COMMANDS = [
            'roll', 'random', 'math', 'coinflip', 'burger', 'slots', 'play', 'endAudio', 'secrets', 'balance',
            'allowance', 'slotstats', 'give', 'request', 'slotstatistics', 'allBirthdays', 'nextBirthday',
            'nextHoliday', 'allHolidays', 'calendar', 'queueItUp', 'bankruptcy', 'patchnotes', 'live', 'brag',
            'quote', 'newquote', 'iou', 'loan'
        ].map( c => `-${c}`.padEnd( 25 ) );
        this.setAction( 'message', 'Here is a list of commands!\n' +
            'To learn more about any of them, try them with a ? upfront. example: `?roll`.\n' +
            _.chunk( COMMANDS, 3 ).map( chunk => `\`${chunk.join( '' )}\`` ).join( '\n' )
        );
    }

    quoteHelp() {
        this.setAction( 'message',
            `Quotes:
    \`-newquote [username] [quote]\` - Writes a new quote for a specific user, dated now
    \`-newquote [username] [Date] "[quote]"\` - Writes a new quote for a specific user, with a given date (note the quotation marks)
    \`-quote [username]\` - Get a random quote
    \`-quote [username]\` - Get a random quote belonging to a specific person
    \`-quote [username] [index]\` - Get a specific quote for a person
Be warned. If you misquote someone your permissions to add quotes will be revoked.`
        );
    }

    liveHelp() {
        this.setAction( 'message',
            '`-live [url]` This is like -play but it works with live youtube videos. Please only use it for live videos.'
        );
    }

    helpInfo( val ) {
        this.setAction( 'message', `There is no help file for \`${val}\`. Try \`-help\` to see most commands.` );
    }

    eventsHelp() {
        this.setAction( 'message', `event commands:
\`-nextBirthday\` - See whos birthday is coming up
\`-allBirthdays\` - See everyone's birthdays
\`-birthday [user]\` - See user's birthday
\`-nextHoliday\` - See which specific buck holiday is coming up
\`-allHolidays\` - See all holidays` );
    }

    queueItUpHelp() {
        this.setAction( 'message',
            '`-queueItUp [url]` countsdown a video and plays the audio in voice channel'
        );
    }

    calendarHelp() {
        this.setAction( 'message',
            `-calendar
See a visual of the events planned for the month.
valid uses:
    \`-calendar\` - See current month
    \`-calendar [month]\` - See a specific month.`
        );
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
    \`-slots pig\` - ($10) For the push coin addicts
    \`-slots maze\` - ($20) For the foolish who want to win it all
    \`-slots big grid\` - ($1000) For those with just too much money
Put \` odds\` at the end of a command to see the odds! Ex. \`-slots coin odds\`
Use \`-freeRolls\` to see if you have any free rolls saved up`
        );
    }

    addBurgerHelp() {
        this.setAction( 'message',
            `\`-addburger\`
valid use: \`-addburger <link url>\` - Add another burger!`
        );
    }

    playListHelp() {
        this.setAction( 'audioFile', 'list' );
        this.playHelp();
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
            `\`-slotstats {user}\`
Gives your or someone else's various lottery statistics.`
        );
    }

    giveHelp() {
        this.setAction( 'message',
            `\`-give [user] [amount]\`
Give away your cash, you won't.`
        );
    }

    requestHelp() {
        this.setAction( 'message',
            `valid uses:
    \`-new request [describe feature]\` - make a new request
    \`-requests\` - check your requests
    \`-requests all\` - read all your requests
    \`-requests new\` - read your new requests
    \`-requests N\` - read request number N
    \`-requests delete N\` - delete request number N`
        );
    }

    slotStatisticsHelp() {
        this.setAction( 'message',
            `\`-slotstatistics\`
Gives some brief overall statistics.`
        );
    }
}

module.exports = { help: new Help() };
