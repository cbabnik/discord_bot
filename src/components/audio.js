const { Component } = require( './component' );
const _ = require( 'lodash' );
const fs = require( 'fs' );
const { CONFIG, ACTIONS, PERMISSION_LEVELS } = require( '../core/constants' );

const ID = 'audio';

const { statistics } = require( './statistics' )

class Audio extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-list/, this.playListHelp, 'play' );
        this.addCommand( /^!list/, this.playListHelp, 'play' );
        this.addCommand( /^-play random$/, this.playRandom, 'play' );
        this.addCommand( /^!random$/, this.playRandom, 'play' );
        this.addCommand( /^-endAudio$/, this.endAudio, 'play' );
        this.addCommand( /^!end$/, this.endAudio, 'play' );
        this.addCommand( /^-play ([^/\\]+)$/, this.playAudio, 'play' );
        this.addCommand( /^!([^/\\]+)$/, this.playAudio, 'play' );
        this.addCommand( /^-live (.+)$/, this.playYoutubeLive, 'live' );
        this.addCommand( /^-play from([\d.]+) (.+)$/, this.playYoutube, 'play' );
        this.addCommand( /^-play (.+)$/, ( url, mi  ) => this.playYoutube( 0, url, mi  ), 'play' );
        this.addCommand( /^! from([\d.]+) (.+)$/, this.playYoutube, 'play' );
        this.addCommand( /^!(.+)$/, ( url, mi ) => this.playYoutube( 0, url, mi  ), 'play' );
    }

    playListHelp(mi) {
        this.setAction( 'audioFile', 'list' );
        this.playHelp();
        statistics.add(`audio_played.${mi.authorId}.list`)
    }

    playHelp() {
        const files = fs.readdirSync( 'res/audio' ).map( f => f.padEnd( 25 ) );
        this.setAction( 'message', 'Play a sound!\nEither `-play 20.mp3` or `!20` will work.\n' +
            _.chunk( files, 3 ).map( chunk => `\`${chunk.join( '' )}\`` ).join( '\n' )
        );
    }

    playAudio( fileName, mi ) {
        if ( !fileName.includes( '.' ) ) {
            fileName += '.mp3';
        }
        if ( ! fs.existsSync( `./res/audio/${fileName}` ) ) {
            this.setAction( 'message', `I couldn't find that file: "${fileName}"` );
            return;
        }
        this.setAction( 'audioFile', fileName );
        statistics.add(`audio_played.${mi.authorId}.${fileName}`)
    }

    playYoutubeLive( url, mi ) {
        if ( url && url.includes( 'youtube' ) || url.includes( 'youtu.be' ) ) {
            this.setAction( 'audioYoutubeLive', url ) ;
        } else {
            this.setAction( 'message', 'Try a file name or a youtube url' );
        }
        statistics.add(`audio_played.${mi.authorId}.youtube`)
    }

    playYoutube( seek, url, mi ) {
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

        statistics.add(`audio_played.${mi.authorId}.youtube`)
    }

    endAudio(mi) {
        this.setAction( 'endAudio', true );
        statistics.add(`audio_ended.${mi.authorId}`)
    }

    playRandom(mi) {
        const f = _.sample( fs.readdirSync( 'res/audio' ) );
        this.setAction( 'audioFile', f );
        statistics.add(`audio_played.${mi.authorId}.random`)
    }
}

module.exports = { audio: new Audio() };
