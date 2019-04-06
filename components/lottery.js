const gm = require( 'gm' );
const tmp = require( 'tmp' );
const _ = require( 'lodash' );
const uuidv4 = require( 'uuidv4' );
const { Component } = require( '../component' );
const { BUCKS, CONFIG_DEFAULTS } = require( '../constants' );
const { bank } = require( './bank' );
const { pictures } = require( './pictures' );

const ID = 'lottery';

let waitUntil = new Date().getTime();

const SIGNS = [
    {grid_amount: 7, maze_count: 4,  emote: ':cherries:',  value: 100},
    {grid_amount: 9, maze_count: 4,  emote: ':tangerine:', value: 50},
    {grid_amount: 11, maze_count: 4,  emote: ':lemon:',     value: 25},
    {grid_amount: 15, maze_count: 4,  emote: ':melon:',     value: 10},
    {grid_amount: 8, maze_count: 4,  emote: ':deer:', special: 'Bonus Buck Roll'},
    {grid_amount: 7, maze_count: 3,  emote: ':poop:',  multiply: -1},
    {grid_amount: 0, maze_count: 4, emote: ':two:',   multiply: 2},
    {grid_amount: 0, maze_count: 3, emote: ':three:',   multiply: 3},
    {grid_amount: 5, maze_count: 4,  emote: ':five:', multiply: 5},
    {grid_amount: 5, maze_count: 4,  emote: ':seven:', multiply: 7},
];

class Lottery extends Component {
    constructor() {
        super( ID );
        this.addCommand( /\*\*(.*)\*\* rolled the slots(?:.*)and (\w+)/s, this.watchLottery );
        this.addCommand( /^-slotstatistics$/, this.statsExtra );
        this.addCommand( /^-slotstats$/, ( metaInfo ) => this.stats( null, metaInfo ) );
        this.addCommand( /^-slotstats (.*)$/, this.stats );
        this.addCommand( /^-slots coin/, this.coinslots );
        this.addCommand( /^-slots grid/, this.gridslots );
        this.addCommand( /^-slots maze/, this.mazeSlots );
        this.addCommand( /^-cslots/, this.coinslots );
        this.addCommand( /^-gslots/, this.gridslots );
        this.addCommand( /^-mslots/, this.mazeSlots );
    }

    watchLottery( user, result, metaInfo ) {
        if ( metaInfo.authorId !== BUCKS.KAWAIICASINO && metaInfo.authorId !== BUCKS.BUCKBOT ) {
            this.setAction( 'message', 'Are you trying to confuse me?' );
            return;
        }
        if ( !this.json[user] ) {
            this.json[user] = {kawaii: {wins:0, losses:0, almost: 0}};
        }
        if ( result === 'won' ) {
            this.setAction( 'message', 'I see this... but I havn\'t implemented dming colton quite yet. do it yourself' );
            this.setAction( 'audioFile', 'sample.mp3' );
            _.set( this.json, `${user}.kawaii.wins`, _.get( this.json, `${user}.kawaii.wins`, 0 ) + 1 );
        } else if ( result === 'lost' ) {
            _.set( this.json, `${user}.kawaii.losses`, _.get( this.json, `${user}.kawaii.losses`, 0 ) + 1 );
        } else if ( result === 'almost' ) {
            _.set( this.json, `${user}.kawaii.almost`, _.get( this.json, `${user}.kawaii.almost`, 0 ) + 1 );
            _.set( this.json, `${user}.kawaii.losses`, _.get( this.json, `${user}.kawaii.losses`, 0 ) + 1 );
        }
        this.saveJSON();
    }

