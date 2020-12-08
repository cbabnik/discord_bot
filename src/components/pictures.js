const { Component } = require( './component' );
const { BUCKS } = require( '../core/constants' );

const ID = 'pictures';

const { PASTEBIN_USERNAME, PASTEBIN_PASSWORD, PASTEBIN_API_KEY } = require( '../../auth' )

const PastebinAPI = require('pastebin-js')
const pastebin = new PastebinAPI({
    'api_dev_key' : PASTEBIN_API_KEY,
    'api_user_name' : PASTEBIN_USERNAME,
    'api_user_password' : PASTEBIN_PASSWORD,
})

class Pictures extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-burger/, () => this.pic("AVzHYQFm"), 'burger' );
        this.addCommand( /^-bugs$/, this.bugs, 'pictures' );
        this.addCommand( /^-pic$/, () => this.pic("tw7sXUeU"), 'pictures' );
        this.addCommand( /^-waifu$/, () => this.pic("eYuUA9ty"), 'waifu' );
        this.addCommand( /^-rem$/, () => this.pic("pcd5bd9z"), 'rem' );
        this.addCommand( /^-add ?pic[sS]$/, this.addpics, 'pictures' );
    }

    async pic(bin) {
        const paste = await pastebin.getPaste(bin)
        const imgs = paste.split('\r\n')
        if ( imgs.length === 0 ) {
            this.setAction( 'message', 'Sorry, there are no burgers yet :(' );
        } else {
            const index = Math.floor( Math.random()*imgs.length );
            const img = imgs[index];
            this.setAction( 'imageLink', img );
        }
    }

    async addpics() {
        this.setAction( 'message', 'Paste them here, one per line\nhttps://pastebin.com/tw7sXUeU' );
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
