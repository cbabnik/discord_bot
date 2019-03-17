const { Component } = require("../component")

const bigInt = require("big-integer");

const ID = "utility";

class Utility extends Component {
    constructor() {
        super(ID);
        this.addCommand("-roll", this.rollInfo);
        this.addCommand("-roll (\\d+)$", (max) => this.roll(1,max));
        this.addCommand("-roll (-?\\d+) (-?\\d+)$", this.roll);
        this.addCommand("-random", this.randomInfo);
        this.addCommand("-random \\S+$", this.randomInfoB);
        this.addCommand("-random (\\S+(?: \\S+)+)$", this.random);
        this.addCommand("-random (\\S+(?:,[^\\s,]+)+)$", this.random);
    }

    rollInfo(metaInfo) {
        if (metaInfo.commandMatchesCount === 1)
            this.setAction("message", "Try `+roll [min] [max]`");
    }

    roll(min, max) {
        const result = bigInt.randBetween(min,max);
        this.setAction("message", result.toString());
    }

    randomInfo(metaInfo) {
        if (metaInfo.commandMatchesCount === 1)
            this.setAction("message", "Try `+random [a] [b] [c]`");
    }
    randomInfoB() {
        this.setAction("message", "You need more than one option to random between");
    }

    random(options) {
        if(options.includes(" "))
            options = options.split(" ");
        else
            options = options.split(",");

        const index = Math.floor(Math.random()*options.length);
        this.setAction("message", options[index]);
    }
}

module.exports = { utility: new Utility() };