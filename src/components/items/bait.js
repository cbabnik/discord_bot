const { BaseItem } = require( "./base" )

class Bait extends BaseItem {

    description() {
        return "Basic bait for catching fish. If you have a fishing rod you can use \`-fish\`"
    }
    value() {
        return 10
    }

    name = "Bait"
    item_type_id = 1101
}

module.exports = new Bait()