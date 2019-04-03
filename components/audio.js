const { Component } = require( '../component' );
const _ = require( 'lodash' );
const fs = require( 'fs' );

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
    }

    playAudio( fileName ) {
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
