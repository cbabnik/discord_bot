const { Component } = require( '../component' );
const _ = require( 'lodash' );
const { PERMISSION_LEVELS, ACTIONS, CONFIG_DEFAULTS, BUCKS } = require( '../constants' );

const util = require( '../util' );
const ID = 'inventory';
//const { lottery } = require('./lottery');

const mantleEffects = [
    '\'s student loans have been absolved.',
    ' doesn\'t need to pay his parking tickets.',
    ' can tap your girlfriend.',
    ' doesn\'t have to pay alimony.',
    ' doesn\'t have to pay his bar tab.',
    '\'s criminal record has been wiped clean.',
    ' can eat the last nacho.',
    ' can negate poop\'s affect in slots.',
    ' gets to ban Coltsu from his own server.',
    ' can ignore the effects of \'lost child\'.',
    ' can tap your credit card for dinner.',
    ' can roll his car unscathed.',
    ' can make Bugs play CounterStrike.',
    ' can\'t be put on pwobation.',
    ' can\'t be made fun of.',
    ' is not the father.',
];

RELICS = {
    BURGER_CROWN: 'burgercrown',
    VIETNAM_WAR_HORN: 'vietnamwarhorn',
    BROKEN_TIMEPIECE: 'brokentimepiece',
    MIKOTOS_AFFECTION: 'mikoto',
    HOLY_MANTLE: 'holyMantle',
    EXCALIBUR: 'excalibur',
    IMMOBILITY_ORB: 'immobolityorb',
};

