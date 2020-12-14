let _ = require("lodash")

class BaseSlotMachine {

    // roll returns: {
    //     winnings: Integer
    //     buckRolls: Integer (0)
    //     frames: String[]
    //     frameDelay: Number
    //     increasingDelay: Number (0)
    //     images: String[] ([])
    // }
    roll() {}

    cost() {}

    onceAtATime() {
        return true;
    }
}

module.exports = { BaseSlotMachine }