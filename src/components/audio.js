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
