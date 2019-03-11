const { Component } = require("../component")

const ID = "example";

class Example extends Component {
    constructor() {
        super(ID);
        this.addCommand("\\+win$", this.win);
        this.addCommand("\\+countdown (\\d+)$", this.countdown);
        this.addCommand("\\+countdown$", () => this.countdown(5));
        this.addCommand("\\+delay (\\d+) (.*)$", this.delay);
        this.addCommand("\\+spam (\\d+) (.*)$", this.spam);
        this.addCommand('\\+alarm \\[(.*)\\] (.*)$', this.alarm);
        this.addCommand('\\+play (.*)$', this.playAudio);
        this.addCommand('\\+play$', () => this.playAudio("sample.mp3"));
        this.addCommand('\\+coinflip$', () => this.coinflip("", ""));
        this.addCommand('\\+coinflip (\\S+) (\\S+)$', this.coinflip);
        this.addCommand('\\+coinflip "(.*)" "(.*)"$', this.coinflip);
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

    playAudio(fileName) {
        this.setAction("audioFile", fileName);
    }

    coinflip(a, b) {
        if (Math.random() > 0.5) {
            this.setAction("message", a);
            this.setAction("image", "heads.jpg");
        }
        else {
            this.setAction("message", b);
            this.setAction("image", "tails.jpg");
        }
    }

    getAmt(author) {
        return this.json[author] || 0;
    }
}

module.exports = { example: new Example() };