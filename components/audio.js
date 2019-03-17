const { Component } = require("../component");

const ID = "audio";

class Audio extends Component {
    constructor() {
        super(ID);
        this.addCommand("-play (.*)", this.playAudio);
    }

    playAudio(fileName) {
        if (fileName.includes("youtube") && fileName.includes("http"))
            this.setAction("audioYoutube", fileName);
        else
            this.setAction("audioFile", fileName);
    }
}

module.exports = { audio: new Audio() };