const { BaseSlotMachine } = require( "./base" )
const _ = require("lodash")
const { bank } = require("../bank");

const REG_SIGNS = [
    {grid_amount: 35, emote: ':kiwi:',     value: 200},
    {grid_amount: 40, emote: ':cherries:',  value: 100},
    {grid_amount: 45, emote: ':tangerine:', value: 50},
    {grid_amount: 50, emote: ':lemon:',  value: 25},
    {grid_amount: 20, emote: ':deer:', special: 'Bonus Buck Roll'},
    {grid_amount: 1, emote: ':poop:',  value: -10},
];

const CURSED_SIGNS = [
    {grid_amount: 125, emote: ':peach:',  value: 1000},
    {grid_amount: 875, emote: ':poop:',  value: -10},
];

const POOP_SIGNS = [
    {grid_amount: 1000, emote: ':poop:',  value: -10},
];

const PEANUT_SIGNS = [
    {grid_amount: 100, emote: ':peanuts:', value: 1},
];

const RANDOM_SIGNS = [
    {grid_amount: 30, emote: ':burger:',  value: 2000},
    {grid_amount: 55, emote: ':peach:',  value: 1000},
    {grid_amount: 70, emote: ':pineapple:',  value: 500},
    {grid_amount: 80, emote: ':banana:',  value: 69},
    {grid_amount: 100, emote: ':kiwi:',     value: 200},
    {grid_amount: 100, emote: ':cherries:',  value: 100},
    {grid_amount: 100, emote: ':tangerine:', value: 50},
    {grid_amount: 100, emote: ':lemon:',  value: 25},
    {grid_amount: 100, emote: ':melon:',  value: 10},
    {grid_amount: 100, emote: ':peanuts:',  value: 1},
    {grid_amount: 100, emote: ':deer:', special: 'Bonus Buck Roll'},
    {grid_amount: 100, emote: ':poop:',  value: -10},
];

class BigGridSlotMachine extends BaseSlotMachine {

    roll(user, id) {
        let SIGNS = REG_SIGNS
        let TIMER = 30
        let INSTANT = false

        const mode_selector = _.random();
        if (mode_selector < 0.4) {
            mode="REGULAR"
        } else if(mode_selector < 0.5) {
            mode="SLOW"
            TIMER=90
        } else if(mode_selector < 0.7) {
            mode="LEMONS"
        } else if(mode_selector < 0.75) {
            mode="PEANUTS"
            SIGNS=PEANUT_SIGNS
            INSTANT = true
        } else if(mode_selector < 0.80) {
            mode="CURSED"
            SIGNS=CURSED_SIGNS
        } else if(mode_selector < 0.99) {
            mode="RANDOM"
            SIGNS=RANDOM_SIGNS
        } else {
            mode="POOP"
            SIGNS=POOP_SIGNS
            INSTANT = true
        }


        const bag = [];
        SIGNS.forEach( ( sign ) => {
            bag.push( ...Array( sign.grid_amount ).fill( sign.emote ) );
        } );
        let grid = _.chunk( Array( 81 ), 9 );
        grid = grid.map( ( row ) => row.map( () => _.sample( bag ) ) );
        const visible_grid = _.chunk( Array( 81 ).fill( ':black_large_square:' ), 9 );

        for ( let x = 1; x < 9; x++ ) {
            if (_.random() < 0.6) {
                grid[y][x] = grid[y][x-1]
            }
        }

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

        bank.addAmount(id, -winnings)
        setTimeout(() => {
            bank.addAmount(id, winnings);
        }, (frames.length-1)*TIMER*1000 );

        if (INSTANT) {
            frames = [frames[-1]]
        }

        return {
            winnings,
            buckrolls: deerWins,
            frames,
            frameDelay: TIMER
        }
    }

    cost() {
        return 1000;
    }
}

module.exports = new BigGridSlotMachine()