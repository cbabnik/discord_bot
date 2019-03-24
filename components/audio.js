const { Component } = require('../component');

const ID = 'audio';

class Audio extends Component {
    constructor() {
        super(ID);
        this.addCommand(/^-play (.*)/, this.playAudio);
        this.addCommand(/^-end$/, this.endAudio);
    }

    playAudio(fileName) {
        if (fileName.includes('youtube') && fileName.includes('http')) {
            this.setAction('audioYoutube', fileName);
        } else {
            this.setAction('audioFile', fileName);
        }
    }

    endAudio() {
        this.setAction('endAudio', true);
    }
}

module.exports = { audio: new Audio() };
