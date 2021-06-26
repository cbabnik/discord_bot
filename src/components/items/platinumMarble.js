const { Marble } = require( "./marble" )

class PlatinumMarble extends Marble {

    description() {
        return "OG. The Platinum Marble was first added in the alpha. Gives +20% income!"
             + "Check allowance to calculate your marble contributions!"
        }

    name = "Platinum Marble"
    image_loc = "gems/gems_add_144.png"
    item_type_id = 102

    income_percent = 20
}

module.exports = new PlatinumMarble()