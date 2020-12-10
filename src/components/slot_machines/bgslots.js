const { BaseSlotMachine } = require( "./base" )
const _ = require("lodash")


const SIGNS = [
    {grid_amount: 35, emote: ':kiwi:',     value: 200},
    {grid_amount: 40, emote: ':cherries:',  value: 100},
    {grid_amount: 45, emote: ':tangerine:', value: 50},
    {grid_amount: 50, emote: ':lemon:',     value: 25},
    {grid_amount: 20, emote: ':deer:', special: 'Bonus Buck Roll'},
    {grid_amount: 1, emote: ':poop:',  value: -10},
];

class BigGridSlotMachine extends BaseSlotMachine {

    roll(user, id) {
        const bag = [];
        SIGNS.forEach( ( sign ) => {
            bag.push( ...Array( sign.grid_amount ).fill( sign.emote ) );
        } );
        let grid = _.chunk( Array( 81 ), 9 );
        grid = grid.map( ( row ) => row.map( () => _.sample( bag ) ) );
        const visible_grid = _.chunk( Array( 81 ).fill( ':black_large_square:' ), 9 );

        let winnings = 0;
        let deerWins = 0;
        let best = 0;
        let bestString = '';
        let frames = []

        frames.push(`**${user}** rolled the slots! (Costed 1000 credits)\nBig Grid Slots - Go make a snack, you have time.
${visible_grid.map( row => row.join( '' ) ).join( '\n' )}
Reward: **${winnings}**${deerWins?`\nYou've also won ${deerWins} rolls of Buck Slots! They will happen after.`:''}
${best?`Best Row: ${bestString}`:''}`)

        for ( let y = 0; y < 9; y++ ) {
            for ( let x = 0; x < 9; x++ ) {
                const icon = grid[y][x];
                visible_grid[y][x] = icon;
                let length = 0;
                let value = 0;
                for ( let y2 = y; y2 >= 0; y2-- ) {
                    if ( grid[y2][x] !== icon ) {
                        break;
                    }
                    length += 1;
                }
                if ( length >= 3 ) {
                    value = SIGNS.find( ( item ) => item.emote === icon ).value * ( 2**( length-3 ) );
                    if ( icon === ':deer:' ) {
                        // buck win
                        deerWins += 2**( length-3 );
                        value = 0;
                    }
                }
                if ( length === 3 ) {
                    winnings += value;
                } else if ( length > 3 ) {
                    winnings += value/2;
                }
                if ( value > best ) {
                    best = value;
                    bestString = _.repeat( icon,length ) + ` worth **${best}**`;
                }
                length = 0;
                value = 0;
                for ( let x2 = x; x2 >= 0; x2-- ) {
                    if ( grid[y][x2] !== icon ) {
                        break;
                    }
                    length += 1;
                }
                if ( length >= 3 ) {
                    value = SIGNS.find( ( item ) => item.emote === icon ).value * ( 2**( length-3 ) );
                    if ( icon === ':deer:' ) {
                        // buck win
                        deerWins += 2**( length-3 );
                        value = 0;
                    }
                }
                if ( length === 3 ) {
                    winnings += value;
                } else if ( length > 3 ) {
                    winnings += value/2;
                }
                if ( value > best ) {
                    best = value;
                    bestString = _.repeat( icon,length ) + ` worth **${best}**`;
                }
                length = 0;
                value = 0;
                for ( let xy2 = [x, y]; xy2[0] >= 0 && xy2[1] >=0; ) {
                    if ( grid[xy2[1]][xy2[0]] !== icon ) {
                        break;
                    }
                    length += 1;
                    xy2[0] -= 1;
                    xy2[1] -= 1;
                }
                if ( length >= 3 ) {
                    value = SIGNS.find( ( item ) => item.emote === icon ).value * ( 2**( length-3 ) );
                    if ( icon === ':deer:' ) {
                        // buck win
                        deerWins += 2**( length-3 );
                        value = 0;
                    }
                }
                if ( length === 3 ) {
                    winnings += value;
                } else if ( length > 3 ) {
                    winnings += value/2;
                }
                if ( value > best ) {
                    best = value;
                    bestString = _.repeat( icon,length ) + ` worth **${best}**`;
                }
                length = 0;
                value = 0;
                for ( let xy2 = [x, y]; xy2[0] < 9 && xy2[1] >=0; ) {
                    if ( grid[xy2[1]][xy2[0]] !== icon ) {
                        break;
                    }
                    length += 1;
                    xy2[0] += 1;
                    xy2[1] -= 1;
                }
                if ( length >= 3 ) {
                    value = SIGNS.find( ( item ) => item.emote === icon ).value * ( 2**( length-3 ) );
                    if ( icon === ':deer:' ) {
                        // buck win
                        deerWins += 2**( length-3 );
                        value = 0;
                    }
                }
                if ( length === 3 ) {
                    winnings += value;
                } else if ( length > 3 ) {
                    winnings += value/2;
                }
                if ( value > best ) {
                    best = value;
                    bestString = _.repeat( icon,length ) + ` worth **${best}**`;
                }

                frames.push(`**${user}** rolled the slots! (Costed 1000 credits)\nBig Grid Slots - Go make a snack, you have time.
${visible_grid.map( row => row.join( '' ) ).join( '\n' )}
Reward: **${winnings}**${deerWins?`\nYou've also won ${deerWins} rolls of Buck Slots! They will happen after.`:''}
${best?`Best Row: ${bestString}`:''}`)
            }
        }

        return {
            winnings,
            buckrolls: deerWins,
            frames,
            frameDelay: 15
        }
    }

    cost() {
        return 1000;
    }
}

module.exports = new BigGridSlotMachine()