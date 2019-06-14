const gm = require( 'gm' );
const tmp = require( 'tmp' );
let _ = require( 'lodash' );
const uuidv4 = require( 'uuidv4' );
const { Component } = require( '../component' );
const { BUCKS, CONFIG_DEFAULTS, ACTIONS, PERMISSION_LEVELS } = require( '../constants' );
const { bank } = require( './bank' );
const { inventory } = require( './inventory' );
const { pictures } = require( './pictures' );

const ID = 'lottery';

const SIGNS = [
    {grid_amount: 5, maze_count: 3,  slow_count: 35, emote: ':kiwi:',     value: 200},
    {grid_amount: 6, maze_count: 3,  slow_count: 40,   emote: ':cherries:',  value: 100},
    {grid_amount: 8, maze_count: 3,  slow_count: 45,   emote: ':tangerine:', value: 50},
    {grid_amount: 11, maze_count: 4,  slow_count: 50,   emote: ':lemon:',     value: 25},
    {grid_amount: 11, maze_count: 3,  slow_count: 0,   emote: ':melon:',     value: 10},
    {grid_amount: 11, maze_count: 4,  slow_count: 0,   emote: ':strawberry:',value: 5},
    {grid_amount: 9, maze_count: 7,  slow_count: 20,   emote: ':deer:', special: 'Bonus Buck Roll'},
    {grid_amount: 10, maze_count: 3,  slow_count: 1,   emote: ':poop:',  multiply: -1},
    {grid_amount: 0, maze_count: 4,  slow_count: 0,  emote: ':two:',   multiply: 2},
    {grid_amount: 0, maze_count: 3,  slow_count: 0,  emote: ':three:',   multiply: 3},
    {grid_amount: 0, maze_count: 3,  slow_count: 0,   emote: ':five:', multiply: 5},
    {grid_amount: 0, maze_count: 3,  slow_count: 0,   emote: ':seven:', multiply: 7},
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
        this.addCommand( /^-slots big ?[gG]rid$/, this.slowGridSlots );
        this.addCommand( /^-bgslots$/, this.slowGridSlots );
        this.addCommand( /^-slots pig$/, this.pigSlots );
        this.addCommand( /^-slots pig look$/, this.pigLook );
        this.addCommand( /^-pslots$/, this.pigSlots );
        this.addCommand( /^-pslots look$/, this.pigLook );
        this.addCommand( /^-plook$/, this.pigLook );
        this.addCommand( /^-slots buck$/, this.bslots );
        this.addCommand( /^-bslots$/, this.bslots );
        this.addCommand( /^#freeroll (\d+) (.*)$/, this.giveRolls );
        this.addCommand( /^#freeroll (.*)$/, ( type, metaInfo ) => this.giveRolls( 1, type, metaInfo ) );
        this.addCommand( /^-freerolls$/ , this.countRolls );
        this.addCommand( /^-privacy on$/ , this.privacyOn );
        this.addCommand( /^-privacy off$/ , this.privacyOff );
        this.addCommand( /^-use maze slots gift card$/, this.usemgc) ;
        this.addCommand( /^-use grid slots gift card$/, this.useggc) ;

        this.waitUntil = new Date().getTime();
    }

    scheduledEvent() {
        Object.keys(BUCKS).forEach(k => {
            //if (this.get(`${BUCKS[k]}.grid.discount`, 0) < 5) {
            //    this.update(`${BUCKS[k]}.grid.discount`, 1);
            //    _.set(this.json, '`${BUCKS[k]}.grid.discount`', _.get(this.json, `${BUCKS[k]}.grid.discount`, 0) + 1);
            //}
            //if (this.get(`${BUCKS[k]}.maze.discount`, 0) < 20) {
            //    _.set(this.json, '`${BUCKS[k]}.maze.discount`', _.get(this.json, `${BUCKS[k]}.maze.discount`, 0) + 1);
            //}
        });
        this.update('pigBalance', 10);
    }

    privacyOn(mi) {
        _.set(this.json, `${mi.authorId}.privacy`, true);
        this.setAction('message', `Option set.`);
    }
    privacyOff(mi) {
        _.set( this.json, `${mi.authorId}.privacy`, false );
        this.setAction( 'message', `Option set.` );
    }

    usemgc(mi) {
        const id = mi.authorId;
        if ( inventory.has(id, 'mazeslotsgiftcard')) {
            this.setAction( ACTIONS.MESSAGE, `You gained a free roll`);
            _.set(this.json, `${id}.maze.freeRolls`, _.get(this.json, `${id}.maze.freeRolls`, 0) -1 )
            inventory.loseItem(id, 'mazeslotsgiftcard')
        } else {
            this.setAction( ACTIONS.MESSAGE, `You don't have that`);
        }
    }

    useggc(mi) {
        const id = mi.authorId;
        if ( inventory.has(id, 'gridslotsgiftcard')) {
            this.setAction( ACTIONS.MESSAGE, `You gained a free roll`);
            _.set(this.json, `${id}.grid.freeRolls`, _.get(this.json, `${id}.grid.freeRolls`, 0) -1 )
            inventory.loseItem(id, 'gridslotsgiftcard')
        } else {
            this.setAction( ACTIONS.MESSAGE, `You don't have that`);
        }
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
        const gridDis = _.get( this.json, `${id}.grid.discount`, 0 );
        const mazeDis = _.get( this.json, `${id}.maze.discount`, 0 );
        this.setAction( ACTIONS.MESSAGE, `**${user}**
${coins} free coin roll${coins===1?'':'s'}
${grids} free grid roll${grids===1?'':'s'}
${mazes} free maze roll${mazes===1?'':'s'}
${bucks} free buck roll${bucks===1?'':'s'}
${gridDis || mazeDis ?'Current discounts:':''}
${gridDis?`grid slots: ${gridDis}`:''}
${mazeDis?`maze slots: ${mazeDis}`:''}`);
    }

    giveRolls( count, type, metaInfo ) {
        if ( PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            Object.values( BUCKS ).forEach( id => {
                _.set( this.json, `${id}.${type}.freeRolls`, _.get( this.json, `${id}.${type}.freeRolls`, 0 ) + Number( count ) );
            } );
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
        //this.queueAction();
        //this.setAction( ACTIONS.DELAY, 0.5 );
        //this.setAction( ACTIONS.IMAGE, 'charts/mazezoom.png' );
        //this.queueAction();
        //this.setAction( ACTIONS.IMAGE, 'charts/mazebar.png' );
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
        //this.queueAction();
        //this.setAction( ACTIONS.DELAY, 0.5 );
        //this.setAction( ACTIONS.IMAGE, 'charts/gridzoom.png' );
        //this.queueAction();
        //this.setAction( ACTIONS.IMAGE, 'charts/gridbar.png' );
    }

    coinOdds() {
        this.setAction( ACTIONS.MESSAGE, 'Each :moneybag: gives one coin. The coinflip is weighted 0.495% chance to fail.\nThe value of one roll is **$0.96**' );
        this.setAction( ACTIONS.IMAGE, 'charts/coin.png' );
        //this.queueAction();
        //this.setAction( ACTIONS.DELAY, 0.5 );
        //this.setAction( ACTIONS.IMAGE, 'charts/coinbar.png' );
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
        let chainStr = '';
        for ( ; !chainStr.includes( ':x:' ); ) {
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
        // reward winnings
        bank.addAmount( id, chain );

        if (!_.get( this.json, `${id}.privacy`, false)) {
            this.queueAction();
            this.setAction( 'editId', `lottery-${uuid}` );
            this.setAction( 'message', `**${user}** rolled the slots! (Costed 1 credit)\nCoin Slots - Keep flipping till you lose!\n${chainStr}\nReward: ${chain}
Your new balance is ${bank.balance(id)}` );
        }
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
        // add winnings
        bank.addAmount( id, winnings );

        if (!_.get( this.json, `${id}.privacy`, false)) {
            this.setAction( 'message', `**${user}** rolled the slots! (Costed 5 credits)\nGrid Slots - 8 possible rows!
**[** ${grid[0][0]}${grid[1][0]}${grid[2][0]} **]**
**[** ${grid[0][1]}${grid[1][1]}${grid[2][1]} **]**
**[** ${grid[0][2]}${grid[1][2]}${grid[2][2]} **]**
Reward: **${winnings}**${deerWins?`\nYou've also won ${deerWins} rolls of Buck Slots! They will happen in 3 seconds.`:''}
Your new balance is ${bank.balance(id)}` );
        }
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
            const swap_pos = { x: Math.floor( Math.random()*11 ), y: Math.floor( Math.random()*7 )};
            grid[pos.y][pos.x] = grid[swap_pos.y][swap_pos.x];
            grid[swap_pos.y][swap_pos.x] = ':white_square_button:'
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
        // add winnings
        bank.addAmount( id, winnings );

        if (!_.get( this.json, `${id}.privacy`, false)) {
            this.setAction( 'message', `${user} rolled the slots! (Costed 20 credits)\nMaze Slots - Let the Journey Begin!\n${visible_grid.map( row => row.join( '' ) ).join( '\n' )}\nYou hit a dead end! **Game Over**.\n${setsString}\nTotal winnings are: **${winnings}**
Your new balance is ${bank.balance(id)}` );
        }
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

    slowGridSlots( metaInfo ) {
        // setup
        const user = metaInfo.author;
        const id = metaInfo.authorId;
        const uuid = uuidv4();
        if ( !this.canEnter( metaInfo, 'slowgrid', 1000 ) ) {
            return;
        }
        if ( this.hasHolyMantle( id ) && Math.random() > 0.99 ) {
            this.setAction( 'message', `Holy Mantle triggered. **${user}** doesn't have to pay this time.` );
            this.queueAction();
            bank.addAmount( id, 1000 );
        }
        const bag = [];
        SIGNS.forEach( ( sign ) => {
            bag.push( ...Array( sign.slow_count ).fill( sign.emote ) );
        } );
        let grid = _.chunk( Array( 81 ), 9 );
        const visible_grid = _.chunk( Array( 81 ).fill( ':black_large_square:' ), 9 );
        grid = grid.map( ( row ) => row.map( () => _.sample( bag ) ) );
        // check how many wins

        let winnings = 0;
        let deerWins = 0;
        let best = 0;
        let bestString = '';
        // declare

        const sguuid = uuidv4();
        this.setAction( 'message', `**${user}** rolled the slots! (Costed 1000 credits)\nBig Grid Slots - Go make a snack, you have time.
${visible_grid.map(row => row.join('')).join('\n')}
Reward: **${winnings}**${deerWins?`\nYou've also won ${deerWins} rolls of Buck Slots! They will happen after.`:''}
${best?`Best Row: ${bestString}`:''}` );
        this.setAction( 'messageId', sguuid);

        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const icon = grid[y][x];
                visible_grid[y][x] = icon;
                let length = 0;
                let value = 0;
                for (let y2 = y; y2 >= 0; y2--) {
                    if (grid[y2][x] !== icon)
                        break;
                    length += 1;
                }
                if (length >= 3) {
                    value = SIGNS.find((item) => item.emote === icon).value * (2**(length-3));
                    if (icon === ':deer:') {
                        // buck win
                        deerWins += 2**(length-3);
                        value = 0;
                    }
                }
                if (length === 3) {
                    winnings += value
                }
                else if (length > 3) {
                    winnings += value/2
                }
                if (value > best) {
                    best = value;
                    bestString = _.repeat(icon,length) + ` worth **${best}**`
                }
                length = 0;
                value = 0;
                for (let x2 = x; x2 >= 0; x2--) {
                    if (grid[y][x2] !== icon)
                        break;
                    length += 1;
                }
                if (length >= 3) {
                    value = SIGNS.find((item) => item.emote === icon).value * (2**(length-3));
                    if (icon === ':deer:') {
                        // buck win
                        deerWins += 2**(length-3);
                        value = 0;
                    }
                }
                if (length === 3) {
                    winnings += value
                }
                else if (length > 3) {
                    winnings += value/2
                }
                if (value > best) {
                    best = value;
                    bestString = _.repeat(icon,length) + ` worth **${best}**`
                }
                length = 0;
                value = 0;
                for (let xy2 = [x, y]; xy2[0] >= 0 && xy2[1] >=0;) {
                    if (grid[xy2[1]][xy2[0]] !== icon)
                        break;
                    length += 1;
                    xy2[0] -= 1;
                    xy2[1] -= 1;
                }
                if (length >= 3) {
                    value = SIGNS.find((item) => item.emote === icon).value * (2**(length-3));
                    if (icon === ':deer:') {
                        // buck win
                        deerWins += 2**(length-3);
                        value = 0;
                    }
                }
                if (length === 3) {
                    winnings += value
                }
                else if (length > 3) {
                    winnings += value/2
                }
                if (value > best) {
                    best = value;
                    bestString = _.repeat(icon,length) + ` worth **${best}**`
                }
                length = 0;
                value = 0;
                for (let xy2 = [x, y]; xy2[0] < 9 && xy2[1] >=0;) {
                    if (grid[xy2[1]][xy2[0]] !== icon)
                        break;
                    length += 1;
                    xy2[0] += 1;
                    xy2[1] -= 1;
                }
                if (length >= 3) {
                    value = SIGNS.find((item) => item.emote === icon).value * (2**(length-3));
                    if (icon === ':deer:') {
                        // buck win
                        deerWins += 2**(length-3);
                        value = 0;
                    }
                }
                if (length === 3) {
                    winnings += value
                }
                else if (length > 3) {
                    winnings += value/2
                }
                if (value > best) {
                    best = value;
                    bestString = _.repeat(icon,length) + ` worth **${best}**`
                }

                this.queueAction();
                this.setAction( ACTIONS.DELAY, 15 );
                this.setAction( ACTIONS.EDIT_ID, sguuid);
                this.setAction( ACTIONS.MESSAGE, `**${user}** rolled the slots! (Costed 1000 credits)\nBig Grid Slots - Go make a snack, you have time.
${visible_grid.map(row => row.join('')).join('\n')}
Reward: **${winnings}**${deerWins?`\nYou've also won ${deerWins} rolls of Buck Slots! They will happen after.`:''}
${best?`Best Row: ${bestString}`:''}` );
                // track stats
            }
        }


        let slowSlotsDelay = 15*81;
        // add winnings
        setTimeout(() => {
            bank.addAmount( id, winnings );
            _.set( this.json, `${id}.slow.best`, Math.max( _.get( this.json, `${id}.slow.best`, 0 ), winnings ) );
            _.set( this.json, `${id}.slow.winnings`, _.get( this.json, `${id}.slow.winnings`, 0 ) + winnings );
            _.set( this.json, `${id}.slow.attempts`, _.get( this.json, `${id}.slow.attempts`, 0 ) + 1 );
        }, slowSlotsDelay * 1000);
        // buck rolls
        if ( deerWins ) {
            this.queueAction();
            this.setAction( 'delay', 3 );
            for ( let i = 0; i < deerWins; i+=1 ) {
                this.buckSlots( user, id );
            }
            slowSlotsDelay += 3 + deerWins;
        }
        this.offLimitsFor(slowSlotsDelay)
    }


    pigSlots( metaInfo ) {
        // setup
        const user = metaInfo.author;
        const id = metaInfo.authorId;
        const uuid = uuidv4();
        if ( !this.canEnter( metaInfo, 'pig', 10 ) ) {
            return;
        }
        if ( this.hasHolyMantle( id ) && Math.random() > 0.99 ) {
            this.setAction( 'message', `Holy Mantle triggered. **${user}** doesn't have to pay this time.` );
            this.queueAction();
            bank.addAmount( id, 10 );
        }

        this.setAction( 'message', `**${user}** rolled the slots! (Costed 10 credits)\nWill your money break the bank?`);

        this.queueAction();
        this.setAction( ACTIONS.IMAGE_LINK, 'https://media1.tenor.com/images/83a1c344dc2f112ad93d373c726de4cb/tenor.gif');

        this.queueAction();
        this.setAction( ACTIONS.DELAY, 10 );

        let pigBalance = this.get('pigBalance', 50);
        let pigLevel = this.get('pigLevel', 1);
        let pigChance = this.get('pigChance', 0.10);
        pigChance *= 1 + (pigLevel-1)/4;

        if (Math.random() < pigChance) {
            // pig breaks
            this.setAction( 'message', `You won! **${user}** has earned \`${pigBalance+10}\` credits `);
            this.setAction( ACTIONS.IMAGE_LINK, 'https://s.hswstatic.com/gif/how-much-money-to-live-1.jpg');
            bank.addAmount( id, pigBalance+10);
            _.set( this.json, `${id}.pig.best`, Math.max( _.get( this.json, `${id}.pig.best`, 0 ), pigBalance+10 ) );
            _.set( this.json, `${id}.pig.winnings`, _.get( this.json, `${id}.pig.winnings`, 0 ) + pigBalance+10 );
            this.resetPig();
        } else {
            this.set('pigBalance', pigBalance+5);

            this.setAction( 'message', `Sorry! The bank didn't break, but the pig is now worth 5 more credits!`);

            if (pigLevel < 5) {
                if (Math.random() < pigChance*3+0.1) {
                    this.queueAction();
                    this.setAction( 'message', `The pig became more frail! It will break a little bit easier.`);
                    _.set(this.json, 'pigLevel', _.get(this.json, 'pigLevel', 1) + 1);
                    this.pigLook()
                }
            }
        }
        _.set( this.json, `${id}.pig.attempts`, _.get( this.json, `${id}.pig.attempts`, 0 ) + 1 );

        this.offLimitsFor(10)

        if (!_.get( this.json, `${id}.privacy`, false)) {
            this.queueAction();
            this.setAction( 'message', `Your new balance is ${bank.balance(id)}` );
        }
    }

    pigLook( ) {
        let pigLevel = this.get('pigLevel', 1);
        switch (pigLevel) {
            case 1:
                this.setAction( ACTIONS.IMAGE_LINK, 'https://cdn.discordapp.com/attachments/533736402085478410/586044845072580608/depositphotos_120976292-stock-photo-skinny-piggy-bank-icon.png');
                break;
            case 2:
                this.setAction( ACTIONS.IMAGE_LINK, 'https://cdn.discordapp.com/attachments/533736402085478410/586045158362054656/piggy-bank-970340_960_720.png');
                break;
            case 3:
                this.setAction( ACTIONS.IMAGE_LINK, 'https://cdn.discordapp.com/attachments/533736402085478410/586044939109007373/166142726.png');
                break;
            case 4:
                this.setAction( ACTIONS.IMAGE_LINK, 'https://cdn.discordapp.com/attachments/533736402085478410/586045055345885197/Piggy-Bank.png');
                break;
            case 5:
                this.setAction( ACTIONS.IMAGE_LINK, 'https://previews.123rf.com/images/vladru/vladru1702/vladru170200008/71442406-fat-piggy-bank-and-coin-3d-illustration.jpg');
                break;
        }
    }
    // HELPERS

    resetPig() {
        this.set('pigLevel', 1);
        let chance = Math.random()/20 + 0.005;
        let balance = Math.floor((5/chance) *.6);
        this.set('pigBalance', balance);
        this.set('pigChance', chance);
    }

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
        let discount = _.get( this.json, `${id}.${type}.discount`, 0);
        cost -= discount;
        if ( !bank.payAmount( id, cost ) ) {
            this.setAction( 'message', `Sorry **${user}**, but this costs **${cost}** credit(s). You don't have enough.` );
            return false;
        }
        this.set( `${id}.${type}.discount`, 0);
        return true;
    }

    hasHolyMantle( id ) {
        return inventory.has(id, 'holyMantle');
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
