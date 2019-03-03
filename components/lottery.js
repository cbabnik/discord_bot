const { Component } = require("../component")

const ID = "lottery";

class Lottery extends Component {
    constructor() {
        super(ID);
        this.addCommand("\\+win$", this.roll);
    }

    roll(metaInfo) {
        if (this.json[metaInfo.author] === undefined)
            this.json[metaInfo.author] = 0;
        const winsAmount = this.json[metaInfo.author]+1;
        this.json[metaInfo.author] = winsAmount;
        this.setAction("message", "You win! This was your " + winsAmount + "th win.");
        this.saveJSON();
    }

    getAmt(author) {
        const winsAmount = this.json[author];
        if (winsAmount !== undefined)
            return winsAmount;
    }
}

module.exports = { Lottery };