    stats( user, metaInfo ) {
        let id;
        if ( user === null ) {
            user = metaInfo.author;
            id = metaInfo.authorId;
        } else {
            id = BUCKS[user.toUpperCase()];
            if ( !id ) {
                this.setAction( 'message', `Sorry, I could not find user **${user}**` );
                return;
            }
        }
        if ( !this.json[id] && !this.json[user] ) {
            this.setAction( 'message', `No stats for \`${user}\`` );
            return;
        }

        const p = _.get( this.json, id, {} );
        const k = {...{wins: 0, almost: 0, losses:0 }, ..._.get( this.json,`${user}.kawaii`,undefined )};
        const b = {...{attempts: 0, wins: 0, bucks:0, winnings:0 }, ...p.buck};
        const c = {...{attempts: 0, best: 0, longest_streak: 0, winnings:0 }, ...p.coin};
        const m = {...{attempts: 0, best: 0, longest_streak: 0, winnings:0 }, ...p.maze};
        const g = {...{attempts: 0, best: 0, winnings:0 }, ...p.grid};

        const total = this.getTotal( id );

        this.setAction( 'message', `Slots Stats for **${user}**:
**Kawaii Casino**: \`${k.wins} wins\` and \`${k.losses+k.almost} losses\`. ${k.almost} of those losses were almost wins. Win ratio is **${( k.wins/( k.wins+k.losses+k.almost )*100 ).toFixed( 2 )}%**
**Coin Slots**: \`${c.attempts} attempts\`. Best streak is ${c.longest_streak} which won $${c.best}. Total winnings are $${c.winnings}. Average winnings are $${( c.winnings/c.attempts ).toFixed( 2 )}
**Grid Slots**: \`${g.attempts} attempts\`. Best roll gave $${g.best}. Total winnings are $${g.winnings} Average winnings are $${( g.winnings/g.attempts ).toFixed( 2 )}
**Maze Slots**: \`${m.attempts} attempts\`. Best roll gave $${m.best}. Longest streak is ${m.longest_streak}. Total winnings are $${m.winnings}. Average winnings are $${( m.winnings/m.attempts ).toFixed( 2 )}
**Buck Slots**: \`${b.attempts} attempts\`. ${b.bucks} of ${b.wins} wins were ultimate wins. Total winnings are $${b.winnings}
In total **${user}** has ${total < 0?`lost ${-total}`:`gained ${total}`} credits from slots` );
    }

    statsExtra() {
        const k = Object.keys( BUCKS );
        const total = {total: 0, spent: 0, coin: 0, grid: 0, maze: 0};
        const most = {val:-Infinity, user: ''};
        const least = {val:+Infinity, user: ''};
        const spent = {val:-Infinity, user: ''};
        k.forEach( k => {
            const t = this.getTotal( BUCKS[k] );
            const s = this.getSpent( BUCKS[k] );
            total.total += t;
            if ( t > most.val ) {
                most.val = t;
                most.user = k;
            }
            if ( t < least.val ) {
                least.val = t;
                least.user = k;
            }
            total.spent += s;
            if ( s > spent.val ) {
                spent.val = s;
                spent.user = k;
            }
            total.coin -= _.get( this.json, `${BUCKS[k]}.coin.attempts`, 0 );
            total.coin += _.get( this.json, `${BUCKS[k]}.coin.winnings`, 0 );
            total.grid -= 5*_.get( this.json, `${BUCKS[k]}.grid.attempts`, 0 );
            total.grid += _.get( this.json, `${BUCKS[k]}.grid.winnings`, 0 );
            total.maze -= 20*_.get( this.json, `${BUCKS[k]}.maze.attempts`, 0 );
            total.maze += _.get( this.json, `${BUCKS[k]}.maze.winnings`, 0 );
        } );
        this.setAction( 'message', `Slot records:
**${spent.user}** has spent the most on slots. A whopping \`${spent.val} credits\`.
**${most.user}** has won \`${most.val} credits\` in profit, while **${least.user}** has lost \`${-least.val} credits\`.
Maze slots has ${total.maze<0?`claimed \`${-total.maze}\` hard earned credits`:`given back \`${total.maze}\` credits`}
Grid slots has ${total.grid<0?`claimed \`${-total.grid}\` hard earned credits`:`given back \`${total.grid}\` credits`}
Coin slots has ${total.coin<0?`claimed \`${-total.coin}\` hard earned credits`:`given back \`${total.coin}\` credits`}
` );
    }

    coinslots( metaInfo ) {
        const user = metaInfo.author;
        const id = metaInfo.authorId;
        const uuid = uuidv4();

        if ( metaInfo.channelId !== CONFIG_DEFAULTS.MAIN_CHANNEL ) {
            this.setAction( 'message', 'Please make your slot rolls public.' );
            return;
        }
        if ( ( new Date() ).getTime() < waitUntil ) {
            this.setAction( 'message', `**${user}**, Please wait your turn.` );
            return;
        }

        if ( !bank.payAmount( id, 1 ) ) {
            this.setAction( 'message', `Sorry **${user}**, but Coin Slots costs **1** credit. You don't have enough.` );
            return;
        }

