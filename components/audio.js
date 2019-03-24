const { Component } = require('../component');
const _ = require('lodash');
const fs = require('fs');

const ID = 'audio';

class Audio extends Component {
    constructor() {
        super(ID);
        this.addCommand(/^-play random$/, this.playRandom);
        this.addCommand(/^!random$/, this.playRandom);
        this.addCommand(/^-play ([^/\\]+)$/, this.playAudio);
        this.addCommand(/^-end$/, this.endAudio);
        this.addCommand(/^!([^/\\]+)$/, this.playAudio);
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

    playRandom() {
        const f = _.sample(fs.readdirSync('./audio'));
        this.setAction('audioFile', f);
    }
}

module.exports = { audio: new Audio() };
