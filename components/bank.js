const { Component } = require( '../component' );
const _ = require( 'lodash' );
const util = require( '../util' );
const debug = require( 'debug' )( 'basic' );
const { ACTIONS, CONFIG_DEFAULTS } = require( '../constants' );

const ID = 'bank';

class Bank extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-balance$/, ( mi ) => this.getAmount( false, mi ) );
        this.addCommand( /^-balance exact$/, ( mi ) => this.getAmount( true, mi ) );
        this.addCommand( /^-give (.+) (\d*\.\d{0,3})$/, this.give );
        this.addCommand( /^-give (.+) (\d*\.\d{4,100})$/, this.giveWarning );
        this.addCommand( /^-give (.+) (\d+)$/, this.give );
        this.addCommand( /^-give (.+) (-\d+)$/, this.stealWarning );
        this.addCommand( /^-[iI][oO][uU] (.+) (\d+)$/, this.iou );
        this.addCommand( /^-[iI][oO][uU] (.+) (\d*\.\d+)$/, this.iou );
        this.addCommand( /^-bankruptcy$/, this.bankruptcyInfo );
        this.addCommand( /^\?bankruptcy$/, this.bankruptcyInfo );
        this.addCommand( /^-declare bankruptcy\. I am sure\.$/, this.declareBankruptcy );
        this.addCommand( /^-loans$/, this.look );
        this.addCommand( /^-loan debts$/, this.debtsCommand );
        this.addCommand( /^-loan offer (.+)$/, this.offer );
        this.addCommand( /^-loan adjust (.+)$/, this.adjust );
        this.addCommand( /^-loan relinquish$/, this.relinquish );
        this.addCommand( /^-loan take ?[oO]ut (\d+) (.+)$/, this.takeOut );
        this.addCommand( /^-loan take ?[oO]ut (.+) (\d+)$/, ( p, a, mi ) => this.takeOut( a,p,mi ) );
        this.addCommand( /^-loan take ?[oO]ut (\d*\.\d+) (.+)$/, this.takeOut );
        this.addCommand( /^-loan take ?[oO]ut (.+) (\d*\.\d+)$/, ( p, a, mi ) => this.takeOut( a,p,mi ) );
    }

    bootUp() {
        this.addScheduledEvent();
    }

    scheduledEvent() {
        Object.keys( this.json ).forEach( from => {
            Object.keys( _.get( this.json, `${from}.debt`, {} ) ).forEach( to => {
                const debt = _.get( this.json, `${from}.debt.${to}.loanSize`, 0 ) + _.get( this.json, `${from}.debt.${to}.interest`, 0 );
                if ( debt > 0 ) {
                    const type = _.get( this.json, `${to}.loan.type`, 'interest' );
                    let debt_with_interest = debt;
                    if ( type !== 'compound' ) {
                        debt_with_interest = _.get( this.json, `${from}.debt.${to}.loanSize`, 0 );
                    }
                    const newInterest = debt_with_interest* _.get( this.json, `${to}.loan.interest`, 0 ) + _.get( this.json, `${to}.loan.rate`, 0 );
                    _.set( this.json, `${from}.debt.${to}.interest`, _.get( this.json, `${from}.debt.${to}.interest`, 0 )+newInterest );
                }
            } );
        } );

        Object.keys( this.json ).forEach( k => {
            if ( _.get( this.json, `${k}`.bankrupt, false ) ) {
                if ( _.get( this.json[k], 'credits', 0 ) < 0 ) {
                    const halfDebt = Math.ceil( -_.get( this.json[k], 'credits', 0 )/2 );
                    this.addAmount( k, halfDebt );
                } else {
                    _.set( this.json[k], 'credits', 0 );
                }
            }
        } );
        this.saveJSON();
    }

    getAmount( exact, metaInfo ) {
        const id = metaInfo.authorId;
        const user = metaInfo.author;
        let amount;
        if ( exact ) {
            amount = this.exactBalance( id );
        } else {
            amount = this.balance( id );
        }
        let msg = '';
        if ( _.get( this.json, `${id}.bankrupt`, false ) ) {
            msg = `You are Bankrupt. Your debt of \`${-amount} credits\` will be bailed out in ${1+Math.floor( Math.log2( -amount ) )} days` ;
        } else if ( amount === 0 ) {
            msg = `Sorry **${user}**, you're flat out broke.` ;
        } else if ( amount < 0 ) {
            msg = `Dang **${user}**, you're in debt! You owe slots \`${-amount} credits\`.` ;
        } else {
            msg = `**${user}** has \`${amount} credits\` banked.`;
        }

        const ious = _.get( this.json, `${id}.iou`, {} );
        const keys = Object.keys( ious ).filter( k => ious[k] > 0 );
        if ( keys.length > 0 ) {
            msg += '\n*Outstanding IOUS*:';
            keys.forEach( k => {
                msg += `\nYou owe **${util.getUser( k )}** \`${ious[k]} credits\``;
            } );
        }

        if ( exact ) {
            msg += this.debts( id );
        } else {
            msg += this.debtsSummary( id );
        }

        this.setAction( 'message', msg );
    }

    bankruptcyInfo() {
        this.setAction( 'message', 'You can declare bankruptcy and lose all your stuff. If you do, you will be ' +
            'bailed out of debt gradually. Each day that passed while bankrupt your debt will be halved, until you are ' +
            'out of debt. If you are sure you want to declare bankruptcy, use the command `-declare bankruptcy. I am sure.` ' +
            'Don\'t use this will nilly though! Curtis will see it and take away things you didn\'t even know you had.' );
    }

    declareBankruptcy( metaInfo ) {
        const id = metaInfo.authorId;
        const user = metaInfo.author;
        this.setAction( ACTIONS.MESSAGE, `**${user}** has declared Bankruptcy!!` );
        this.setAction( ACTIONS.CHANNEL_ID, CONFIG_DEFAULTS.MAIN_CHANNEL );
        if ( _.get( this.json, `${id}.dbankrupt`, false ) ) {
            this.setAction( ACTIONS.MESSAGE, undefined );
        } else if ( _.get( this.json, `${id}.bankrupt`, false ) ) {
            this.setAction( ACTIONS.MESSAGE, `**${user}** has declared **DOUBLE Bankruptcy**!!! (Double Bankruptcy is something that really sucks btw)` );
            _.set( this.json, `${id}.dbankrupt`, true );
        }
        _.set( this.json, `${id}.bankrupt`, true );
        if ( this.balance( id ) > 0 ) {
            _.set( this.json, `${id}.credits`, 0 );
        }
        this.saveJSON();
    }

    bankruptcyCheck( id ) {
        if ( _.get( this.json, `${id}.bankrupt`, false ) && !_.get( this.json, `${id}.dbankrupt`, false ) && this.balance( id ) >= 0 ) {
            _.set( this.json, `${id}.bankrupt`, false );
            this.actor.handle( {
                message: `**user#${id}** is no longer bankrupt!`,
                channelId: CONFIG_DEFAULTS.MAIN_CHANNEL
            }, null );
        }
    }

    // API

    balance( id, type ) {
        return Math.floor( _.get( this.json, `${id}.${type?type:'credits'}`, 0 ) );
    }

    exactBalance( id, type ) {
        return _.get( this.json, `${id}.${type?type:'credits'}`, 0 );
    }

    addAmount( id, value, type ) {
        type = type?type:'credits';
        value = Number( value );
        const balance = this.exactBalance( id, type );
        if ( isNaN( balance + value ) ) {
            debug( 'bank: add tried to set to NaN' );
            return;
        }
        _.set( this.json, `${id}.${type}`, balance + value );
        this.bankruptcyCheck( id );
        this.saveJSON();
    }

    payAmount( id, value, type ) {
        type = type?type:'credits';
        value = Number( value );
        const balance = this.exactBalance( id, type );
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
        _.set( this.json, `${id}.${type}`, balance - value );
        this.saveJSON();
        return true;
    }

    give( user, amnt, metaInfo ) {
        const id = util.getId( user );
        if ( !id ) {
            this.setAction( 'message', `Sorry, I could not find user **${user}**` );
            return;
        }

        this.setAction( ACTIONS.CHANNEL_ID, CONFIG_DEFAULTS.MAIN_CHANNEL );
        if ( this.payAmount( metaInfo.authorId, amnt ) ) {
            const paid = this.payOffLoan( metaInfo.authorId, id, amnt );
            const amntLeft = amnt-paid;
            const amntOwed = _.get( this.json, `${metaInfo.authorId}.iou.${id}`, 0 );
            if ( amntOwed > 0 ) {
                this.json[metaInfo.authorId].iou[id] = Math.max( 0, amntOwed-amntLeft );
            }
            this.addAmount( id, amnt );
            this.setAction( 'message', `**${metaInfo.author}** has given ${amnt} credits to **${user}**` );
        } else {
            this.setAction( 'message', `**${metaInfo.author}**, you don't have enough credits. Check with \`-balance\`` );
        }
    }

    giveWarning() {
        this.setAction( ACTIONS.MESSAGE, 'Lets not get carried away with the decimal places.' );
    }

    iou( user, amnt, metaInfo ) {
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
        const oppositeIOU = _.get( this.json, `${toId}.iou.${id}`, 0 );
        if ( oppositeIOU > 0 ) {
            const reduction = Math.min( amnt, oppositeIOU );
            _.set( this.json, `${toId}.iou.${id}`, oppositeIOU-reduction );
            amnt -=reduction;
            this.setAction( ACTIONS.MESSAGE, `IOU Added.\n **${user}**'s iou to you has been reduced to \`${oppositeIOU-reduction} credits\`` );
        }

        this.addIOU( id,toId,amnt );
    }

    addIOU( from, to, amount ) {
        _.set( this.json, `${from}.iou.${to}`, _.get( this.json, `${from}.iou.${to}`, 0 ) + amount );
        this.saveJSON();
    }

    hasIOU( from, to ) {
        return _.get( this.json, `${from}.iou.${to}`, 0 ) > 0;
    }

    stealWarning() {
        this.setAction( 'message', 'Are you trying to steal? shame on you.' );
    }

    adjust( args, metaInfo ) {
        args = args.split( ' ' );
        if ( metaInfo.channelId !== CONFIG_DEFAULTS.MAIN_CHANNEL ) {
            this.setAction( ACTIONS.MESSAGE, 'Please do this publicly.' );
            return;
        }
        let rate = -1;
        let interest = -1;
        let max = -1;
        let flat = -1;
        args.forEach( a => {
            const [arg, val] = a.split( '=' );
            if ( !val ) {
                this.setAction( ACTIONS.MESSAGE, 'Arguments were in the wrong format.' );
                return;
            }
            if ( arg === 'rate' ) {
                rate = parseFloat( val );
            }
            if ( arg === 'interest' ) {
                interest = parseFloat( val );
            }
            if ( arg === 'max' ) {
                max = parseFloat( val );
            }
            if ( arg === 'flat' ) {
                flat = parseFloat( val );
            }
        } );

        if ( rate !== -1 ) {
            if ( rate < 0 ) {
                this.setAction( ACTIONS.MESSAGE, 'Daily rate for the loan can not be negative.' );
                return;
            }
            if ( rate > _.get( this.json, `${metaInfo.authorId}.loan.rate` ) ) {
                this.setAction( ACTIONS.MESSAGE, 'You cannot raise the rate of loans you offer. You\'ll have to relinquish your current offering and make a new one' );
                this.queueAction();
            } else {
                this.setAction( ACTIONS.MESSAGE, 'Rate adjusted.' );
                this.queueAction();
                _.set( this.json, `${metaInfo.authorId}.loan.rate`, rate );
            }
        }
        if ( interest !== -1 ) {
            if ( interest < 0 ) {
                this.setAction( ACTIONS.MESSAGE, 'Interest must be non-negative.' );
                return;
            }
            if ( interest > _.get( this.json, `${metaInfo.authorId}.loan.interest` ) ) {
                this.setAction( ACTIONS.MESSAGE, 'You cannot raise the interest of loans you offer. You\'ll have to relinquish your current offering and make a new one' );
                this.queueAction();
            } else {
                this.setAction( ACTIONS.MESSAGE, 'Rate adjusted.' );
                this.queueAction();
                _.set( this.json, `${metaInfo.authorId}.loan.interest`, interest );
            }
        }
        if ( max !== -1 ) {
            if ( max < 0 ) {
                this.setAction( ACTIONS.MESSAGE, 'Loan max cannot be negative.' );
                return;
            }
            this.setAction( ACTIONS.MESSAGE, 'Max adjusted.' );
            this.queueAction();
            _.set( this.json, `${metaInfo.authorId}.loan.max`, max );
        }
        if ( flat !== -1 ) {
            if ( flat < 0 ) {
                this.setAction( ACTIONS.MESSAGE, 'Flat charge to take out a loan can not be negative.' );
                return;
            }
            if ( flat > _.get( this.json, `${metaInfo.authorId}.loan.flat` ) ) {
                this.setAction( ACTIONS.MESSAGE, 'You cannot raise the charge of loans you offer. You\'ll have to relinquish your current offering and make a new one' );
                this.queueAction();
            } else {
                this.setAction( ACTIONS.MESSAGE, 'Flat charge adjusted.' );
                this.queueAction();
                _.set( this.json, `${metaInfo.authorId}.loan.flat`, flat );
            }
        }

        this.saveJSON();
    }

    offer( args, metaInfo ) {
        args = args.split( ' ' );
        if ( metaInfo.channelId !== CONFIG_DEFAULTS.MAIN_CHANNEL ) {
            this.setAction( ACTIONS.MESSAGE, 'Please do this publicly.' );
            return;
        }
        if ( _.get( this.json, `${metaInfo.authorId}.loan.offersLoan`, false ) ) {
            this.setAction( ACTIONS.MESSAGE, 'You have to relinquish your current offering first.' );
            return;
        }
        let rate = 0;
        let flat = 0;
        let interest = 0;
        let type = 'interest';
        let max = 0;
        args.forEach( a => {
            const [arg, val] = a.split( '=' );
            if ( !val ) {
                this.setAction( ACTIONS.MESSAGE, 'Arguments were in the wrong format.' );
                return;
            }
            if ( arg === 'flat' ) {
                flat = parseFloat( val );
            }
            if ( arg === 'rate' ) {
                rate = parseFloat( val );
            }
            if ( arg === 'interest' ) {
                interest = parseFloat( val );
            }
            if ( arg === 'type' ) {
                type = val;
            }
            if ( arg === 'max' ) {
                max = parseFloat( val );
            }
        } );
        if ( max <= 0 ) {
            this.setAction( ACTIONS.MESSAGE, 'A positive loan max is required (e.g. max=100).' );
            return;
        }
        if ( interest < 0 ) {
            this.setAction( ACTIONS.MESSAGE, 'Interest must be non-negative.' );
            return;
        }
        if ( rate < 0 ) {
            this.setAction( ACTIONS.MESSAGE, 'Daily rate for the loan can not be negative.' );
            return;
        }
        if ( flat < 0 ) {
            this.setAction( ACTIONS.MESSAGE, 'Flat charge to take out a loan can not be negative.' );
            return;
        }
        if ( type === 'interest' ) {
            if ( interest > 0.1 ) {
                this.setAction( ACTIONS.MESSAGE, '10% each day is the maximum interest rate you are allowed to charge.' );
                return;
            }
        } else if ( type === 'compound' ) {
            if ( interest > 0.02 ) {
                this.setAction( ACTIONS.MESSAGE, '2% daily compound interest is the maximum compounding interest.' );
                return;
            }
        } else {
            this.setAction( ACTIONS.MESSAGE, 'Interest can be set to `compound` or is off by default.' );
            return;
        }
        if ( rate > 10 ) {
            this.setAction( ACTIONS.MESSAGE, 'The maximum rate is 10 credits per day.' );
            return;
        }
        if ( flat > 50 ) {
            this.setAction( ACTIONS.MESSAGE, 'The maximum flat amount is 50 credits.' );
            return;
        }

        this.setAction( ACTIONS.MESSAGE, 'New Loan Set.' );
        _.set( this.json, `${metaInfo.authorId}.loan`, {offersLoan: true, max, rate, interest, type, flat} );
        this.saveJSON();
    }

    relinquish( metaInfo ) {
        const id = metaInfo.authorId;
        if ( !_.get( this.json, `${id}.loan.offersLoan`, false ) ) {
            this.setAction( ACTIONS.MESSAGE, 'You aren\'t offering a loan.' );
            return;
        }
        Object.keys( this.json ).forEach( k => {
            const debt = _.get( this.json, `${k}.debt.${id}.loanSize`, 0 ) + _.get( this.json, `${k}.debt.${id}.interest`, 0 );
            if ( debt > 0 ) {
                this.addIOU( k, id, debt );
            }
            _.set( this.json, `${k}.debt.${id}.loanSize`, 0 );
            _.set( this.json, `${k}.debt.${id}.interest`, 0 );
        } );

        this.setAction( ACTIONS.MESSAGE, 'Your loans were relinquished. Users debts have been transfered to IOUs.' );
        _.set( this.json, `${metaInfo.authorId}.loan`, {} );
        this.saveJSON();
    }

    takeOut( amount, user, metaInfo ) {
        amount = parseFloat( amount );
        const id = util.getId( user );
        if ( !id ) {
            this.setAction( ACTIONS.MESSAGE, `User ${user} not found` );
            return;
        }
        if ( metaInfo.channelId !== CONFIG_DEFAULTS.MAIN_CHANNEL ) {
            this.setAction( ACTIONS.MESSAGE, 'Please do this publicly.' );
            return;
        }
        if ( this.hasIOU( metaInfo.authorId, id ) ) {
            this.setAction( ACTIONS.MESSAGE, 'You can\'t take out a loan from someone you owe to' );
            return;
        }
        if ( !_.get( this.json, `${id}.loan.offersLoan`, false ) ) {
            this.setAction( ACTIONS.MESSAGE, `**${user}** does not currently offer loans.` );
            return;
        }
        if ( id === metaInfo.authorId ) {
            this.setAction( 'message', 'You can\'t take out your own loans.' );
            return;
        }
        const currentDebt = _.get( this.json, `${metaInfo.authorId}.debt.${id}.loanSize`, 0 ) + _.get( this.json, `${metaInfo.authorId}.debt.${id}.interest`, 0 );
        const maxLoan = _.get( this.json, `${id}.loan.max`, 0 );
        if ( currentDebt + amount > maxLoan ) {
            this.setAction( ACTIONS.MESSAGE, `**${user}** has set a max loan amount of \`${maxLoan}\`. You can't exceed that.` );
            return;
        }
        if ( !this.payAmount( id, amount ) ) {
            this.setAction( ACTIONS.MESSAGE, `**${user}** does not have enough right now.` );
            return;
        }
        this.addAmount( metaInfo.authorId, amount );
        _.set( this.json, `${metaInfo.authorId}.debt.${id}.loanSize`, _.get( this.json, `${metaInfo.authorId}.debt.${id}.loanSize`, 0 )+amount );
        const flat = _.get( this.json, `${id}.loan.flat`, 0 );
        _.set( this.json, `${metaInfo.authorId}.debt.${id}.interest`, _.get( this.json, `${metaInfo.authorId}.debt.${id}.interest`, 0 )+flat );
        this.setAction( ACTIONS.MESSAGE, `**${metaInfo.author}** has taken out a loan! Be mindful of the interest!` );
        this.saveJSON();
    }

    payOffLoan( from, to, amount ) {
        const loan = _.get( this.json, `${from}.debt.${to}.loanSize`, 0 );
        const interest = _.get( this.json, `${from}.debt.${to}.interest`, 0 );
        let amountPaid = 0;
        if ( loan < amount ) {
            amount -= loan;
            amountPaid += loan;
            _.set( this.json, `${from}.debt.${to}.loanSize`, 0 );
        } else {
            _.set( this.json, `${from}.debt.${to}.loanSize`, loan-amount );
            amountPaid += amount;
            amount = 0;
        }
        if ( interest < amount ) {
            amountPaid += interest;
            _.set( this.json, `${from}.debt.${to}.interest`, 0 );
        } else {
            _.set( this.json, `${from}.debt.${to}.interest`, interest-amount );
            amountPaid += amount;
        }
        this.saveJSON();
        return amountPaid;
    }

    look() {
        let msg = 'Loans offered:';
        Object.keys( this.json ).forEach( loaner => {
            if ( _.get( this.json, `${loaner}.loan.offersLoan`, false ) ) {
                const user = util.getUser( loaner );
                const {max, rate, type, interest, flat} = _.get( this.json, `${loaner}.loan` );
                if ( max > 0 ) {
                    msg += `\n**${user}**: max loan of \`${max}\` with \`${interest*100}% daily ${type==='compound'?'compounding ':''}interest\`. costs \`${flat}\` to take out a loan and \`${rate}\` each day to keep it.`;
                }
            }
        } );
        if ( msg === 'Loans offered:' ) {
            msg = 'No loans are currently offered';
        }
        this.setAction( ACTIONS.MESSAGE, msg );
    }

    debts( id ) {
        let msg = '\n*Debts outstanding:*\n';
        Object.keys( _.get( this.json, `${id}.debt`, {} ) ).forEach( loaner => {
            const debt = _.get( this.json, `${id}.debt.${loaner}.loanSize`, 0 ) + _.get( this.json, `${id}.debt.${loaner}.interest`, 0 );
            if ( debt > 0 ) {
                msg += `You owe **${util.getUser( loaner )}** \`${debt} credits\` for your loan\n`;
            }
        } );
        if ( msg === '\n*Debts outstanding:*\n' ) {
            msg = '\n';
        }
        let msg2 = '*Users owe you:*';
        Object.keys( this.json ).forEach( debtor => {
            const debt = _.get( this.json, `${debtor}.debt.${id}.loanSize`, 0 ) + _.get( this.json, `${debtor}.debt.${id}.interest`, 0 );
            if ( debt > 0 ) {
                msg2 += `\n**${util.getUser( debtor )}**: \`${debt} credits\``;
            }
        } );
        if ( msg2 === '*Users owe you:*' ) {
            msg2 = '';
        }
        msg += msg2;
        return msg;
    }

    debtsSummary( id ) {
        let msg = '\n';
        let total = 0;
        Object.keys( _.get( this.json, `${id}.debt`, {} ) ).forEach( loaner => {
            total += _.get( this.json, `${id}.debt.${loaner}.loanSize`, 0 ) + _.get( this.json, `${id}.debt.${loaner}.interest`, 0 );
        } );
        if ( total > 0 ) {
            msg += `You owe \`${total} credits\`\n`;
        }
        total = 0;
        Object.keys( this.json ).forEach( debtor => {
            total += _.get( this.json, `${debtor}.debt.${id}.loanSize`, 0 ) + _.get( this.json, `${debtor}.debt.${id}.interest`, 0 );
        } );
        if ( total > 0 ) {
            msg += `You are owed \`${total} credits\`\n`;
        }
        return msg;
    }

    debtsCommand( metaInfo ) {
        const id = metaInfo.authorId;
        let msg = this.debts( id );
        if ( msg === '\n' ) {
            msg = 'You are not involved in any loans.';
        }
        this.setAction( ACTIONS.MESSAGE, msg );
    }
}

module.exports = { bank: new Bank() };
