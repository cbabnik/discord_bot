const { BaseItem } = require( "./base" )

class Marble extends BaseItem {
    image_loc = "trophies/TrophyIcons_30_t.PNG"
    description() {
        return "This marble needs a description!"
             + "Check allowance to calculate your marble contributions!"}
    value() {250}
    unique = true
    giftable = true
    trashable = true

    income_bonus = 0
    income_percent = 0

    use() {
        component.setAction( "message", self.description() )
    }
}

module.exports = { Marble }