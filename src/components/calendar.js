const { Component } = require( './component' );
const { bank } = require( './bank' );
const { BUCKS, CONFIG, ACTIONS } = require( '../core/constants' );
const _ = require( 'lodash' );

const ID = 'calendar';

const MONTH_NAMES = ['undefined','January','February','March','April','May','June','July','August','September','October','November','December'];

const BIRTHDAYS = {
    BUGSLINGER: {y:1995, m:7 , d:27},
    SHITKITTEN: {y:1995,m:6,d:30},
    GINGE: {y:1995,m:3,d:25},
    COLTSU: {y:1995,m:12,d:15},
    ALLEEN: {y:1994,m:9,d:13},
    BRODIZLE: {y:1994,m:7,d:2},
    DEVAN: {y:1995,m:11,d:16},
    KENRICASUEBERRY: {y:1995,m:10,d:5},
    KNICKKNACKSPARROW: {y:1995,m:1,d:14},
    EGGS: {y:1996,m:8,d:14},
    LAMP: {y:1996,m:9,d:30},
    TOMMI: {y:1995,m:4,d:2},
    XXCOWFACE: {y:1995,m:7,d:14},
    LUNES: {y:1995,m:5,d:24},
    QEWE: {y:1996,m:6,d:9},
    THEEVILSHOGUN: {y:1995,m:9,d:25},
    CRENDEN: {y:1995,m:12,d:25},
    ARENDULE: {y:1995,m:2,d:25},
    SEPULCHER: {y:1995,m:5,d:11},
    DANTEHVETZORZ: {y:1995,m:11,d:11},
    MILLSY13: {y:1995,m:4,d:17},
    SHIBELOCKWOW: {y:1996,m:3,d:12},
    PATRIONES: {y:1997,m:8,d:7},
    SQUID: {y:1995,m:7,d:7},
};

const HOLIDAYS = {
    BIGBUCKBIRTHDAY: {v:100,m:1,d:2,s:'Big Buck Birthday :deer:'},
    LONELYBUCKSDAY: {v:69,m:2,d:14,s:'Lonely Bucks Day :blue_heart:'},
    BRYSONLEFT: {v:13,m:3,d:14,s:'Bryson Left :wave:'},
    BUCKBOTANNIVERSARY: {v:200,m:4,d:1,s:'Buck Bot Anniversary :tada::tada::cake:'},
    INITIALDDAY: {v:50,m:6,d:6,s:'Initial D Day :regional_indicator_d:'},
    HUSBANDODAY: {v:69,m:8,d:28,s:'Husbando Day :man_dancing:'},
    BUGSIVERSARY: {v:50,m:9,d:9,s:'Bugsiversary :bee:'},
    BIGBUCKHAUNTERS: {v:50,m:10,d:31,s:'Big Buck Haunters :ghost:'},
    REMEMBERENCEDAY: {v:50,m:11,d:11,s:'REMemberence Day :reminder_ribbon:'},
    BUCKMASDAY: {v:50,m:12,d:25,s:'Buckmas Day :christmas_tree:'},
};

