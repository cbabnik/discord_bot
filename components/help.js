const { Component } = require( '../component' );
const fs = require( 'fs' );
const _ = require( 'lodash' );

const ID = 'help';

class Help extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-help/, this.help );
        this.addCommand( /^\?help/, this.help );
        this.addCommand( /^-list/, this.playListHelp );
        this.addCommand( /^!list/, this.playListHelp );
        this.addCommand( /^\?roll/, this.rollHelp );
        this.addCommand( /^\?random/, this.randomHelp );
        this.addCommand( /^\?math/, this.mathHelp );
        this.addCommand( /^-math$/, this.mathHelp );
        this.addCommand( /^\?coinflip/, this.coinflipHelp );
        this.addCommand( /^\?burger/, this.burgerHelp );
        this.addCommand( /^\?add[bB]urger/, this.addBurgerHelp );
        this.addCommand( /^\?slotstats/, this.slotStatsHelp );
        this.addCommand( /^\?slotstatistics/, this.slotStatisticsHelp );
        this.addCommand( /^\?slots/, this.slotsHelp );
        this.addCommand( /^-slots$/, this.slotsHelp );
        this.addCommand( /^\?!/, this.playHelp );
        this.addCommand( /^\?play/, this.playHelp );
        this.addCommand( /^-play$/, this.playHelp );
        this.addCommand( /^\?endAudio/, this.endAudioHelp );
        this.addCommand( /^\?secrets/, this.secretsHelp );
        this.addCommand( /^\?allowance/, this.allowanceHelp );
        this.addCommand( /^\?balance/, this.balanceHelp );
        this.addCommand( /^\?give/, this.giveHelp );
        this.addCommand( /^-request$/, this.requestHelp );
        this.addCommand( /^\?request/, this.requestHelp );
        this.addCommand( /^\?requests/, this.requestHelp );
        this.addCommand( /^\?calendar/, this.calendarHelp );
        this.addCommand( /^\?(?:next)[hH]oliday/, this.eventsHelp );
        this.addCommand( /^\?(?:all)[hH]olidays/, this.eventsHelp );
        this.addCommand( /^\?(?:next)[bB]irthdays/, this.eventsHelp );
        this.addCommand( /^\?(?:all)[bB]irthdays/, this.eventsHelp );
        this.addCommand( /^\?queue[iI]t[uU]p/, this.queueItUpHelp );
        this.addCommand( /^-patchnotes/, this.patchnotes );
        this.addCommand( /^\?patchnotes/, this.patchnotes );
        this.addCommand( /^\?live/, this.liveHelp );
        this.addCommand( /^\?new ?[qQ]uote/, this.quoteHelp );
        this.addCommand( /^\?quote/, this.quoteHelp );
        this.addCommand( /^-new ?[qQ]uote$/, this.quoteHelp );
        this.addCommand( /^-loan$/, this.loanHelp );
        this.addCommand( /^\?loan$/, this.loanHelp );
        this.addCommand( /^\?(.+)/, this.helpInfo );
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

    patchnotes() {
        this.setAction( 'message', `Recent Changes:
Version... 0.0.2 lets say
        
Slots are fun now!
Coin Slots now uses a weighted coin.
New Commands: \`-calendar -allBirthdays -nextBirthday -nextHoliday -allHolidays -queueItUp -bankruptcy -patchnotes -live -quote -newquote -brag\`
New Audio: \`prooh readygo\`

Sound effects now only happen if the user is in a voice channel, and it happens in the same voice channel they are in.
Live music can be played with \`-live url\`
` );
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

    loanHelp() {
        this.setAction( 'message',
            `valid uses:
    \`-loans\` - check available loans
    \`-loan debts\` - check loans you are involved with
    \`-loan offer <args>\` - offer a new loan
    \`-loan adjust <args>\` - change your loan offerring
    \`-loan relinquish\` - destroy your offering, turning all debt to IOU
    \`-loan takeout <amount> <player>\` - take out a loan
\`<args>\` can include \`max=<amount>, type=compound, interest=<percent per day>, rate=<charge per day> flat=<charge to take out a loan>\``
        );
    }
}

module.exports = { help: new Help() };
