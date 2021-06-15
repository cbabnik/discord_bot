const { Marble } = require( "./marble" )

class GoldenMarble extends Marble {

    description() {
        return "OG. The Golden Marble was first added in the alpha. Gives +10% income!"
             + "Check allowance to calculate your marble contributions!"
        }

    name = "Golden Marble"
    image_loc = "gems/117.png"
    item_type_id = 101

    income_percent = 10
}

module.exports = new GoldenMarble()