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
        this.addCommand("-math", this.calculateInfo);
        this.addCommand("-math ([-\\+\\*\\/\\.\\d\\(\\)]*)$", this.calculate);
        this.addCommand('-coinflip$', () => this.coinflip("", ""));
        this.addCommand('-coinflip (\\S+) (\\S+)$', this.coinflip);
        this.addCommand('-coinflip "(.*)" "(.*)"$', this.coinflip);
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

    calculateInfo(metaInfo) {
        if (metaInfo.commandMatchesCount === 1)
            this.setAction("message", "Invalid use, try `?math` to learn more.");
    }

    // WARNING: be very careful to validate input for this function
    calculate(str) {
        try {
            const result = eval(str);
            this.setAction("message", "The result is: " + result.toString());
        } catch {
            this.setAction("message", "No value could be determined.");
        }
    }

    coinflip(a, b) {
        if (Math.random() >= 0.5) {
            this.setAction("message", a);
            this.setAction("image", "heads.jpg");
        }
        else {
            this.setAction("message", b);
            this.setAction("image", "tails.jpg");
        }
    }
}

module.exports = { utility: new Utility() };