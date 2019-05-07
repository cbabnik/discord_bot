const gm = require( 'gm' );
const tmp = require( 'tmp' );
let _ = require( 'lodash' );
const uuidv4 = require( 'uuidv4' );
const { Component } = require( '../component' );
const { BUCKS, CONFIG_DEFAULTS, ACTIONS, PERMISSION_LEVELS } = require( '../constants' );
const { bank } = require( './bank' );
const { pictures } = require( './pictures' );

const ID = 'lottery';

const SIGNS = [
    {grid_amount: 5, maze_count: 3,  emote: ':kiwi:',     value: 200},
    {grid_amount: 6, maze_count: 3,  emote: ':cherries:',  value: 100},
    {grid_amount: 8, maze_count: 3,  emote: ':tangerine:', value: 50},
    {grid_amount: 11, maze_count: 4,  emote: ':lemon:',     value: 25},
    {grid_amount: 11, maze_count: 3,  emote: ':melon:',     value: 10},
    {grid_amount: 11, maze_count: 4,  emote: ':strawberry:',value: 5},
    {grid_amount: 9, maze_count: 7,  emote: ':deer:', special: 'Bonus Buck Roll'},
    {grid_amount: 10, maze_count: 3,  emote: ':poop:',  multiply: -1},
    {grid_amount: 0, maze_count: 4, emote: ':two:',   multiply: 2},
    {grid_amount: 0, maze_count: 3, emote: ':three:',   multiply: 3},
    {grid_amount: 0, maze_count: 3,  emote: ':five:', multiply: 5},
    {grid_amount: 0, maze_count: 3,  emote: ':seven:', multiply: 7},
];

const GRID_SLOTS_VALID_LINES = [
    [{x:0,y:0},{x:0,y:1},{x:0,y:2}],
    [{x:1,y:0},{x:1,y:1},{x:1,y:2}],
    [{x:2,y:0},{x:2,y:1},{x:2,y:2}],
    [{x:0,y:0},{x:1,y:1},{x:2,y:2}],
    [{x:2,y:0},{x:1,y:1},{x:0,y:2}],
    [{x:0,y:0},{x:1,y:0},{x:2,y:0}],
    [{x:0,y:1},{x:1,y:1},{x:2,y:1}],
    [{x:0,y:2},{x:1,y:2},{x:2,y:2}]
];

// buck value is $23.31

