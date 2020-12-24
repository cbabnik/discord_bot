const { BaseSlotMachine } = require( "./base" )
const _ = require("lodash")


const SIGNS = [
    {grid_amount: 6, emote: ':kiwi:',     value: 200},
    {grid_amount: 8, emote: ':cherries:',  value: 100},
    {grid_amount: 10, emote: ':tangerine:', value: 50},
    {grid_amount: 12, emote: ':lemon:',     value: 25},
    {grid_amount: 14, emote: ':melon:',     value: 10},
    {grid_amount: 10, emote: ':strawberry:',value: 5},
    {grid_amount: 16, emote: ':deer:', special: 'Bonus Buck Roll'},
    {grid_amount: 6, emote: ':poop:',  value: -10},
];

const VALID_LINES = [
    [{x:0,y:0},{x:0,y:1},{x:0,y:2}],
    [{x:1,y:0},{x:1,y:1},{x:1,y:2}],
    [{x:2,y:0},{x:2,y:1},{x:2,y:2}],
    [{x:0,y:0},{x:1,y:1},{x:2,y:2}],
    [{x:2,y:0},{x:1,y:1},{x:0,y:2}],
    [{x:0,y:0},{x:1,y:0},{x:2,y:0}],
    [{x:0,y:1},{x:1,y:1},{x:2,y:1}],
    [{x:0,y:2},{x:1,y:2},{x:2,y:2}]
];

class GridSlotMachine extends BaseSlotMachine {

    roll(user) {
        const bag = [];
        SIGNS.forEach( ( sign ) => {
            bag.push( ...Array( sign.grid_amount ).fill( sign.emote ) );
        } );
        let grid = [[0,0,0],[0,0,0],[0,0,0]];
        grid = grid.map( ( row ) => row.map( () => _.sample( bag ) ) );
        // check how many wins


        const wins = {};
        VALID_LINES.forEach( ( line ) => {
            const a = grid[line[0].x][line[0].y];
            const b = grid[line[1].x][line[1].y];
            const c = grid[line[2].x][line[2].y];
            if ( a === b && b === c ) {
                wins[a] = _.get( wins, a, 0 ) + 1;
            }
        } );
        const r = this.results( wins );

        // holy mantle cures poop here

        const winnings = r.winnings;
        const deerWins = r.deerWins;
        const frame = `**${user}** rolled the slots! (Costed 5 credits)\nGrid Slots - 8 possible rows!
**[** ${grid[0][0]}${grid[1][0]}${grid[2][0]} **]**
**[** ${grid[0][1]}${grid[1][1]}${grid[2][1]} **]**
**[** ${grid[0][2]}${grid[1][2]}${grid[2][2]} **]**
Reward: **${winnings}**`;

        return {
            winnings,
            buckrolls: deerWins,
            frames: [
                frame
            ]
        }
    }

    cost() {
        return 5;
    }

    results( wins ) {
        let winnings = 0;
        let deerWins = 0;
        const rules = SIGNS;
        rules.forEach( ( r ) => {
            if ( wins[r.emote] ) {
                const w = wins[r.emote];
                if ( r.special ) {
                    if ( r.emote === ':deer:' )
                        deerWins += w;
                }
                if ( r.value )
                    winnings += r.value*w;
            }
        } );
        return {winnings, deerWins};
    }
}

module.exports = new GridSlotMachine()