        let chain = 0;
        let winnings = 0;
        let totalDelay = 0;

        this.setAction( 'message', `**${user}** rolled the slots! (Costed 1 credit)\nCoin Slots - Keep flipping till you lose!\n\nReward: ${winnings}` );
        this.setAction( 'messageId', `lottery-${uuid}` );
        this.queueAction();
        while ( Math.random() < 0.5 ) {
            chain += 1;
            winnings = chain;
            this.setAction( 'delay', ( chain+3 )*.2 );
            totalDelay += ( chain+3 )*.2;
            this.setAction( 'message', `**${user}** rolled the slots! (Costed 1 credit)\nCoin Slots - Keep flipping till you lose!\n${':moneybag:'.repeat( chain )}\nReward: ${winnings}` );
            this.setAction( 'editId', `lottery-${uuid}` );
            this.queueAction();
        }
        totalDelay += ( chain+3 )*.2;
        waitUntil = ( new Date() ).getTime() + totalDelay*1000;

        this.setAction( 'delay', ( chain+3 )*.2 );
        this.setAction( 'message', `**${user}** rolled the slots! (Costed 1 credit)\nCoin Slots - Keep flipping till you lose!\n${':moneybag:'.repeat( chain )+':x:'}\nReward: ${winnings}` );
        this.setAction( 'editId', `lottery-${uuid}` );
        _.set( this.json, `${id}.coin.longest_streak`, Math.max( _.get( this.json, `${id}.coin.longest_streak`, 0 ), chain ) );
        _.set( this.json, `${id}.coin.best`, Math.max( _.get( this.json, `${id}.coin.best`, 0 ), winnings ) );
        _.set( this.json, `${id}.coin.winnings`, _.get( this.json, `${id}.coin.winnings`, 0 ) + winnings );
        _.set( this.json, `${id}.coin.attempts`, _.get( this.json, `${id}.coin.attempts`, 0 ) + 1 );
        this.saveJSON();