class Lottery extends Component {
    constructor() {
        super( ID );
        this.addCommand( /(\*\*(.*)\*\* rolled the slots(?:.*)and (\w+))/s, this.watchLottery );
        this.addCommand( /^-slotstatistics$/, this.statsExtra );
        this.addCommand( /^-slotstats$/, ( metaInfo ) => this.stats( null, metaInfo ) );
        this.addCommand( /^-slotstats (.*)$/, this.stats );
        this.addCommand( /^-slots coin odds/, this.coinOdds );
        this.addCommand( /^-cslots odds/, this.coinOdds );
        this.addCommand( /^-slots grid odds/, this.gridOdds );
        this.addCommand( /^-gslots odds/, this.gridOdds );
        this.addCommand( /^-slots maze odds/, this.mazeOdds );
        this.addCommand( /^-mslots odds/, this.mazeOdds );
        this.addCommand( /^-slots coin$/, this.coinslots );
        this.addCommand( /^-slots grid$/, this.gridslots );
        this.addCommand( /^-slots maze$/, this.mazeSlots );
        this.addCommand( /^-cslots$/, this.coinslots );
        this.addCommand( /^-gslots$/, this.gridslots );
        this.addCommand( /^-mslots$/, this.mazeSlots );
        this.addCommand( /^-slots buck$/, this.bslots );
        this.addCommand( /^-bslots$/, this.bslots );
        this.addCommand( /^#freeroll (\d+) (.*)$/, this.giveRolls );
        this.addCommand( /^#freeroll (.*)$/, ( type, metaInfo ) => this.giveRolls( 1, type, metaInfo ) );
        this.addCommand( /^-freerolls$/ , this.countRolls );

        this.waitUntil = new Date().getTime();
    }

    bslots( metaInfo ) {
        const id = metaInfo.authorId;
        const user = metaInfo.author;
        if ( _.get( this.json, `${id}.buck.freeRolls`, 0 ) > 0 ) {
            this.json[id]['buck'].freeRolls -= 1;
            this.setAction( 'message', `**${user}** used their free roll. (${this.json[id]['buck'].freeRolls} left)` );
            this.queueAction();
            this.buckSlots( user, id );
        } else {
            this.setAction( 'message', 'You don\'t have any free buck rolls and you can\'t buy them.' );
        }
    }

    countRolls( metaInfo ) {
        const user = metaInfo.author;
        const id = metaInfo.authorId;
        const coins = _.get( this.json, `${id}.coin.freeRolls`, 0 );
        const grids = _.get( this.json, `${id}.grid.freeRolls`, 0 );
        const mazes = _.get( this.json, `${id}.maze.freeRolls`, 0 );
        const bucks = _.get( this.json, `${id}.buck.freeRolls`, 0 );
        this.setAction( ACTIONS.MESSAGE, `**${user}**
${coins} free coin roll${coins===1?'':'s'}
${grids} free grid roll${grids===1?'':'s'}
${mazes} free maze roll${mazes===1?'':'s'}
${bucks} free buck roll${bucks===1?'':'s'}` );
    }

    giveRolls( count, type, metaInfo ) {
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            Object.values( BUCKS ).forEach( id => {
                _.set( this.json, `${id}.${type}.freeRolls`, _.get( this.json, `${id}.${type}.freeRolls`, 0 ) + Number( count ) );
            } );
            this.saveJSON();
            this.setAction( ACTIONS.CHANNEL_ID, CONFIG_DEFAULTS.MAIN_CHANNEL );
            if ( count > 1 ) {
                this.setAction( ACTIONS.MESSAGE, `Everyone gets ${count} free ${type} rolls` );
            }
        } else {
            this.setAction( ACTIONS.MESSAGE, 'You can\'t do that' );
        }
    }

    mazeOdds() {
        let msg = 'Explore the maze until you hit a dead end! Get 3 of the same icons for a reward!\nThe value of one roll is **18.80**';
        SIGNS.forEach( ( s ) => {
            if ( s.value ) {
                msg += `\n${s.emote.repeat( 3 )}: **$${s.value}** (${s.maze_count} icons are ${s.emote})`;
            }
        } );
        SIGNS.forEach( ( s ) => {
            if ( s.multiply ) {
                msg += `\n${s.emote.repeat( 3 )}: **${s.multiply}x** Rewards (${s.maze_count} icons are ${s.emote})`;
            }
        } );
        this.setAction( ACTIONS.MESSAGE, msg );
        this.setAction( ACTIONS.IMAGE, 'charts/maze.png' );
        this.queueAction();
        this.setAction( ACTIONS.DELAY, 0.5 );
        this.setAction( ACTIONS.IMAGE, 'charts/mazezoom.png' );
        this.queueAction();
        this.setAction( ACTIONS.IMAGE, 'charts/mazebar.png' );
    }

    gridOdds() {
        let msg = 'Roll a 3x3 grid. Any row (horizontal, vertical, diagonal) can be a winner.\nThe value of one roll is **4.72**';
        const bagTotal = _.sumBy( SIGNS, s => s.grid_amount );
        SIGNS.forEach( ( s ) => {
            if ( s.value ) {
                msg += `\n${s.emote.repeat( 3 )}: **$${s.value}** (${s.grid_amount}/${bagTotal} odds of a ${s.emote})`;
            }
        } );
        msg += `\n${':poop:'.repeat( 3 )}: **$-10** (7/${bagTotal} odds of a :poop:)`;
        this.setAction( ACTIONS.MESSAGE, msg );
        this.setAction( ACTIONS.IMAGE, 'charts/grid.png' );
        this.queueAction();
        this.setAction( ACTIONS.DELAY, 0.5 );
        this.setAction( ACTIONS.IMAGE, 'charts/gridzoom.png' );
        this.queueAction();
        this.setAction( ACTIONS.IMAGE, 'charts/gridbar.png' );
    }

    coinOdds() {
        this.setAction( ACTIONS.MESSAGE, 'Each :moneybag: gives one coin. The coinflip is weighted 0.495% chance to fail.\nThe value of one roll is **$0.96**' );
        this.setAction( ACTIONS.IMAGE, 'charts/coin.png' );
        this.queueAction();
        this.setAction( ACTIONS.DELAY, 0.5 );
        this.setAction( ACTIONS.IMAGE, 'charts/coinbar.png' );
    }

    watchLottery( msg, user, result, metaInfo ) {
        if ( metaInfo.authorId !== BUCKS.KAWAIICASINO && metaInfo.authorId !== BUCKS.BUCKBOT ) {
            this.setAction( 'message', 'Are you trying to confuse me?' );
            return;
        }
        if ( !this.json[user] ) {
            this.json[user] = {kawaii: {wins:0, losses:0, almost: 0}};
        }
        if ( result === 'won' ) {
            this.setAction( 'message', 'DMing Colton' );
            this.setAction( 'audioFile', 'sample.mp3' );
            this.queueAction();
            this.setAction( ACTIONS.MESSAGE_USER_ID, BUCKS.COLTSU );
            this.setAction( 'message', `${user} got a KawaiiCasino Win.\n${msg}` );
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
        let most = {val:-Infinity, user: ''};
        let least = {val:+Infinity, user: ''};
        let spent = {val:-Infinity, user: ''};
        k.forEach( k => {
            const t = this.getTotal( BUCKS[k] );
            const s = this.getSpent( BUCKS[k] );
            total.total += t;
            total.spent += s;
            if ( t > most.val ) {
                most = {val: t, user: k}; 
            }
            if ( t < least.val ) {
                least = {val: t, user: k}; 
            }
            if ( s > spent.val ) {
                spent = {val: s, user: k}; 
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
        // setup
        const user = metaInfo.author;
        const id = metaInfo.authorId;
        const uuid = uuidv4();
        if ( !this.canEnter( metaInfo, 'coin', 1 ) ) {
            return;
        }
        if ( this.hasHolyMantle( id ) && Math.random() > 0.99 ) {
            this.setAction( 'message', `Holy Mantle triggered. **${user}** doesn't have to pay this time.` );
            this.queueAction();
            bank.addAmount( id, 1 );
        }
        let chain = 0;
        let totalDelay = 0;
        // slots
        this.setAction( 'messageId', `lottery-${uuid}` );
        this.setAction( 'message', `**${user}** rolled the slots! (Costed 1 credit)\nCoin Slots - Keep flipping till you lose!\n\nReward: ${chain}` );
        for ( let chainStr = ''; !chainStr.includes( ':x:' ); ) {
            this.queueAction();
            this.setAction( 'delay', ( chain+2 )*.2 );
            totalDelay += ( chain+2 )*.2 ;
            this.setAction( 'editId', `lottery-${uuid}` );
            if ( Math.random() < 0.505 ) {
                chainStr += ':x:';
            } else {
                chain += 1;
                chainStr += ':moneybag:';
            }
            this.setAction( 'message', `**${user}** rolled the slots! (Costed 1 credit)\nCoin Slots - Keep flipping till you lose!\n${chainStr}\nReward: ${chain}` );
        }
        // make people wait their turn
        this.offLimitsFor( totalDelay );
        // keep stats
        _.set( this.json, `${id}.coin.longest_streak`, Math.max( _.get( this.json, `${id}.coin.longest_streak`, 0 ), chain ) );
        _.set( this.json, `${id}.coin.best`, Math.max( _.get( this.json, `${id}.coin.best`, 0 ), chain ) );
        _.set( this.json, `${id}.coin.winnings`, _.get( this.json, `${id}.coin.winnings`, 0 ) + chain );
        _.set( this.json, `${id}.coin.attempts`, _.get( this.json, `${id}.coin.attempts`, 0 ) + 1 );
        this.saveJSON();
        // reward winnings
        bank.addAmount( id, chain );
    }

    gridslots( metaInfo ) {
        // setup
        const user = metaInfo.author;
        const id = metaInfo.authorId;
        if ( !this.canEnter( metaInfo, 'grid', 5 ) ) {
            return;
        }
        if ( this.hasHolyMantle( id ) && Math.random() > 0.99 ) {
            this.setAction( 'message', `Holy Mantle triggered. **${user}** doesn't have to pay this time.` );
            this.queueAction();
            bank.addAmount( id, 5 );
        }
        // create the grid by grabbing items from a bag
        const bag = [];
        SIGNS.forEach( ( sign ) => {
            bag.push( ...Array( sign.grid_amount ).fill( sign.emote ) );
        } );
        let grid = [[0,0,0],[0,0,0],[0,0,0]];
        grid = grid.map( ( row ) => row.map( () => _.sample( bag ) ) );
        // check how many wins
        const wins = {};
        GRID_SLOTS_VALID_LINES.forEach( ( line ) => {
            const a = grid[line[0].x][line[0].y];
            const b = grid[line[1].x][line[1].y];
            const c = grid[line[2].x][line[2].y];
            if ( a === b && b === c ) {
                wins[a] = _.get( wins, a, 0 ) + 1;
            }
        } );
        let overrules;
        if ( this.hasHolyMantle( id ) ) {
            overrules = [{emote: ':poop:', multiply: undefined, value: undefined}];
        } else {
            overrules = [{emote: ':poop:', multiply: undefined, value: -10}];
        }
        const r = this.results( wins, overrules );
        const winnings = r.winnings;
        const deerWins = r.deerWins;
        // declare
        this.setAction( 'message', `**${user}** rolled the slots! (Costed 5 credits)\nGrid Slots - 8 possible rows!
**[** ${grid[0][0]}${grid[1][0]}${grid[2][0]} **]**
**[** ${grid[0][1]}${grid[1][1]}${grid[2][1]} **]**
**[** ${grid[0][2]}${grid[1][2]}${grid[2][2]} **]**
Reward: **${winnings}**${deerWins?`\nYou've also won ${deerWins} rolls of Buck Slots! They will happen in 3 seconds.`:''}` );
        // track stats
        _.set( this.json, `${id}.grid.best`, Math.max( _.get( this.json, `${id}.grid.best`, 0 ), winnings ) );
        _.set( this.json, `${id}.grid.winnings`, _.get( this.json, `${id}.grid.winnings`, 0 ) + winnings );
        _.set( this.json, `${id}.grid.attempts`, _.get( this.json, `${id}.grid.attempts`, 0 ) + 1 );
        this.saveJSON();
        // add winnings
        bank.addAmount( id, winnings );
        // buck slots
        if ( deerWins ) {
            this.queueAction();
            this.setAction( 'delay', 3 );
            for ( let i = 0; i < deerWins; i+=1 ) {
                this.buckSlots( user, id );
            }
            this.offLimitsFor( 3+deerWins );
        }
    }

    mazeSlots( metaInfo ) {
        // setup
        const user = metaInfo.author;
        const id = metaInfo.authorId;
        const uuid = uuidv4();
        if ( !this.canEnter( metaInfo, 'maze', 20 ) ) {
            return;
        }
        if ( this.hasHolyMantle( id ) && Math.random() > 0.99 ) {
            this.setAction( 'message', `Holy Mantle triggered. **${user}** doesn't have to pay this time.` );
            this.queueAction();
            bank.addAmount( id, 20 );
        }
        const rewards = {};
        const wins = {};
        let streak = 1;
        let totalDelay = 0;
        // put together the board
        const bag = [];
        SIGNS.forEach( ( e ) => {
            bag.push( ...Array( e.maze_count ).fill( e.emote ) );
        } );
        bag.push( ...Array( 77-bag.length ).fill( ':white_square_button:' ) );
        const grid = _.chunk( _.shuffle( bag ), 11 );
        const visible_grid = _.chunk( Array( 77 ).fill( ':black_large_square:' ), 11 );
        // choose a starting position
        let pos = {x:5,y:3};
        while ( grid[pos.y][pos.x] === ':white_square_button:' ) {
            pos = { x: Math.floor( Math.random()*11 ), y: Math.floor( Math.random()*7 )};
        }
        // slot logic!
        visible_grid[pos.y][pos.x] = grid[pos.y][pos.x];
        rewards[grid[pos.y][pos.x]] = 1;
        this.setAction( 'message', `${user} rolled the slots! (Costed 20 credits)\nMaze Slots - Let the Journey Begin!\n${visible_grid.map( row => row.join( '' ) ).join( '\n' )}\n${this.results( wins ).setsString}` );
        this.setAction( 'messageId', `lottery-${uuid}` );
        loop:
        while ( true ) { // look around and collect fruit till you hit a deadend
            const dirs = _.shuffle( [{dx: 0, dy: 1}, {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: -1, dy: 0}] );
            while ( true ) { // try each of four directions
                const chosen = dirs.pop();
                const [x, y] = [( chosen.dx + pos.x + 11 )%11, ( chosen.dy + pos.y + 7 )%7];
                if ( grid[y][x] !== visible_grid[y][x] ) {
                    if ( grid[y][x] === ':white_square_button:' ) {
                        visible_grid[y][x] = grid[y][x];
                        break;
                    }
                    pos = {x, y};
                    const sign = grid[y][x];
                    visible_grid[y][x] = sign;
                    rewards[sign] = _.get( rewards, sign, 0 ) + 1;
                    if ( rewards[sign] %3 === 0 ) {
                        wins[sign] = _.get( wins, sign, 0 ) + 1;
                    }
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
            this.setAction( 'message', `${user} rolled the slots! (Costed 20 credits)\nMaze Slots - Let the Journey Begin!\n${visible_grid.map( row => row.join( '' ) ).join( '\n' )}\n${this.results( wins ).setsString}` );
            this.setAction( 'editId', `lottery-${uuid}` );
        }
        let { winnings, deerWins, setsString } = this.results( wins );
        if ( winnings < 0 && this.hasHolyMantle( id ) ) {
            this.queueAction();
            this.setAction( ACTIONS.MESSAGE, `${user}'s Holy mantle might trigger, but maze poop is extra strong. its a 50-50 chance!!!` );
            if ( Math.random() > 0.5 ) {
                deerWins *= -1;
                winnings *= -1;
                this.queueAction();
                this.setAction( ACTIONS.MESSAGE, `${user}'s Holy mantle triggered! ${user} is immune to poop!` );
            } else {
                this.queueAction();
                this.setAction( ACTIONS.MESSAGE, `No Dice! ${user} is not immune to poop today :(` );
            }
        }
        this.queueAction();
        this.setAction( 'message', `${user} rolled the slots! (Costed 20 credits)\nMaze Slots - Let the Journey Begin!\n${visible_grid.map( row => row.join( '' ) ).join( '\n' )}\nYou hit a dead end! **Game Over**.\n${setsString}\nTotal winnings are: **${winnings}**` );
        this.setAction( 'editId', `lottery-${uuid}` );
        // track stats
        _.set( this.json, `${id}.maze.longest_streak`, Math.max( _.get( this.json, `${id}.maze.longest_streak`, 0 ), streak ) );
        _.set( this.json, `${id}.maze.best`, Math.max( _.get( this.json, `${id}.maze.best`, 0 ), winnings ) );
        _.set( this.json, `${id}.maze.winnings`, _.get( this.json, `${id}.maze.winnings`, 0 ) + winnings );
        _.set( this.json, `${id}.maze.attempts`, _.get( this.json, `${id}.maze.attempts`, 0 ) + 1 );
        this.saveJSON();
        // add winnings
        bank.addAmount( id, winnings );
        // buck rolls
        if ( deerWins ) {
            this.queueAction();
            this.setAction( 'delay', 3 );
            for ( let i = 0; i < deerWins; i+=1 ) {
                this.buckSlots( user, id );
            }
            totalDelay += 3 + deerWins;
        }
        // make people wait their turn
        this.offLimitsFor( totalDelay );
    }

    // HELPERS

    buckSlots( user, id ) {
        const bag = ['eight', 'seven', 'one', 'buck', 'bee', 'scary', 'girl', 'kiwi'];
        const roll = [_.sample( bag ), _.sample( bag ), _.sample( bag )];

        let winnings = 0;
        let cuties = false; // assume false but set true
        let won = true; // assume true but set false

        let strNum = '';
        let resultStr = '';
        let giveVal;
        switch ( roll.join( ',' ) ) {
        case 'eight,seven,one':
            _.set( this.json, `${id}.buck.wins`, _.get( this.json, `${id}.buck.wins`, 0 ) + 1 );
            winnings = 871;
            resultStr = 'Huge lotto win! You won a great 871 credits!';
            break;
        case 'seven,seven,seven':
            _.set( this.json, `${id}.buck.wins`, _.get( this.json, `${id}.buck.wins`, 0 ) + 1 );
            winnings = 777;
            resultStr = 'Big lotto win! You won a nice 777 credits!';
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
            winnings = -giveVal;
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
            resultStr = 'Nice win! 3 buck bucks awarded.';
            this.setAction( 'audioFile', 'isitkewe' );
            break;
        default:
            won = false;
            // consolation prizes
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
        const fileName = this.createImage( roll );

        this.queueAction();
        this.setAction( 'image', fileName );
        this.setAction( 'delay', 1 );
        this.setAction( 'message', `**${user}**'s roll: ${resultStr}` );

        // cutie rampage
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

        if ( won ) {
            this.queueAction();
            this.setAction( ACTIONS.MESSAGE_USER_ID, BUCKS.COLTSU );
            this.setAction( ACTIONS.MESSAGE, `**${user}**'s roll: ${resultStr}` );
        }

        _.set( this.json, `${id}.buck.winnings`, _.get( this.json, `${id}.buck.winnings`, 0 ) + winnings );
        _.set( this.json, `${id}.buck.attempts`, _.get( this.json, `${id}.buck.attempts`, 0 ) + 1 );
        this.saveJSON();
        bank.addAmount( id, winnings );
    }

    // HELPERS

    createImage( roll ) {
        const image = gm( 'images/leftbrace.jpg' );
        roll.forEach( ( elem ) => {
            image.append( `images/${elem}.jpg`, true );
        } );
        image.append( 'images/rightbrace.jpg', true );
        const fileName = tmp.tmpNameSync() + '.jpg';
        image.write( fileName, () => {} );

        return fileName;
    }

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

    canEnter( metaInfo, type, cost ) {
        const user = metaInfo.author;
        const id = metaInfo.authorId;
        if ( metaInfo.channelId !== CONFIG_DEFAULTS.MAIN_CHANNEL ) {
            this.setAction( 'message', 'Please make your slot rolls public.' );
            return false;
        }
        if ( this.isOffLimits() ) {
            this.setAction( 'message', `**${user}**, Please wait your turn.` );
            return false;
        }
        if ( _.get( this.json, `${id}.${type}.freeRolls`, 0 ) > 0 ) {
            this.json[id][type].freeRolls -= 1;
            this.setAction( 'message', `**${user}** used their free roll. (${this.json[id][type].freeRolls} left)` );
            this.queueAction();
            return true;
        }
        if ( !bank.payAmount( id, cost ) ) {
            this.setAction( 'message', `Sorry **${user}**, but this costs **${cost}** credit(s). You don't have enough.` );
            return false;
        }
        return true;
    }

    hasHolyMantle( id ) {
        return id === BUCKS.GINGE;
    }

    results( wins, overrules ) {
        if ( !overrules ) {
            overrules = [];
        }
        let setsString = 'Sets:';
        let winnings = 0;
        let deerWins = 0;
        let multiply = 1;
        const rules = SIGNS;
        overrules.forEach( newRule => {
            const idx = rules.findIndex( rule => rule.emote === newRule.emote );
            rules[idx] = newRule;
        } );
        rules.forEach( ( r ) => {
            if ( wins[r.emote] ) {
                const w = wins[r.emote];
                if ( r.special ) {
                    if ( r.emote === ':deer:' ) {
                        deerWins += w;
                    }
                    setsString += `\n${_.repeat( `${r.emote}`, 3 * w )}  Reward: ${r.special}`;
                }
                if ( typeof r.multiply !== 'undefined' ) {
                    multiply *= r.multiply**w;
                    setsString += `\n${_.repeat( `${r.emote}`, 3 * w )}  Reward: ${r.multiply}x rewards`;
                }
                if ( r.value ) {
                    winnings += r.value*w;
                    setsString += `\n${_.repeat( `${r.emote}`, 3 * w )}  Reward: ${r.value}`;
                }
            }
        } );
        if ( winnings === 0 && multiply !== 1 ) {
            winnings = 11;
        }
        winnings *= multiply;
        deerWins *= multiply;
        setsString = setsString.length<10?'':setsString;
        return {winnings, deerWins, setsString};
    }

    offLimitsFor( seconds ) {
        this.waitUntil = new Date().getTime() + 1000*seconds;
    }

    isOffLimits() {
        return new Date().getTime() < this.waitUntil;
    }

    useLodashInContext() {
        // should ONLY be run in test environments!
        _ = _.runInContext();
    }
}

module.exports = { lottery: new Lottery() };
