const { Component } = require( './component' );
const { statistics } = require( './statistics' )
const _ = require( 'lodash' );
const util = require( '../core/util' );
const debug = require( 'debug' )( 'basic' );
const { ACTIONS, CONFIG, PERMISSION_LEVELS } = require( '../core/constants' );

const ID = 'bank';

class Bank extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-balance$/, ( mi ) => this.getAmount( false, mi ), "bank" );
        this.addCommand( /^-balance exact$/, ( mi ) => this.getAmount( true, mi ), "bank" );
        this.addCommand( /^-give (.+) (\d*\.\d{0,3})$/, this.give, "bank" );
        this.addCommand( /^-give (.+) (\d*\.\d{4,100})$/, this.giveWarning, "bank" );
        this.addCommand( /^-give (.+) (\d+)$/, this.give, "bank" );
        this.addCommand( /^-give (.+) (-\d+)$/, this.stealWarning, "bank" );
        this.addCommand( /^-[iI][oO][uU] (.+) (\d+)$/, this.iou, "iou" );
        this.addCommand( /^-[iI][oO][uU] (.+) (\d*\.\d{0,3})$/, this.iou, "iou" );
        this.addCommand( /^-[iI][oO][uU] (.+) (\d*\.\d{4,100})$/, this.giveWarning, "iou" );
        this.addCommand( /^#give (.+) (\-?\d*\.\d{0,5})$/, this.admingive);
        this.addCommand( /^#give (.+) (\-?\d+)$/, this.admingive);
    }

    async admingive(user, amount, metaInfo) {
        const id = util.getId( user );
        if (!PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            return
        }
        const value = Number( amount );
        await this.storage.add(`${id}.credits`, value)
        this.setAction("message", `**${user}** has been granted ${value} credits.`)
        this.setAction( 'channelId', CONFIG.MAIN_CHANNEL );
    }

    async getAmount( exact, metaInfo ) {
        const id = metaInfo.authorId;
        const user = metaInfo.author;
        let amount;
        const bamount = await this.balance( id, 'buckbucks' );
        if ( exact ) {
            amount = await this.exactBalance( id );
        } else {
            amount = await this.balance( id );
        }
        let msg = '';
        if ( amount === 0 ) {
            msg = `Sorry **${user}**, you're flat out broke.` ;
        } else if ( amount < 0 ) {
            msg = `Dang **${user}**, you're in debt! You owe slots \`${-amount} credits\`.` ;
        } else {
            msg = `**${user}** has \`${amount} credits\` banked${bamount > 0?` and **${bamount}** Buck bucks`:''}.`;
        }

        const ious = await this.storage.get( `${id}.iou`, {} );
        const keys = Object.keys( ious ).filter( k => ious[k] > 0 );
        if ( keys.length > 0 ) {
            msg += '\n*Outstanding IOUS*:';
            keys.forEach( k => {
                msg += `\nYou owe **${util.getUser( k )}** \`${ious[k]} credits\``;
            } );
        }

        this.setAction( 'message', msg );
    }

    async iou( user, amnt, metaInfo ) {
        const id = metaInfo.authorId;
        amnt = parseFloat( amnt );

        const toId = util.getId( user );
        if ( !toId ) {
            this.setAction( 'message', `Sorry, I could not find user **${user}**` );
            return;
        }
        if ( id === toId ) {
            this.setAction( 'message', `You are ${user}.` );
            return;
        }

        this.setAction( ACTIONS.MESSAGE, 'IOU Added.' );
        const oppositeIOU = await this.storage.get( `${toId}.iou.${id}` );
        if ( oppositeIOU > 0 ) {
            const reduction = Math.min( amnt, oppositeIOU );
            await this.storage.set( `${toId}.iou.${id}`, oppositeIOU-reduction );
            amnt -=reduction;
            this.setAction( ACTIONS.MESSAGE, `IOU Added.\n **${user}**'s iou to you has been reduced to \`${oppositeIOU-reduction} credits\`` );
        }

        await this.addIOU( id,toId,amnt );
    }

    giveWarning() {
        this.setAction( ACTIONS.MESSAGE, 'Lets not get carried away with the decimal places.' );
    }

    stealWarning() {
        this.setAction( 'message', 'Are you trying to steal? shame on you.' );
    }

    // API

    async balance( id, type ) {
        return Math.floor( await this.storage.get( `${id}.${type?type:'credits'}`, 0 ) );
    }

    async exactBalance( id, type ) {
        return await this.storage.get( `${id}.${type?type:'credits'}`, 0 );
    }

    async addAmount( id, value, type ) {
        type = type?type:'credits';
        value = Number( value );
        const balance = await this.exactBalance( id, type );
        if ( isNaN( balance + value ) ) {
            debug( 'bank: add tried to set to NaN' );
            return;
        }
        await this.storage.set( `${id}.${type}`, balance + value );
    }

    async payAmount( id, value, type ) {
        type = type?type:'credits';
        value = Number( value );
        const balance = await this.exactBalance( id, type );
        if ( isNaN( balance - value ) ) {
            debug( 'bank: pay tried to set to NaN' );
            return false;
        }
        if ( value < 0 ) {
            debug( 'bank: tried to pay negative' );
            return false;
        }
        if ( value > balance ) {
            return false;
        }
        await this.storage.set( `${id}.${type}`, balance - value );
        
        return true;
    }

    async give( user, amnt, metaInfo ) {
        amnt = Number(amnt)
        const id = util.getId( user );
        if ( !id ) {
            this.setAction( 'message', `Sorry, I could not find user **${user}**` );
            return;
        }

        this.setAction( ACTIONS.CHANNEL_ID, CONFIG.MAIN_CHANNEL );
        if ( await this.payAmount( metaInfo.authorId, amnt ) ) {
            const amntOwed = await this.storage.get( `${metaInfo.authorId}.iou.${id}`, 0 );
            if ( amntOwed > 0 ) {
                await this.storage.set(`${metaInfo.authorId}.iou.${id}`, Math.max( 0, amntOwed-amnt ));
            }
            await this.addAmount( id, amnt );
            this.setAction( 'message', `**${metaInfo.author}** has given ${amnt} credits to **${user}**` );
            statistics.add(`credits_transfered_from_to.${metaInfo.authorId}.${id}`, amnt)
            statistics.add(`credits_transfered_from_to.${id}.${metaInfo.authorId}`, -amnt)
        } else {
            this.setAction( 'message', `**${metaInfo.author}**, you don't have enough credits. Check with \`-balance\`` );
        }
    }

    // helpers

    async addIOU( from, to, amount ) {
        await this.storage.add( `${from}.iou.${to}`, amount );
    }

    async hasIOU( from, to ) {
        return await this.storage.get( `${from}.iou.${to}` ) > 0;
    }
}

module.exports = { bank: new Bank() };
