const { Component } = require( './component' );
const _ = require( 'lodash' );
const fs = require( 'fs' );
const { CONFIG, ACTIONS, PERMISSION_LEVELS } = require( '../core/constants' );

const ID = 'audio';

class Audio extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-list/, this.playListHelp );
        this.addCommand( /^!list/, this.playListHelp );
        this.addCommand( /^-play random$/, this.playRandom );
        this.addCommand( /^!random$/, this.playRandom );
        this.addCommand( /^-endAudio$/, this.endAudio );
        this.addCommand( /^!end$/, this.endAudio );
        this.addCommand( /^-play ([^/\\]+)$/, this.playAudio );
        this.addCommand( /^!([^/\\]+)$/, this.playAudio );
        this.addCommand( /^-live (.+)$/, this.playYoutubeLive );
        this.addCommand( /^-play from([\d.]+) (.+)$/, this.playYoutube );
        this.addCommand( /^-play (.+)$/, ( url ) => this.playYoutube( 0, url ) );
        this.addCommand( /^! from([\d.]+) (.+)$/, this.playYoutube );
        this.addCommand( /^!(.+)$/, ( url ) => this.playYoutube( 0, url ) );
        //this.addCommand( /^-[qQ]ueue[- ]?[iI]t[- ]?[uU]p$/, ( metaInfo ) => this.queueItUp( 20, undefined, metaInfo ) );
        //this.addCommand( /^-[qQ]ueue[- ]?[iI]t[- ]?[uU]p (10|15|20) (.*)$/, this.queueItUp );
        //this.addCommand( /^-[qQ]ueue[- ]?[iI]t[- ]?[uU]p (.*)$/, ( url, metaInfo ) => this.queueItUp( 20, url, metaInfo ) );
        this.addCommand( /^#prepare queue (.*)$/, this.prepareQueue );
    }

    playListHelp() {
        this.setAction( 'audioFile', 'list' );
        this.playHelp();
    }

    playHelp() {
        const files = fs.readdirSync( 'res/audio' ).map( f => f.padEnd( 25 ) );
        this.setAction( 'message', 'Play a sound!\nEither `-play 20.mp3` or `!20` will work.\n' +
            _.chunk( files, 3 ).map( chunk => `\`${chunk.join( '' )}\`` ).join( '\n' )
        );
    }

    prepareQueue( url, metaInfo ) {
        if ( PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            const stack = _.get( this.json, 'qitup', [] );
            stack.push( url );
            this.json.qitup = stack;
        }
        this.setAction( ACTIONS.SECURITY, PERMISSION_LEVELS.SUPERUSER );
        this.setAction( ACTIONS.MESSAGE, 'Ok, Its ready for when its needed' );
    }

    queueItUp( delay, url, metaInfo ) {
        if ( !url ) {
            if ( this.json.qitup ) {
                url = this.json.qitup.pop();
                this.setAction( ACTIONS.MESSAGE, 'Queue what up? Hold on I\'ve got you.' );
                this.queueAction();
                this.setAction( ACTIONS.DELAY,2 );
                this.setAction( ACTIONS.MESSAGE, `Queue-It-Up Boys! ${url}` );
            }
            if ( !url ) {
                this.setAction( ACTIONS.MESSAGE, 'Queue what up?' );
                return;
            }
        } else {
            if ( metaInfo.channelId === CONFIG.MAIN_CHANNEL ) {
                this.setAction( ACTIONS.MESSAGE, 'Queue-It-Up Boys!' );
            } else {
                this.setAction( ACTIONS.CHANNEL_ID, CONFIG.MAIN_CHANNEL );
                this.setAction( ACTIONS.MESSAGE, `Queue-It-Up Boys! ${url}` );
            }
        }
        this.queueAction();
        this.setAction( ACTIONS.MESSAGE, `${delay} seconds. Get it ready and muted!` );
        this.setAction( ACTIONS.MESSAGE_ID, 'queueItUp' );
        this.setAction( ACTIONS.DELAY, 1 );
        this.queueAction();
        this.setAction( ACTIONS.EDIT_ID, 'queueItUp' );
        this.setAction( ACTIONS.MESSAGE, `${delay} seconds. Get it ready and muted! 3...2...1...` );
        this.setAction( ACTIONS.DELAY, delay-3 );
        this.queueAction();
        this.setAction( ACTIONS.AUDIO_FILE, 'readygo' );
        this.setAction( ACTIONS.DELAY, 0.90 );
        this.queueAction();
        this.setAction( ACTIONS.EDIT_ID, 'queueItUp' );
        this.setAction( ACTIONS.MESSAGE, `${delay} seconds. Get it ready and muted! 3...2...1... Go!` );
        this.setAction( ACTIONS.AUDIO_YOUTUBE, url );
        this.setAction( 'audioSeek', 1.4 );
        this.setAction( ACTIONS.END_AUDIO, true );
        this.setAction( ACTIONS.DELAY, 2.25 );
    }

    playAudio( fileName ) {
        if ( !fileName.includes( '.' ) ) {
            fileName += '.mp3';
        }
        if ( ! fs.existsSync( `./res/audio/${fileName}` ) ) {
            this.setAction( 'message', `I couldn't find that file: "${fileName}"` );
            return;
        }
        this.setAction( 'audioFile', fileName );
    }

    playYoutubeLive( url ) {
        if ( url && url.includes( 'youtube' ) || url.includes( 'youtu.be' ) ) {
            this.setAction( 'audioYoutubeLive', url ) ;
        } else {
            this.setAction( 'message', 'Try a file name or a youtube url' );
        }
    }

    playYoutube( seek, url ) {
        if ( seek > 45 ) {
            this.setAction( 'message', '30 seconds max on seek time. Cuz its freaking dumb. And expect a delay :/' );
            return;
        }
        if ( url.includes( 'youtube' ) || url.includes( 'youtu.be' ) ) {
            this.setAction( 'audioYoutube', url ) ;
            this.setAction( 'audioSeek', seek );
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
        const f = _.sample( fs.readdirSync( 'res/audio' ) );
        this.setAction( 'audioFile', f );
    }
}

module.exports = { audio: new Audio() };
