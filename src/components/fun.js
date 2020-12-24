const { Component } = require( './component' );
const _ = require( 'lodash' );
const { getId }  = require( '../core/util' );
const { PERMISSION_LEVELS, CONFIG } = require( '../core/constants' );
const { statistics } = require( './statistics' );

const ID = 'fun';

class Fun extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-[bB]rag$/, this.brag, "brag" );
        this.addCommand( /^-[hH]umble ?[bB]rag$/, this.humblebrag, "brag" );
        this.addCommand( /^-[wW][iI][nN]\!?$/, this.win, "win" );
        //this.addCommand( /^\+slots$/, this.kawaiiSlots, "fun" );
    }

    async brag ( metaInfo ) {
        const brags = await this.storage.get("brags")
        if ( brags ) {
            this.setAction( 'message', _.replace( _.sample( brags ), /USER/, `**${metaInfo.author}**` ) );
        } else {
            this.setAction( 'message', 'No brags found' );
        }
    }

    async humblebrag ( metaInfo ) {
        const brags = await this.storage.get("brags")
        if ( brags ) {
            this.setAction( 'message', `**${metaInfo.author}** doesn't mean to brag, but ...`)
            this.queueAction();
            this.setAction( 'delay' , 3 )
            await this.brag(metaInfo)
        } else {
            this.setAction( 'message', 'No brags found' );
        }
    }

    async win ( metaInfo ) {
        if (Math.random() < 0.01) {
            this.setAction( 'message', `You lose. suck it.` );
            this.storage.set(`wins.${metaInfo.authorId}`, 0)
        } else {
            const wins = await this.storage.add(`wins.${metaInfo.authorId}`)
            statistics.storage.set(`wins.${metaInfo.authorId}`, wins)
            const suffix = wins%100===1?"st":(wins%10===2&&wins%100!==12)?"nd":(wins%10===3&&wins%100!==13)?"rd":"th"
            this.setAction( 'message', `**${metaInfo.author}** won! This is **${metaInfo.author}**'s *${wins}${suffix}* win!` );
        }
    }

    async kawaiiSlots ( metaInfo ) {
        const id = metaInfo.authorId;
        const fruit = [":watermelon:",":cherries:",":strawberry:",":tangerine:",":lemon:",":apple:",":grapes:",":pear:"]
        let roll = [_.sample(fruit),_.sample(fruit),_.sample(fruit)]

        let won = false;
        if (roll[0] === roll[1] && roll[0] === roll[2]) won = true;
        let almost = false;
        if (roll[0] === roll[1] || roll[0] === roll[2] || roll[1] === roll[2]) almost = true;

        this.setAction("message",`**${metaInfo.author}** rolled the slots...
**[** ${roll.join("")} **]**
and ${won?"won! :tada:":almost?"almost won.":"lost..."}`)

        if (won) {
            statistics.add(`kawaii_slots.${id}.win`)
        } else if (almost) {
            statistics.add(`kawaii_slots.${id}.almost`)
        } else {
            statistics.add(`kawaii_slots.${id}.lose`)
        }
    }
}

module.exports = { fun: new Fun() };
