const { BaseItem } = require( "./base" )

class Relic extends BaseItem {
    description() {return "This relic has not yet awakened!"}
    value() {return 1000}
    relic = true
    unique = true
    giftable = false
    trashable = false
}

module.exports = { Relic }