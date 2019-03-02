const { Component } = require("../component")

const ID = "lottery";

const Lottery = () => {
    const comp = Component(ID);

    const roll = (metaInfo) => {
        if (comp.json[metaInfo.author] === undefined)
            comp.json[metaInfo.author] = 0;
        const winsAmount = comp.json[metaInfo.author]+1;
        comp.json[metaInfo.author] = winsAmount;
        comp.setAction("message", "You win! This was your " + winsAmount + "th win.");
        comp.saveJSON();
        return comp.commitAction();
    };

    const getAmt = (author) => {
        const winsAmount = this.json[author];
        if (winsAmount !== undefined)
            return winsAmount;
    };

    comp.addCommand("\\+win", roll);

    return {
        getAllCommands: comp.getAllCommands,
        getAmt
    };
};

module.exports = { Lottery };