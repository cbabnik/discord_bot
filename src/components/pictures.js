const { Component } = require( './component' );
const { BUCKS } = require( '../core/constants' );

const ID = 'pictures';

class Pictures extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-burger/, this.burger );
        this.addCommand( /^-add[bB]urger (.*)/, this.addBurger );
        this.addCommand( /^-bugs$/, this.bugs );

        if ( !this.json.burgers ) {
            this.json['burgers'] = [];
        }
    }

    burger() {
        if ( this.json['burgers'].length === 0 ) {
            this.setAction( 'message', 'Sorry, there are no burgers yet :(' );
        } else {
            const index = Math.floor( Math.random()*this.json['burgers'].length );
            const img = this.json['burgers'][index];
            this.setAction( 'imageLink', img );
        }
    }

    addBurger( link, metaInfo ) {
        if ( metaInfo.authorId === BUCKS.BUGSLINGER ) {
            if ( !link.includes( 'http' ) ) {
                this.setAction( 'message', 'Please submit a URL LINK to an image instead.' );
            } else {
                this.setAction( 'message', 'Burger saved.' );
                this.json['burgers'].push( link );
            }
        } else {
            this.setAction( 'message', 'Bugs only bro.' );
        }
    }

    bugs() {
        if ( this.json['bugs'] !== 'unlocked' ) {
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
        this.json['bugs'] = 'unlocked';
    }
}

module.exports = { pictures: new Pictures() };
