const { Component } = require("../component")

const ID = "example";

class Example extends Component {
    constructor() {
        super(ID);
        this.addCommand("\\+win$", this.win);
    }

    win(metaInfo) {
        const {author} = metaInfo;
        const winsAmt = this.json[author]+1 || 1;
        this.json[author] = winsAmt;
        this.saveJSON();
        this.setAction("message", "You win! This was your " + winsAmt +
            (winsAmt%10===1?"st":winsAmt%10===2?"nd":winsAmt%10===3?"rd":"th") + " win.");
    }

    countdown(metaInfo) {
    }

    delay(metaInfo) {
    }

    spam(metaInfo) {
    }

    getAmt(author) {
        return this.json[author] || 0;
    }
}

module.exports = { example: new Example() };