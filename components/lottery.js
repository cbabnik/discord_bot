const { Component } = require("../component")

const ID = "lottery";

class Lottery extends Component {
    constructor() {
        super(ID);
        this.addCommand("\\+win$", this.roll);
    }

    roll(metaInfo) {
        const {author} = metaInfo;
        if (this.json[author] === undefined)
            this.json[author] = 0;
        const winsAmount = this.json[author]+1;
        this.json[author] = winsAmount;
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