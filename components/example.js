const { Component } = require("../component")

const ID = "example";

class Example extends Component {
    constructor() {
        super(ID);
        this.addCommand("\\+win$", this.win);
        this.addCommand("\\+countdown (\\d+)$", this.countdown);
        this.addCommand("\\+delay (\\d+) (.*)$", this.delay);
        this.addCommand("\\+spam (\\d+) (.*)$", this.spam);
        this.addCommand('\\+alarm \\[(.*)\\] (.*)$', this.alarm);
    }

    win(metaInfo) {
        const {author} = metaInfo;
        const winsAmt = this.json[author]+1 || 1;
        this.json[author] = winsAmt;
        this.saveJSON();
        this.setAction("message", "You win! This was your " + winsAmt +
            (winsAmt%10===1?"st":winsAmt%10===2?"nd":winsAmt%10===3?"rd":"th") + " win.");
    }

    countdown(amount) {
        if (amount > 10)
            amount = 10;
        for (let a = amount; a > 0; a-=1){
            this.setAction("message", a+"...");
            this.setAction("delay", 1);
            if (amount > 1)
                this.queueAction();
        }
    }

    delay(seconds, message) {
        this.setAction("delay", parseInt(seconds));
        this.setAction("message", message);
    }

    alarm(timedate, message) {
        this.setAction("message", "Alarm set.");
        this.queueAction();
        this.setAction("timing", timedate);
        this.setAction("message", "ALARM: " + message);
    }

    spam(times, message) {
        this.setAction("repeat", parseInt(times));
        this.setAction("message", message);
    }

    getAmt(author) {
        return this.json[author] || 0;
    }
}

module.exports = { example: new Example() };