        bank.addAmount( id, winnings );
    }

    gridslots( metaInfo ) {
        const user = metaInfo.author;
        const id = metaInfo.authorId;

        if ( metaInfo.channelId !== CONFIG_DEFAULTS.MAIN_CHANNEL ) {
            this.setAction( 'message', 'Please make your slot rolls public.' );
            return;
        }
        if ( ( new Date() ).getTime() < waitUntil ) {
            this.setAction( 'message', `**${user}**, Please wait your turn.` );
            return;
        }

        if ( !bank.payAmount( id, 5 ) ) {
            this.setAction( 'message', `Sorry **${user}**, but Grid Slots costs **5** credits. You don't have enough.` );
            return;
        }

        if ( id === BUCKS.GINGE ) {
            if ( Math.random() > 0.99 ) {
                this.setAction( 'message', `Holy Mantle triggered. **${user}** doesn't have to pay this time.` );
                bank.addAmount( id, 5 );
            }
        }

        const lines = {};
        // results is a helper method which explains which rewards a user has won thus far
        const results = () => {
            let winnings = 0;
            let multiply = 1;
            SIGNS.forEach( ( e ) => {
                if ( lines[e.emote] ) {
                    if ( e.emote === ':poop:' && metaInfo.authorId !== BUCKS.GINGE ) {
                        winnings -= 10*lines[e.emote];
                    } else if ( e.multiply ) {
                        multiply *= e.multiply**lines[e.emote];
                    } else if ( e.value ) {
                        winnings += e.value*lines[e.emote];
                    }
                }
            } );
            if ( winnings === 0 && multiply !== 1 ) {
                winnings = 1;
            }
            winnings *= multiply;
            return {winnings};
        };

        let grid = [[0,0,0],[0,0,0],[0,0,0]];
        const bag = [];
        SIGNS.forEach( ( sign ) => {
            bag.push( ...Array( sign.grid_amount ).fill( sign.emote ) );
        } );
        grid = grid.map( ( row ) => row.map( () => _.sample( bag ) ) );

        const valid_lines = [
            [{x:0,y:0},{x:0,y:1},{x:0,y:2}],
            [{x:1,y:0},{x:1,y:1},{x:1,y:2}],
            [{x:2,y:0},{x:2,y:1},{x:2,y:2}],
            [{x:0,y:0},{x:1,y:1},{x:2,y:2}],
            [{x:2,y:0},{x:1,y:1},{x:0,y:2}],
            [{x:0,y:0},{x:1,y:0},{x:2,y:0}],
            [{x:0,y:1},{x:1,y:1},{x:2,y:1}],
            [{x:0,y:2},{x:1,y:2},{x:2,y:2}]
        ];
        valid_lines.forEach( ( i ) => {
            if ( grid[i[0].x][i[0].y] === grid[i[1].x][i[1].y] && grid[i[0].x][i[0].y] === grid[i[2].x][i[2].y] ) {
                lines[grid[i[0].x][i[0].y]] = _.get( lines, grid[i[0].x][i[0].y], 0 ) + 1;
            }
        } );
        const winnings = results().winnings;

        const deerWins = lines[':deer:'];

        this.setAction( 'message', `**${user}** rolled the slots! (Costed 5 credits)\nGrid Slots - 8 possible rows!
**[** ${grid[0][0]}${grid[1][0]}${grid[2][0]} **]**
**[** ${grid[0][1]}${grid[1][1]}${grid[2][1]} **]**
**[** ${grid[0][2]}${grid[1][2]}${grid[2][2]} **]**
Reward: **${winnings}**${deerWins?`\nYou've also won ${deerWins} rolls of Buck Slots! They will happen in 3 seconds.`:''}` );

        _.set( this.json, `${id}.grid.best`, Math.max( _.get( this.json, `${id}.grid.best`, 0 ), winnings ) );
        _.set( this.json, `${id}.grid.winnings`, _.get( this.json, `${id}.grid.winnings`, 0 ) + winnings );
        _.set( this.json, `${id}.grid.attempts`, _.get( this.json, `${id}.grid.attempts`, 0 ) + 1 );
        this.saveJSON();

        bank.addAmount( id, winnings );

        if ( deerWins ) {
            this.queueAction();
            this.setAction( 'delay', 3 );
            for ( let i = 0; i < deerWins; i+=1 ) {
                this.buckSlots( user, id );
            }
            waitUntil = ( new Date() ).getTime() + ( 3+deerWins )*1000;
        }
    }

    mazeSlots( metaInfo ) {
        const user = metaInfo.author;
        const id = metaInfo.authorId;
        const uuid = uuidv4();

        if ( metaInfo.channelId !== CONFIG_DEFAULTS.MAIN_CHANNEL ) {
            this.setAction( 'message', 'Please make your slot rolls public.' );
            return;
        }

        if ( ( new Date() ).getTime() < waitUntil ) {
            this.setAction( 'message', `**${user}**, Please wait your turn.` );
            return;
        }

        if ( !bank.payAmount( id, 20 ) ) {
            this.setAction( 'message', `Sorry **${user}**, but Maze Slots costs **20** credits. You don't have enough.` );
            return;
        }

        if ( id === BUCKS.GINGE ) {
            if ( Math.random() > 0.99 ) {
                this.setAction( 'message', `Holy Mantle triggered. **${user}** doesn't have to pay this time.` );
                bank.addAmount( id, 20 );
            }
        }

        const rewards = {};
        let streak = 1;
        let totalDelay = 0;

        // results is a helper method which explains which rewards a user has won thus far
        const results = () => {
            let s = 'Sets:';
            let winnings = 0;
            let multiply = 1;
            let deerWins = 0;
            SIGNS.forEach( ( e ) => {
                const sets = Math.floor( rewards[e.emote]/3 );
                if ( sets ) {
                    if ( e.special ) {
                        s += `\n${_.repeat( `${e.emote}`, 3 * sets )}  Reward: ${e.special}`;
                        if ( e.emote === ':deer:' ) {
                            deerWins = sets;
                        }
                    } else if ( e.multiply ) {
                        s += `\n${_.repeat( `${e.emote}`, 3 * sets )}  Reward: x${e.multiply**sets} rewards`;
                        multiply *= e.multiply**sets;
                    } else {
                        s += `\n${_.repeat( `${e.emote}`, 3 * sets )}  Reward: $${e.value*sets}`;
                        winnings += e.value*sets;
                    }
                }
            } );
            if ( winnings === 0 && multiply !== 1 ) {
                winnings = 1;
            }
            if ( multiply < 0 && metaInfo.authorId === BUCKS.GINGE ) {
                multiply *= -1;
            }
            winnings *= multiply;
            deerWins *= multiply;
            s += `\nTotal: $${winnings}`;
            s = s.length<20?'':s;
            return {s, winnings, deerWins};
        };

        // setup the board
        const bag = [];
        SIGNS.forEach( ( e ) => {
            bag.push( ...Array( e.maze_count ).fill( e.emote ) );
        } );
        bag.push( ...Array( 77-bag.length ).fill( ':white_square_button:' ) );
        const grid = _.chunk( _.shuffle( bag ), 11 );
        const visible_grid = _.chunk( Array( 77 ).fill( ':black_large_square:' ), 11 );

        // setup the starting position
        let pos = {x:-1,y:-1};
        if ( grid[3][5] !== ':white_square_button:' ) {
            pos = {x:5, y:3};
        }
        while ( pos.x === -1 ) {
            const [x, y] = [Math.floor( Math.random()*11 ), Math.floor( Math.random()*7 )];
            if ( grid[y][x] !== ':white_square_button:' ) {
                pos = {x, y};
            }
        }
        visible_grid[pos.y][pos.x] = grid[pos.y][pos.x];
        rewards[grid[pos.y][pos.x]] = 1;
        this.setAction( 'message', `${user} rolled the slots! (Costed 20 credits)\nMaze Slots - Let the Journey Begin!\n${visible_grid.map( row => row.join( '' ) ).join( '\n' )}\n${results().s}` );
        this.setAction( 'messageId', `lottery-${uuid}` );

        // look around and collect fruit till you hit a deadend
        loop:
        while ( true ) {
            const dirs = _.shuffle( [{dx: 0, dy: 1}, {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: -1, dy: 0}] );
            while ( true ) {
                const chosen = dirs.pop();
                const [x, y] = [( chosen.dx + pos.x + 11 )%11, ( chosen.dy + pos.y + 7 )%7];
                if ( grid[y][x] !== visible_grid[y][x] ) {
                    if ( grid[y][x] === ':white_square_button:' ) {
                        visible_grid[y][x] = grid[y][x];
                        break;
                    }
                    pos = {x, y};
                    visible_grid[y][x] = grid[y][x];
                    rewards[grid[y][x]] = _.get( rewards, grid[y][x], 0 ) + 1;
                    streak += 1;
                    break;
                }
                if ( dirs.length === 0 ) {
                    break loop;
                }
            }
            this.queueAction();
            this.setAction( 'delay', grid[pos.y][pos.x] === ':white_square_button:'?1:2 );
            totalDelay += grid[pos.y][pos.x] === ':white_square_button:'?1:2;
            this.setAction( 'message', `${user} rolled the slots! (Costed 20 credits)\nMaze Slots - Let the Journey Begin!\n${visible_grid.map( row => row.join( '' ) ).join( '\n' )}\n${results().s}` );
            this.setAction( 'editId', `lottery-${uuid}` );
        }
        const r = results();
        const winnings = r.winnings;
        const deerWins = r.deerWins;
        this.queueAction();
        this.setAction( 'message', `${user} rolled the slots! (Costed 20 credits)\nMaze Slots - Let the Journey Begin!\n${visible_grid.map( row => row.join( '' ) ).join( '\n' )}\nYou hit a dead end! **Game Over**.\n${results().s}` );
        this.setAction( 'editId', `lottery-${uuid}` );

        // record stats
        _.set( this.json, `${id}.maze.longest_streak`, Math.max( _.get( this.json, `${id}.maze.longest_streak`, 0 ), streak ) );
        _.set( this.json, `${id}.maze.best`, Math.max( _.get( this.json, `${id}.maze.best`, 0 ), winnings ) );
        _.set( this.json, `${id}.maze.winnings`, _.get( this.json, `${id}.maze.winnings`, 0 ) + winnings );
        _.set( this.json, `${id}.maze.attempts`, _.get( this.json, `${id}.maze.attempts`, 0 ) + 1 );
        this.saveJSON();

        bank.addAmount( id, winnings );

        if ( deerWins ) {
            this.queueAction();
            this.setAction( 'delay', 3 );
            for ( let i = 0; i < deerWins; i+=1 ) {
                this.buckSlots( user, id );
            }
            totalDelay += 3 + deerWins;
        }
        waitUntil = ( new Date() ).getTime() + totalDelay*1000;
    }

    buckSlots( user, id ) {
        const bag = ['eight', 'seven', 'one', 'buck', 'bee', 'scary', 'girl', 'kiwi'];
        const roll = [_.sample( bag ), _.sample( bag ), _.sample( bag )];

        let winnings = 0;
        let cuties = false;

        let strNum = '';
        let resultStr = '';
        let giveVal;
        switch ( roll.join( ',' ) ) {
        case 'eight,seven,one':
            _.set( this.json, `${id}.buck.wins`, _.get( this.json, `${id}.buck.wins`, 0 ) + 1 );
            winnings = 871;
            resultStr = 'Nice win! You won 871 credits!';
            break;
        case 'seven,seven,seven':
            _.set( this.json, `${id}.buck.wins`, _.get( this.json, `${id}.buck.wins`, 0 ) + 1 );
            winnings = 7777;
            resultStr = 'Big lotto win! You won a whopping 7777 credits!';
            break;
        case 'seven,buck,seven':
            _.set( this.json, `${id}.buck.wins`, _.get( this.json, `${id}.buck.wins`, 0 ) + 1 );
            bank.addAmount( id, 7, 'buckbucks' );
            resultStr = 'Great lotto buck win! You won 7 buck bucks!';
            break;
        case 'buck,buck,buck':
            _.set( this.json, `${id}.buck.wins`, _.get( this.json, `${id}.buck.wins`, 0 ) + 1 );
            _.set( this.json, `${id}.buck.bucks`, _.get( this.json, `${id}.buck.bucks`, 0 ) + 1 );
            bank.addAmount( id, 25, 'buckbucks' );
            resultStr = 'You got the ultimate win!!! 25 buck bucks awarded!';
            break;
        case 'bee,bee,bee':
            _.set( this.json, `${id}.buck.wins`, _.get( this.json, `${id}.buck.wins`, 0 ) + 1 );
            bank.addAmount( id, 3, 'buckbucks' );
            resultStr = 'Nice win! 3 buck bucks! This also unlocks the `-bugs` picture command';
            pictures.unlockBugs();
            break;
        case 'scary,scary,scary':
            _.set( this.json, `${id}.buck.wins`, _.get( this.json, `${id}.buck.wins`, 0 ) + 1 );
            bank.addAmount( id, 3, 'buckbucks' );
            resultStr = 'Bad win! TOMmi gets 100 of your bucks or bankrupts you. You do get 3 buck bucks however.';
            giveVal = Math.min( 100, Math.max( 0, bank.balance( id ) ) );
            bank.payAmount( id, giveVal );
            bank.addAmount( BUCKS.TOMMI, giveVal );
            break;
        case 'girl,girl,girl':
            _.set( this.json, `${id}.buck.wins`, _.get( this.json, `${id}.buck.wins`, 0 ) + 1 );
            bank.addAmount( id, 3, 'buckbucks' );
            resultStr = 'Nice win! 3 buck bucks awarded.';
            cuties = true;
            break;
        case 'kiwi,kiwi,kiwi':
            _.set( this.json, `${id}.buck.wins`, _.get( this.json, `${id}.buck.wins`, 0 ) + 1 );
            bank.addAmount( id, 3, 'buckbucks' );
            resultStr = 'Nice win! 3 buck bucks awarded. This is supposed to play and unlock the Kewe soundclip';
            this.setAction( 'audioFile', 'isitkewe' );
            break;
        default:
            roll.forEach( ( elem ) => {
                switch ( elem ) {
                case 'eight':
                    strNum += '8';
                    break;
                case 'seven':
                    strNum += '7';
                    break;
                case 'one':
                    strNum += '1';
                    break;
                }
            } );
            if ( strNum.length > 2 ) {
                strNum = strNum.slice( 0,2 );
                roll[2] = 'scary';
            }
            winnings = Number( strNum );
            if ( winnings ) {
                resultStr = `Consolation prize: **${winnings}** credits!`;
            } else {
                resultStr = 'Sorry, you lost.';
            }
        }
        const image = gm( 'images/leftbrace.jpg' );
        roll.forEach( ( elem ) => {
            image.append( `images/${elem}.jpg`, true );
        } );
        image.append( 'images/rightbrace.jpg', true );
        const fileName = tmp.tmpNameSync() + '.jpg';
        image.write( fileName, () => {} );

        this.queueAction();
        this.setAction( 'image', fileName );
        this.setAction( 'delay', 1 );
        this.setAction( 'message', `**${user}**'s roll: ` + resultStr );

        if ( cuties ) {
            this.queueAction();
            this.setAction( 'delay', 3 );
            this.setAction( 'imageLink', ['https://cdn.weeb.sh/images/H1yFOUmv-.gif','https://cdn.weeb.sh/images/SyShOUQPZ.gif','https://cdn.weeb.sh/images/BySrd8QD-.gif'] );
            this.queueAction();
            this.setAction( 'delay', 1 );
            this.setAction( 'imageLink', ['https://cdn.weeb.sh/images/rJsN_LQvW.gif','https://cdn.weeb.sh/images/BJeeaOLXDW.gif','https://cdn.weeb.sh/images/Bkl1YLXP-.gif'] );
            this.queueAction();
            this.setAction( 'delay', 1 );
            this.setAction( 'imageLink', ['https://cdn.weeb.sh/images/H1wxtLXwb.gif','https://cdn.weeb.sh/images/r1WpdUmDZ.gif','https://cdn.weeb.sh/images/ryvHO8Qwb.gif'] );
        }

        bank.addAmount( id, winnings );
        _.set( this.json, `${id}.buck.winnings`, _.get( this.json, `${id}.buck.winnings`, 0 ) + winnings );
        _.set( this.json, `${id}.buck.attempts`, _.get( this.json, `${id}.buck.attempts`, 0 ) + 1 );
        this.saveJSON();
    }

    // HELPERS

    getTotal( id ) {
        let total = 0;
        total -= _.get( this.json, `${id}.coin.attempts`, 0 );
        total -= 5*_.get( this.json, `${id}.grid.attempts`, 0 );
        total -= 20*_.get( this.json, `${id}.maze.attempts`, 0 );
        total += _.get( this.json, `${id}.coin.winnings`, 0 );
        total += _.get( this.json, `${id}.grid.winnings`, 0 );
        total += _.get( this.json, `${id}.maze.winnings`, 0 );
        total += _.get( this.json, `${id}.buck.winnings`, 0 );
        return total;
    }

    getSpent( id ) {
        let spent = 0;
        spent += _.get( this.json, `${id}.coin.attempts`, 0 );
        spent += 5*_.get( this.json, `${id}.grid.attempts`, 0 );
        spent += 20*_.get( this.json, `${id}.maze.attempts`, 0 );
        return spent;
    }
}

module.exports = { lottery: new Lottery() };
