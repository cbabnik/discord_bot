const { Component } = require( './component' );
const { BUCKS, PERMISSION_LEVELS } = require( '../core/constants' );

const ID = 'pictures';

const { PASTEBIN_USERNAME, PASTEBIN_PASSWORD, PASTEBIN_API_KEY } = require( '../../auth' )

const PastebinAPI = require('pastebin-js')
const pastebin = new PastebinAPI({
    'api_dev_key' : PASTEBIN_API_KEY,
    'api_user_name' : PASTEBIN_USERNAME,
    'api_user_password' : PASTEBIN_PASSWORD,
})

const BURGER_BIN = "AVzHYQFm"
const REM_BIN = "pcd5bd9z"
const WAIFU_BIN = "eYuUA9ty"
const TWOB_BIN = "cFEzEdZv"

class Pictures extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-bugs$/, this.bugs, 'pictures' );
        this.addCommand( /^-burger$/, () => this.pic(BURGER_BIN), 'burger' );
        this.addCommand( /^-waifu$/, () => this.pic(WAIFU_BIN), 'waifu' );
        this.addCommand( /^-rem$/, () => this.pic(REM_BIN), 'rem' );
        this.addCommand( /^-2[bB]$/, () => this.pic(TWOB_BIN), 'pictures' );
        this.addCommand( /^-burger +(\d+)$/, (idx) => this.pic(BURGER_BIN, idx), 'burger' );
        this.addCommand( /^-waifu +(\d+)$/, (idx) => this.pic(WAIFU_BIN, idx), 'waifu' );
        this.addCommand( /^-rem +(\d+)$/, (idx) => this.pic(REM_BIN, idx), 'rem' );
        this.addCommand( /^-2[bB] +(\d+)$/, (idx) => this.pic(TWOB_BIN, idx), 'pictures' );
        this.addCommand( /^#pic ?urls$/, this.picurls, 'pictures' );
    }

    picurls() {
        this.setAction( "security", PERMISSION_LEVELS.ADMIN )
        this.setAction( "message", `Pastebin urls for image collections:
Burgers - https://pastebin.com/${BURGER_BIN}
Waifus - https://pastebin.com/${WAIFU_BIN}
2b - https://pastebin.com/${TWOB_BIN}
Rem - https://pastebin.com/${REM_BIN}` )
    }

    async pic(bin, idx='random') {
        const paste = await pastebin.getPaste(bin)
        const imgs = paste.split('\r\n')
        if ( imgs.length === 0 ) {
            this.setAction( 'message', 'Sorry, there are no burgers yet :(' );
        } else {
            let index;
            if (idx === 'random') {
                index = Math.floor( Math.random()*imgs.length );
            } else {
                index = idx%imgs.length
            }
            const img = imgs[index];
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
