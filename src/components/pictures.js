const { Component } = require( './component' );
const { BUCKS } = require( '../core/constants' );

const ID = 'pictures';

class Pictures extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-burger/, this.burger );
        this.addCommand( /^-add[bB]urger (.*)/, this.addBurger );
        this.addCommand( /^-bugs$/, this.bugs );
    }

    async burger() {
        const burgers = await this.storage.get('burgers', [])
        if ( burgers.length === 0 ) {
            this.setAction( 'message', 'Sorry, there are no burgers yet :(' );
        } else {
            const index = Math.floor( Math.random()*burgers.length );
            const img = burgers[index];
            this.setAction( 'imageLink', img );
        }
    }

    async bugs() {
        if ( this.storage.get('bugs') !== 'unlocked' ) {
            return;
        }
        switch ( Math.floor( 5*Math.random() ) ) {
        case 0: this.setAction( 'imageLink', 'https://cdn.discordapp.com/attachments/237428400724115456/562223278660255744/1f41d.png' ); break;
        case 1: this.setAction( 'imageLink', 'https://cdn.discordapp.com/attachments/237428400724115456/562223280489234444/bugs_celebrates_christmas.png' ); break;
        case 2: this.setAction( 'imageLink', 'https://cdn.discordapp.com/attachments/237428400724115456/562223282082938880/punished_bugs.png' ); break;
        case 3: this.setAction( 'imageLink', 'https://cdn.discordapp.com/attachments/237428400724115456/562223284049936384/smirk_bugs.png' ); break;
        case 4: this.setAction( 'imageLink', 'https://cdn.discordapp.com/attachments/237428400724115456/562223424634748944/1f41d.png' ); break;
        }
    }

    // API

    unlockBugs() {
       this.storage.set('bugs', 'unlocked')
    }
}

module.exports = { pictures: new Pictures() };
