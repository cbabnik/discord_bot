const { Component } = require( './component' );
const { switchboard } = require( './switchboard' );
const fs = require( 'fs' );
const _ = require( 'lodash' );

const ID = 'help';

const helps = {
    "switchboard": {
        regex: /^\?switch.*$|\?features*$/,
        module: "switchboard",
        info: `Because switchboard is for admins, # must be prepended instead of -
Access is limited to admins (Lunes/Kenricasueberry) and super users (Coltsu/Bugslinger)
\`#switch on <x>\` to switch a feature on.
\`#switch off <x>\` to switch a feature off.
\`#switchboard\` to see the current switchboard state`,
    },
    "patchnotes": {
        regex: /^\?patch.*$/,
        module: "patchnotes",
        info: `patch notes module:
\`-patchnotes\` - display the latest patch notes
\`-patchnotes major\` - display the latest major patch notes
\`-patchnotes history\` - display the latest major patch notes
\`-patchnotes <version>\` - see specific patchnotes`,
    },
    "fun": {
        regex: /^\?fun/,
        module: "fun",
        info: `These are just for fun items, try them out. \`win\` and \`brag\``,
    },
    "win": {
        regex: /^\?win/,
        module: "win",
        info: `\`\-win\` for when you just need a win`,
    },
    "brag": {
        regex: /^\?brag/,
        module: "brag",
        info: `\`\-brag\` so everyone can know you're the shit.
\`-humblebrag\` if you don't mean to brag.`,
    },
    "pictures": {
        regex: /^\?(:?pictures|burger|rem|waifu|pic|addpic)/,
        module: "pictures",
        info: `Cute pics
\`-burger\` for a raging burger picture
\`-rem\` for a luxury rem pic
\`-waifu\` for a cute lil gif
\`-pic\` for whatever cancer people add
\`-addpic\` to see where to add pics for \`-pic\`.

Add a number to get a specific picture. Example: \`-burger 69\`

If you want to moderate one of these categories, let Curtis know.`,
    },
    "lottery": {
        regex: /^[\?-](:?lottery|slots).*$/,
        module: "slots",
        info: `\`-slots\`
Try your luck at the slots!
    \`-slots coin\` - ($1) For the slow rollers
    \`-slots grid\` - ($5) For the high rollers
    \`-slots pig\` - ($10) UNDER MODIFICATION
    \`-slots maze\` - ($20) For the foolish who want to win it all
    \`-slots big grid\` - ($1000) For those with just too much money

There is also \`+slots\` if you're a diehard kawaiibot fan.`
    },
    "vote": {
        regex: /^\?vote.*$/,
        module: "vote",
        info: `\`-vote\` is a simple command that just reacts Y and N to make things easier.
Try \`-strawpoll\` for something more involved.`
    },
    "strawpoll": {
        regex: /^\?strawpoll.*$/,
        module: "vote",
        info: `\`-strawpoll\`
Examples of use:
\`-strawpoll "is chat cute"\` for a simple yes no vote
\`-strawpoll "is chat cute" "yes,definitely,omega cute"\` to specify options
\`-strawpoll "is chat cute" "yes,definitely,omega cute" [multi]\` to allow multi voting

Use \`-pastpolls\` to see polls made in the past`
    },
    "iou": {
        regex: /^\?iou.*$/,
        module: "bank",
        info: `\`-iou <user> <amount>\`
Marks that you owe user an amount. iou reduced by using the \`-give\` command.`
    },
    "iou": {
        regex: /^\?iou.*$/,
        module: "bank",
        info: `\`-iou <user> <amount>\`
Marks that you owe user an amount. iou reduced by using the \`-give\` command.`
    },
}

const commands = {
    "patchnotes": ["patchnotes"],
    "statistics": ["stats"],
    "random": ["random"],
    "math": ["math"],
    "coinflip": ["coinflip"],
    "alias": ["alias"],
    "vote": ["vote", "strawpoll"],
    "lottery": ["slots"],
    "fun": ["win", "brag"],
    "pictures": ["pic", "burger", "rem", "waifu"],
    "quotes": ["quote", "newquote"],
    "requests": ["request"],
    "bank": ["balance", "give", "iou"],
    "payroll": ["allowance"],
    "audio": ["play", "live", "endAudio"],
    "calendar": ["calendar", "nextBirthday", "allBirthdays", "nextHoliday", "allHolidays"],
    "vote": ["vote", "strawpoll"],
}

class Help extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-help/, this.help, 'help' );
        this.addCommand( /^\?help/, this.help, 'help' );
        this.addCommand( /^\?commands/, this.help, 'help' );
        this.addCommand( /^-commands/, this.help, 'help' );
        this.addCommand( /^-list/, this.playListHelp, 'play' );
        this.addCommand( /^!list/, this.playListHelp, 'play' );
        this.addCommand( /^\?roll/, this.rollHelp, 'roll' );
        this.addCommand( /^\?random/, this.randomHelp, 'random' );
        this.addCommand( /^\?math/, this.mathHelp, 'math' );
        this.addCommand( /^-math$/, this.mathHelp, 'math' );
        this.addCommand( /^\?coinflip/, this.coinflipHelp, 'coinflip' );
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
        this.addCommand( /^\?new ?[qQ]uote/, this.quoteHelp, 'quotes' );
        this.addCommand( /^\?quote/, this.quoteHelp, 'quotes' );
        this.addCommand( /^-new ?[qQ]uote$/, this.quoteHelp, 'quotes' );


        Object.keys(helps).forEach((k) => {
            this.addCommand(helps[k].regex, () => this.print(helps[k].module, helps[k].info), helps[k].module)
        });
        this.addCommand( /^\?(.+)/, this.helpInfo, 'help' );
    }

    print(swi, str) {
        if (switchboard.isEnabled(swi)) {
            this.setAction("message", str)
        }
    }

    help() {
        let cmds = []
        Object.keys(commands).forEach((sw) => {
            if (switchboard.isEnabled(sw)) {
                commands[sw].forEach((cmd) => {
                    cmds.push(cmd)
                })
            }
        })
        const COMMANDS = cmds.map( c => `-${c}`.padEnd( 25 ) );
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
    \`-slots big grid\` - ($1000) For those with just too much money`
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
}

module.exports = { help: new Help() };
