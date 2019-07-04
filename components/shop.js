const { Component } = require( '../component' );
const _ = require( 'lodash' );
const { PERMISSION_LEVELS, ACTIONS, CONFIG_DEFAULTS, BUCKS } = require( '../constants' );

const ID = 'inventory';
const { inventory } = require( './inventory' );
const { bank } = require( './bank' );

class Shop extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-shop$/, this.browse );
        this.addCommand( /^-browse$/, this.browse );
        this.addCommand( /^-buy (.*)$/, this.buy );
        this.addCommand( /^-purchase (.*)$/, this.buy );
    }

    browse() {
        this.setAction( ACTIONS.MESSAGE, `Items in shop:
\`grid slots gift card - $5            : Use to get a free roll!\`
\`maze slots gift card - $20           : Use to get a free roll!\`
\`golden marble        - $300          : Raises income by 10%\`
\`platinum marble      - 5 Buck bucks  : Raises income by 20%\`
\`excalibur            - 30 Buck bucks : Useful for the quest update\`
` );
    }

    buy( item, metaInfo ) {
        item = item.toLowerCase();
        const itemId = item.replace( /\s/g, '' );
        const obj = inventory.get( 'items.${itemId}' );
        const id = metaInfo.authorId;
        let cost = 0;
        let costbb = 0;

        switch ( item.toLowerCase() ) {
        case 'grid slots gift card':
            cost = 5;
            break;
        case 'maze slots gift card':
            cost = 20;
            break;
        case 'golden marble':
            if ( inventory.has( id, itemId ) ) {
                this.setAction( ACTIONS.MESSAGE, 'One per customer.' );
                return;
            }
            cost = 300;
            break;
        case 'platinum marble':
            if ( inventory.has( id, itemId ) ) {
                this.setAction( ACTIONS.MESSAGE, 'One per customer.' );
                return;
            }
            costbb = 5;
            break;
        case 'excalibur':
            if ( inventory.get( 'relics.excalibur.owner' ) !== BUCKS.BUCKBOT ) {
                this.setAction( ACTIONS.MESSAGE, 'Sorry, I already sold that.' );
                return;
            }
            costbb = 30;
            break;
        default:
            this.setAction( ACTIONS.MESSAGE, 'That item isn\'t in the shop.' );
            return;
        }

        if ( !bank.payAmount( id, cost ) ) {
            this.setAction( ACTIONS.MESSAGE, 'You can\'t afford it.' );
            return;
        }
        if ( !bank.payAmount( id, costbb, 'buckbucks' ) ) {
            this.setAction( ACTIONS.MESSAGE, 'You can\'t afford it.' );
            return;
        }

        this.setAction( ACTIONS.MESSAGE, 'Purchase Made' );
        inventory.getItem( id, item.toLowerCase().replace( /\s/g, '' ) );
    }
}

module.exports = { shop: new Shop() };
