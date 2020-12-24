const { BaseSlotMachine } = require( "./base" )
const _ = require("lodash")
const { statistics } = require( '../statistics' );

const SIGNS = [
    {grid_amount: 5, maze_count: 3,  slow_count: 35, emote: ':kiwi:',     value: 200},
    {grid_amount: 6, maze_count: 3,  slow_count: 40,   emote: ':cherries:',  value: 100},
    {grid_amount: 8, maze_count: 3,  slow_count: 45,   emote: ':tangerine:', value: 50},
    {grid_amount: 11, maze_count: 4,  slow_count: 50,   emote: ':lemon:',     value: 25},
    {grid_amount: 11, maze_count: 3,  slow_count: 0,   emote: ':melon:',     value: 10},
    {grid_amount: 11, maze_count: 3,  slow_count: 0,   emote: ':strawberry:',value: 5},
    {grid_amount: 9, maze_count: 6,  slow_count: 20,   emote: ':deer:', special: 'Bonus Buck Roll'},
    {grid_amount: 10, maze_count: 3,  slow_count: 1,   emote: ':poop:',  multiply: -1},
    {grid_amount: 0, maze_count: 4,  slow_count: 0,  emote: ':two:',   multiply: 2},
    {grid_amount: 0, maze_count: 3,  slow_count: 0,  emote: ':three:',   multiply: 3},
    {grid_amount: 0, maze_count: 3,  slow_count: 0,   emote: ':five:', multiply: 5},
    {grid_amount: 0, maze_count: 3,  slow_count: 0,   emote: ':seven:', multiply: 7},
];

class MazeSlotMachine extends BaseSlotMachine {

    roll(user, id) {

        // setup
        const rewards = {};
        const wins = {};
        let streak = 1;
        let frames = [];
        // put together the board1
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
            grid[swap_pos.y][swap_pos.x] = ':white_square_button:';
        }
        // slot logic!
        visible_grid[pos.y][pos.x] = grid[pos.y][pos.x];
        frames.push(this.newFrame(user, visible_grid, "", 0))
        rewards[grid[pos.y][pos.x]] = 1;
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
            let temp_results = this.results( wins );
            frames.push(this.newFrame(user, visible_grid, temp_results.setsString, temp_results.winnings))
        }
        let { winnings, deerWins, setsString } = this.results( wins );

        // holy mantle 50-50 chance

        statistics.storage.apply(`lottery_longest_mslots_streak.${id}`, streak, streak, Math.max);
        frames.push(this.newFrame(user, visible_grid, setsString, winnings,true))

        return {
            winnings,
            buckrolls: deerWins,
            frames,
            frameDelay: 1.7,
        }
    }

    newFrame(user, visible_grid, setsString, winnings, dead=false) {
        return `${user} rolled the slots! (Costed 20 credits)
Maze Slots - Let the Journey Begin!
${visible_grid.map( row => row.join( '' ) ).join( '\n' )}
${setsString}
${dead?`You hit a dead end! **Game Over**
Total winnings are: **${winnings}**`:""}`
    }

    cost() {
        return 20;
    }

    results( wins ) {
        let setsString = 'Sets:';
        let winnings = 0;
        let deerWins = 0;
        let multiply = 1;
        const rules = SIGNS;
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
}

module.exports = new MazeSlotMachine()