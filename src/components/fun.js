const { Component } = require( './component' );
const _ = require( 'lodash' );
const { getId }  = require( '../core/util' );
const { PERMISSION_LEVELS, CONFIG } = require( '../core/constants' );

const ID = 'fun';

class Fun extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-[bB]rag$/, this.brag, "brag" );
        this.addCommand( /^-[hH]umble ?[bB]rag$/, this.humblebrag, "brag" );
        this.addCommand( /^-[wW][iI][nN]\!?$/, this.win, "win" );
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
        const wins = await this.storage.add(`wins.${metaInfo.authorId}`)
        const suffix = wins%10==2?"nd":wins%10==3?"rd":"th"
        this.setAction( 'message', `**${metaInfo.author}** won! This is **${metaInfo.author}**'s *${wins}${suffix}* win!` );
    }
}

module.exports = { fun: new Fun() };