class Inventory extends Component {
    constructor() {
        super( ID );
        this.addCommand( /-[hH]oly[mM]antle$/, ( metaInfo ) => this.holyMantle( null, metaInfo ) ) ;
        this.addCommand( /-[hH]oly[mM]antle ?(\d+)/, this.holyMantle );
        this.addCommand( /^-inventory/, this.getInventory );
        this.addCommand( /^-use (.*)$/, this.useItem );
        this.addCommand( /^-[gG]ood ?[mM]orning ?[vV]ietnam$/, this.goodMorningVietnam );
        this.addCommand( /^-relics$/, this.seeRelics );
        this.addCommand( /^-gift ([^ ]+) (.*)$/, this.gift );
        this.addCommand( /^#gift ([^ ]+) (.*)$/, this.adminGift );

        if ( !this.get( 'relics.holymantle' ) ) {
            this.set( 'relics.holymantle', {owner: BUCKS.GINGE} );
            this.set( '227593217963589632.holymantle.count', 1 );
        }
        if ( !this.get( 'relics.vietnamwarhorn' ) ) {
            this.set( 'relics.vietnamwarhorn', {owner: BUCKS.XXCOWFACE} );
            this.set( '120350426779353088.vietnamwarhorn.count', 1 );
        }
        if ( !this.get( 'relics.mikoto' ) ) {
            this.set( 'relics.mikoto', {owner: BUCKS.BUCKBOT} );
        }
        if ( !this.get( 'relics.brokentimepiece' ) ) {
            this.set( 'relics.brokentimepiece', {owner: BUCKS.BUCKBOT} );
        }
        if ( !this.get( 'relics.excalibur' ) ) {
            this.set( 'relics.excalibur', {owner: BUCKS.BUCKBOT} );
        }
        if ( !this.get( 'relics.burgercrown' ) ) {
            this.set( 'relics.burgercrown', {owner: BUCKS.BUGSLINGER} );
            this.set( '106853033526247424.burgercrown.count', 1 );
        }
        if ( !this.get( 'relics.immobilityorb' ) ) {
            this.set( 'relics.immobilityorb', {owner: BUCKS.BUCKBOT} );
        }

        this.set( 'items', {
            burgercrown: {
                relic: true,
                unique: true,
                giftable: true,
                name: 'Burger Crown',
                description: 'Allows you to add burger pictures with -addBurger'
            },
            holymantle: {
                relic: true,
                giftable: true,
                name: 'Holy Mantle',
                description: 'Allows you to use -holyMantle and have misc lucky perks'
            },
            immobilityorb: {
                relic: true,
                unique: true,
                giftable: true,
                name: 'Immobility Orb',
                description: 'You\'re immune to being moved to different channels'
            },
            excalibur: {
                relic: true,
                unique: true,
                giftable: true,
                name: 'Excalibur',
                description: 'Makes you the strongest hero'
            },
            brokentimepiece: {
                relic: true,
                unique: true,
                giftable: true,
                name: 'Broken Timepiece',
                description: 'Do you hate waiting for slots?'
            },
            mikoto: {
                relic: true,
                unique: true,
                giftable: true,
                name: 'Mikoto\'s Affection',
                description: 'Looks like she finds you cute'
            },
            vietnamwarhorn: {
                relic: true,
                unique: true,
                giftable: true,
                name: 'Vietnam War Horn',
                description: 'Allows you to use -good morning vietnam'
            },
            lumpofcoal: {
                relic: false,
                unique: true,
                giftable: true,
                name: 'Lump Of Coal',
                description: 'This allows the IRS to redistribute some of your money until you\'re paid off.'
            },
            darkwhispers: {
                relic: false,
                unique: true,
                giftable: true,
                name: 'Dark Whispers',
                description: 'It seems like something\'s been watching you from the shadows...'
            },
            gridslotsgiftcard: {
                relic: false,
                unique: false,
                giftable: true,
                name: 'Grid Slots Gift Card',
                description: 'Use to get a free roll!'
            },
            mazeslotsgiftcard: {
                relic: false,
                unique: false,
                giftable: true,
                name: 'Maze Slots Gift Card',
                description: 'Use to get a free roll!'
            },
            modmarble: {
                relic: false,
                unique: true,
                giftable: true,
                name: 'Mod Marble',
                description: 'Raises income by 10%'
            },
            goldenmarble: {
                relic: false,
                unique: true,
                giftable: true,
                name: 'Golden Marble',
                description: 'Raises income by 10%'
            },
            platinummarble: {
                relic: false,
                unique: true,
                giftable: true,
                name: 'Platinum Marble',
                description: 'Raises income by 20%'
            },
        } );
    }

    // Each Item has properties
    // Unique (bool)
    // Relic (bool)
    // Description
    // Name

    // Each possessed item has properties
    // count

    // Relics keep track of who owns them

    getInventory( metaInfo ) {
        const id = metaInfo.authorId;
        let msg = `Inventory of **${metaInfo.author}**:\n`;
        const inventory = this.get( id, {} );
        Object.keys( inventory ).forEach( k => {
            const item = this.get( `items.${k}` );
            const amount = this.get( `${id}.${k}.count` );
            if ( amount > 0 ) {
                msg += `\`${`${item.name} ${( amount>1?`(${amount}x) `:'' )}`.padEnd( 25 )}- ${item.description}\`\n`;
            }
        } );
        this.setAction( 'message', msg );
    }

    seeRelics() {
        this.setAction( 'message', `The relics on the server are:
Holy Mantle - owned by ${util.getUser( this.get( 'relics.holymantle.owner' ) )}
Vietnam War Horn - owned by ${util.getUser( this.get( 'relics.vietnamwarhorn.owner' ) )}
Burger Crown - owned by ${util.getUser( this.get( 'relics.burgercrown.owner' ) )}
Broken Timepiece - owned by ${util.getUser( this.get( 'relics.brokentimepiece.owner' ) )}
Excalibur - owned by ${util.getUser( this.get( 'relics.excalibur.owner' ) )}
Immobility Orb - ???
Mikoto's Affection - owned by ${util.getUser( this.get( 'relics.mikoto.owner' ) )}

Stay tuned for the relic auction!` );
    }

    gift( to, item, metaInfo ) {
        const itemSaid = item;
        item = item.toLowerCase().replace( /\s/g, '' );

        const id = metaInfo.authorId;
        const toId = util.getId( to );
        if ( !toId ) {
            this.setAction( 'message', `user ${to} was not found.` );
            return;
        }
        if ( id === toId ) {
            this.setAction( 'message', `You are **${to}**` );
            return;
        }
        const obj = this.get( `items.${item}` );
        if ( !obj ) {
            this.setAction( 'message', `item ${itemSaid} was not found. Use -inventory if you are confused` );
            return;
        }
        const count = this.get( `${id}.${item}.count`, 0 );
        const toCount = this.get( `${toId}.${item}.count`, 0 );
        if ( count <= 0 ) {
            this.setAction( 'message', 'You don\'t have enough to give.' );
            return;
        }
        if ( ! obj.giftable ) {
            this.setAction( 'message', 'This item cannot be gifted.' );
            return;
        }
        if ( obj.unique && toCount >= 1 ) {
            this.setAction( 'message', 'The recipient already has the maximum of one of these' );
            return;
        }

        this.loseItem( id, item );
        this.getItem( toId, item );
    }

    adminGift( to, item, metaInfo ) {
        item = item.toLowerCase().replace( /\s/g, '' );
        if ( !PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            this.setAction( 'message', 'You don\'t have permission to do that.' );
            return;
        }

        const toId = util.getId( to );
        if ( !toId ) {
            this.setAction( 'message', `user ${to} was not found.` );
            return;
        }
        const obj = this.get( `items.${item}` );
        if ( !obj ) {
            this.setAction( 'message', `item ${item} does not exist.` );
            return;
        }
        this.setAction( ACTIONS.MESSAGE, 'Success!' );
        this.getItem( toId, item );
    }

    goodMorningVietnam( metaInfo ) {
        const id = metaInfo.authorId;
        if ( id !== this.get( 'relics.vietnamwarhorn.owner' ) ) {
            this.setAction( 'message', 'You do not possess the vietnam war horn!.' );
            return;
        }
        const date = new Date();
        if ( date.getHours() >= 12 || date.getHours() < 6 ) {
            this.setAction( 'message', 'It\'s not morning' );
            return;
        }
        const day = date.getDate();
        const lastDay = _.get( this.json, 'vietnamDate', -2 );
        if ( day === lastDay ) {
            // can't do it twice in same day
            return;
        }

        let streak = 1;
        let reward = 0;
        if ( day === 1 && lastDay > 27 || day === lastDay+1 ) {
            streak = _.get( this.json,'vietnamStreak', 0 )+1;
        }
        switch ( streak ) {
        case 1: reward = 0; break;
        case 2: reward = 0; break;
        case 3: reward = 0; break;
        case 4: reward = 1; break;
        case 5: reward = 1; break;
        case 6: reward = 1; break;
        case 7: reward = 1; break;
        case 8: reward = 1; break;
        case 9: reward = 2; break;
        case 10: reward = 2; break;
        case 11: reward = 2; break;
        case 12: reward = 2; break;
        case 13: reward = 2; break;
        case 14: reward = -1; break;
        case 15: reward = -1; break;
        case 16: reward = -3; break;
        case 17: reward = -5; break;
        case 18: reward = -7; break;
        case 19: reward = 5; break;
        case 20: reward = 5; break;
        case 21: reward = 5; break;
        case 22: reward = 3; break;
        case 23: reward = 3; break;
        case 24: reward = 3; break;
        case 25: reward = -30; break;
        case 26: reward = 10; break;
        default: reward = 5; break;
        }
        if ( reward < 0 ) {
            if ( !bank.payAmount( id, -reward ) ) {
                this.setAction( 'message', `Today that will cost ${-reward} credits. You don't have enough!` );
                return;
            }
        }

        _.set( this.json,'vietnamDate', day );
        _.set( this.json,'vietnamStreak', streak );

        this.setAction( 'message', `And good morning to you Dion!\n Your streak is ${streak}` );
        if ( reward > 0 ) {
            this.queueAction();
            this.setAction( 'message', `You get ${reward} free credits` );
            bank.addAmount( id, reward );
        }
        if ( reward < 0 ) {
            this.queueAction();
            this.setAction( 'message', `You paid ${-reward} free credits` );
        }
        this.setAction( ACTIONS.IMAGE, `vietnam/vietnam${streak}.jpg` );
    }

    holyMantle( n, metaInfo ){
        if ( metaInfo.authorId !== this.get( 'relics.holymantle.owner' ) ) {
            this.setAction( 'message', 'The holy mantle (currently) belongs to **Ginge**' );
            return;
        }
        const user = metaInfo.author;
        let str;
        if ( n === null ) {
            str = _.sample( mantleEffects );
        } else {
            n = Number( n );
            if ( n < mantleEffects.length ) {
                str = mantleEffects[n];
            } else {
                this.setAction( 'message', `**${user}** choose a number 0 through 15.` );
                return;
            }
        }
        this.setAction( 'message', `**${user}**${str}` );
    }

    useItem( item, metaInfo ) {
        item = item.toLowerCase();
        item = item.replace( /\s/g, '' );
        const id = metaInfo.authorId;
        const obj = this.get( `items.${item}` );
        if ( !obj ) {
            this.setAction( 'message', `item ${item} does not exist.` );
            return;
        }
        const count = this.get( `${id}.${item}.count`, 0 );
        if ( count <= 0 ) {
            this.setAction( 'message', 'You don\'t one to use.' );
            return;
        }
        switch ( item ) {
        default:
            this.setAction( ACTIONS.MESSAGE, 'That item isn\'t usable at this time.' );
            break;
        }
    }

    // API

    getItem( id, item ) {
        _.set( this.json, `${id}.${item}.count`, _.get( this.json, `${id}.${item}.count`, 0 ) + 1 );
        if ( this.get( `items.${item}.relic`, false ) ) {
            this.set( `relics.${item}.owner`, id );
        }
    }

    loseItem( id, item ) {
        this.update( `${id}.${item}.count`, -1 );
    }

    has( id, item ) {
        return this.get( `${id}.${item}.count`, 0 ) > 0;
    }
}

module.exports = { inventory: new Inventory() };
