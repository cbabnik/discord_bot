const { Component } = require( './component' );
const { ACTIONS, BUCKS } = require( '../core/constants' );

const ID = 'shop';
const { inventory } = require( './inventory' );
const { bank } = require( './bank' );

class Shop extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-shop$/, this.browse );
        this.addCommand( /^-browse$/, this.browse );
        this.addCommand( /^-buy +(.+)$/, this.buy );
        this.addCommand( /^-purchase +(.+)$/, this.buy );
    }

    browse() {
        this.setAction( ACTIONS.MESSAGE, `Buy stuff! example: \`buy golden marble\`
Items in shop:
\`golden marble        - $300          : Raises income by 10%\`
\`platinum marble      - 5 Buck bucks  : Raises income by 20%\`
\`bait                 - $10           : Lets you try to catch a fish\`
` );
    }

    async buy( item, metaInfo ) {
        item = item.toLowerCase();
        const itemId = item.replace( /\s/g, '' );
        //const obj = inventory.get( 'items.${itemId}' );
        const id = metaInfo.authorId;
        let cost = 0;
        let costbb = 0;
        let togain = 0;

        switch ( item.toLowerCase() ) {
        case 'bait':
            togain = 1101;
            cost = 10;
            break;
        case 'golden marble':
            if ( await inventory.has( id, 101 ) !== false ) {
                this.setAction( ACTIONS.MESSAGE, 'One per customer.' );
                return;
            }
            togain = 101;
            cost = 300;
            break;
        case 'platinum marble':
            if ( await inventory.has( id, 102 ) !== false ) {
                this.setAction( ACTIONS.MESSAGE, 'One per customer.' );
                return;
            }
            togain = 102;
            costbb = 5;
            break;
        default:
            this.setAction( ACTIONS.MESSAGE, 'That item isn\'t in the shop.' );
            return;
        }

        if ( !await bank.payAmount( id, cost ) ) {
            this.setAction( ACTIONS.MESSAGE, 'You can\'t afford it.' );
            return;
        }
        if ( !await bank.payAmount( id, costbb, 'buckbucks' ) ) {
            this.setAction( ACTIONS.MESSAGE, 'You can\'t afford it.' );
            return;
        }

        await inventory.gainItem(metaInfo.authorId, togain)
        this.setAction( ACTIONS.MESSAGE, 'Purchase Made' );
    }
}

module.exports = { shop: new Shop() };
