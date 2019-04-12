const { Component } = require( '../component' );
const _ = require( 'lodash' );
const fs = require( 'fs' );
const { CONFIG_DEFAULTS, ACTIONS } = require( '../constants' );

const ID = 'audio';

class Audio extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-play random$/, this.playRandom );
        this.addCommand( /^!random$/, this.playRandom );
        this.addCommand( /^-endAudio$/, this.endAudio );
        this.addCommand( /^!end$/, this.endAudio );
        this.addCommand( /^-play ([^/\\]+)$/, this.playAudio );
        this.addCommand( /^!([^/\\]+)$/, this.playAudio );
        this.addCommand( /^-play (.+)$/, this.playYoutube );
        this.addCommand( /^!(.+)$/, this.playYoutube );
        this.addCommand( /^-[qQ]ueue[- ]?[iI]t[- ]?[uU]p (10|15|20) (.*)$/, this.queueItUp );
        this.addCommand( /^-[qQ]ueue[- ]?[iI]t[- ]?[uU]p (.*)$/, (url, metaInfo) => this.queueItUp(20, url, metaInfo) );
    }

    queueItUp( delay, url, metaInfo ) {
        if (metaInfo.channelId === CONFIG_DEFAULTS.MAIN_CHANNEL ) {
            this.setAction(ACTIONS.MESSAGE, 'Queue-It-Up Boys!');
        } else {
            this.setAction(ACTIONS.CHANNEL_ID, CONFIG_DEFAULTS.MAIN_CHANNEL );
            this.setAction(ACTIONS.MESSAGE, `Queue-It-Up Boys! ${url}`);
        }
        this.queueAction();
        this.setAction(ACTIONS.MESSAGE, `${delay} seconds. Get it ready and muted!`);
        this.setAction(ACTIONS.MESSAGE_ID, 'queueItUp');
        this.setAction(ACTIONS.PRIME_AUDIO, url);
        this.setAction(ACTIONS.DELAY, 1);
        this.queueAction();
        this.setAction(ACTIONS.EDIT_ID, 'queueItUp');
        this.setAction(ACTIONS.MESSAGE, `${delay} seconds. Get it ready and muted! 3...2...1...`);
        this.setAction(ACTIONS.DELAY, delay-3);
        this.queueAction();
        this.setAction(ACTIONS.AUDIO_YOUTUBE, url);
        this.setAction(ACTIONS.PLAY_PRIMED, ACTIONS.YES);
        this.setAction(ACTIONS.DELAY, 2);
        this.queueAction();
        this.setAction(ACTIONS.EDIT_ID, 'queueItUp');
        this.setAction(ACTIONS.MESSAGE, `${delay} seconds. Get it ready and muted! 3...2...1... Go!`);
        this.setAction(ACTIONS.DELAY, 1.3);
    }

    playAudio( fileName ) {
        if ( !fileName.includes( '.' ) ) {
            fileName += '.mp3';
        }
        if ( ! fs.existsSync( `./audio/${fileName}` ) ) {
            this.setAction( 'message', `I couldn't find that file: "${fileName}"` );
            return;
        }
        this.setAction( 'audioFile', fileName );
        this.setAction( 'audioFile', fileName );
    }

    playYoutube( url ) {
        if ( url.includes( 'youtube' ) || url.includes( 'youtu.be' ) ) {
            this.setAction( 'audioYoutube', url ) ;
        } else if ( url.includes( 'http' ) ) {
            this.setAction( 'audioLink', url ) ;
        } else {
            this.setAction( 'message', 'Try a file name or a youtube url' );
        }
    }

    endAudio() {
        this.setAction( 'endAudio', true );
    }

    playRandom() {
        const f = _.sample( fs.readdirSync( './audio' ) );
        this.setAction( 'audioFile', f );
    }
}

module.exports = { audio: new Audio() };
