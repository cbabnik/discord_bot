
class BaseSlotMachine {

    // roll returns: {
    //     winnings: Integer
    //     buckRolls: Integer (0)
    //     frames: String[]
    //     frameDelay: Number
    //     increasingDelay: Number (0)
    // }
    roll() {}

    cost() {}

    onceAtATime() {
        return true;
    }

    useLodashInContext() {
        // should ONLY be run in test environments!
        _ = _.runInContext();
    }
}

module.exports = { BaseSlotMachine }