class Calendar extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-(?:next ?)?[bB]irthday$/, this.nextBirthday );
        this.addCommand( /^-(?:all) ?[bB]irthdays/, this.allBirthdays );
        this.addCommand( /^-birthday (.*)$/, this.birthdayOf );
        this.addCommand( /^-(?:all) ?[hH]olidays$/, this.allHolidays );
        this.addCommand( /^-(?:next ?)?[hH]oliday$/, this.nextHoliday );
        this.addCommand( /^-calendar$/, this.calendar );
        this.addCommand( /^-calendar (.*)$/, this.calendarMonth );
    }

    bootUp() {
        this.addScheduledEvent();
    }

    scheduledEvent() {
        const today = new Date();

        Object.keys( BIRTHDAYS ).forEach( k => {
            const bd = BIRTHDAYS[k];
            const name = k.charAt( 0 ).toUpperCase() + k.toLowerCase().substr( 1 );
            if ( this.isDay( bd, new Date() ) ) {
                this.setAction( 'message', `Happy birthday ${name}! Have 100 credits!` );
                this.setAction( 'channelId', CONFIG.MAIN_CHANNEL );
                this.actor.handle( this.commitAction(), null );
                bank.addAmount(BUCKS[k], 100)
            }
        } );

        Object.keys( HOLIDAYS ).forEach( k => {
            const hd = HOLIDAYS[k];
            if ( this.isDay( hd, new Date() ) ) {
                this.setAction( 'message', `It's ${hd.s}! Everyone gets ${hd.v} credits` );
                this.setAction( 'channelId', CONFIG.MAIN_CHANNEL );
                this.actor.handle( this.commitAction(), null );
                this.payout( hd.v );
            }
        } );
    }

    // COMMANDS


    calendar() {
        const idx = new Date().getMonth()+1;
        this.calendarMonth( MONTH_NAMES[idx] );
    }

    calendarMonth( month ) {
        month = month.charAt( 0 ).toUpperCase() +  month.toLowerCase().slice( 1 );
        const m = MONTH_NAMES.findIndex( m => m === month ) - 1;
        if ( m < 0 ) {
            this.setAction( ACTIONS.MESSAGE, `${month} does not name a month` );
            return;
        }
        const date = new Date();
        date.setDate( 1 );
        date.setMonth( m );

        let cal = `Calendar: ${month}\n\``;
        let list = 'Events:';
        if ( date.getDay() !== 0 ) {
            cal += _.replace( '[    ]'.repeat( date.getDay() ),/]\[/g,'  ' );
        }
        while ( date.getMonth() === m ) {
            let stamp = `[ ${String( date.getDate() ).padStart( 2,' ' )} ]`;
            Object.keys( BIRTHDAYS ).forEach( k => {
                if ( this.isDay( BIRTHDAYS[k], date ) ) {
                    stamp = '[ *B ]';
                    const d = BIRTHDAYS[k].d;
                    const capk = k.charAt( 0 ).toUpperCase() + k.toLowerCase().slice( 1 );
                    list += `\n${d}${d%10===1?'st':d%10===2?'nd':d%10===3?'rd':'th'}: **${capk}**'s Birthday :cake:`;
                }
            } );
            Object.keys( HOLIDAYS ).forEach( k => {
                if ( this.isDay( HOLIDAYS[k], date ) ) {
                    stamp = '[ *H ]';
                    const d = HOLIDAYS[k].d;
                    list += `\n${d}${d%10===1?'st':d%10===2?'nd':d%10===3?'rd':'th'}: **${HOLIDAYS[k].s}**`;
                }
            } );
            cal += stamp;
            if ( date.getDay() === 6 ) {
                cal += '\n';
            }
            date.setDate( date.getDate()+1 );
        }
        if ( date.getDay() !== 0 ) {
            cal += _.replace( '[    ]'.repeat( 7-date.getDay() ),/]\[/g,'  ' )+'`';
        }
        this.setAction( ACTIONS.MESSAGE, `${cal}\n${list.length>10?list:''}` );
    }

    nextHoliday() {
        const k = _.minBy( Object.keys( HOLIDAYS ), k => this.daysUntil( HOLIDAYS[k].m,HOLIDAYS[k].d ) );
        const daysUntil = this.daysUntil( HOLIDAYS[k].m,HOLIDAYS[k].d );
        const {s, m, d} = HOLIDAYS[k];
        this.setAction( ACTIONS.MESSAGE, `**${s}** is in ${daysUntil} days! ` +
            `(${MONTH_NAMES[m]} ${d}${d%10===1?'st':d%10===2?'nd':d%10===3?'rd':'th'})` );
    }

    allHolidays() {
        let msg = 'Holidays:';
        _.sortBy( Object.keys( HOLIDAYS ), k => this.daysUntil( HOLIDAYS[k].m,HOLIDAYS[k].d ) ).forEach( k => {
            const {m, d, s} = HOLIDAYS[k];
            msg += `\n**${s}**: ${MONTH_NAMES[m]} ${d}${d%10===1?'st':d%10===2?'nd':d%10===3?'rd':'th'}`;
        } );
        this.setAction( ACTIONS.MESSAGE, msg );
    }

    birthdayOf( user ) {
        const ucname = user.toUpperCase();
        if ( Object.keys( BIRTHDAYS ).includes( ucname ) ) {
            const {y, m, d} = BIRTHDAYS[ucname];
            this.setAction( ACTIONS.MESSAGE, `**${user}**'s Birthday is ${MONTH_NAMES[m]} ${d}${d%10===1?'st':d%10===2?'nd':d%10===3?'rd':'th'}, ${y}` );
        } else {
            this.setAction( ACTIONS.MESSAGE `Sorry, I could not find **${user}**'s Birthday` );
        }
    }

    nextBirthday() {
        const k = _.minBy( Object.keys( BIRTHDAYS ), k => this.daysUntil( BIRTHDAYS[k].m,BIRTHDAYS[k].d ) );
        const daysUntil = this.daysUntil( BIRTHDAYS[k].m,BIRTHDAYS[k].d );
        const lcname = k.toLowerCase();
        const capname = lcname.charAt( 0 ).toUpperCase() + lcname.slice( 1 );
        const {m, d} = BIRTHDAYS[k];
        this.setAction( ACTIONS.MESSAGE, `**${capname}**'s Birthday is in ${daysUntil} days! (${MONTH_NAMES[m]} ${d}${d%10===1?'st':d%10===2?'nd':d%10===3?'rd':'th'})` );
    }

    allBirthdays() {
        let msg = 'Birthdays:';
        _.sortBy( Object.keys( BIRTHDAYS ), k => this.daysUntil( BIRTHDAYS[k].m,BIRTHDAYS[k].d ) ).forEach( k => {
            const lcname = k.toLowerCase();
            const capname = lcname.charAt( 0 ).toUpperCase() + lcname.slice( 1 );
            const {m, d} = BIRTHDAYS[k];
            msg += `\n**${capname}**: ${MONTH_NAMES[m]} ${d}${d%10===1?'st':d%10===2?'nd':d%10===3?'rd':'th'}`;
        } );
        this.setAction( ACTIONS.MESSAGE, msg );
    }

    // HELPERS

    isDay( obj, day ) {
        return obj.m === day.getMonth()+1 && obj.d === day.getDate();
    }

    dayOfYear( month, day ) {
        const d = new Date();
        const now = d.getTime();
        d.setDate( day );
        d.setMonth( month-1 );
        const then = d.getTime();
        return Math.round( ( then-now )/( 24*3600*1000 ) );
    }

    daysUntil( m, d ) {
        const currentTime = new Date();
        const cm = currentTime.getMonth()+1;
        const cd = currentTime.getDate();

        let du = this.dayOfYear( m,d ) - this.dayOfYear( cm,cd );
        if ( du < 0 ) {
            const leapYearComingUp = ( currentTime.getFullYear()%4 === 0 );
            if ( leapYearComingUp && m > 2 || m === 2 && d === 29 ) {
                du += 1;
            }
            du += 365;
        }

        return du;
    }

    // eslint-disable-next-line no-unused-vars
    async payout( amnt ) {
        Object.values( BUCKS ).forEach( async id => {
            await bank.addAmount( id, amnt );
        } );
    }

}

module.exports = { calendar: new Calendar() };
