const uuidv4 = require( 'uuidv4' );

class BaseItem {

    // name
    name = "MissingNo"
    item_type_id = 0

    // image
    image_loc = "fishing/fishing_05_t.PNG"

    // returns description string
    description() {return "No description has been set for this item yet!"}

    // this can't be accessed by the user and for now is just for calculating things like slots payout
    value() {return 0}

    relic = false // only one person owns each relic
    unique = false // each person can have one of a unique item
    giftable = true // give away the item
    trashable = true // get rid of the item

    use(who, args) {
        component.setAction( "message", this.description() )
    }
    icon() {
        return this.icons_folder + this.image_loc
    }
    extra_data() {
        return {}
    }

    // stuff that doesn't get overridden
    // =================================
    icons_folder = "res/icons/"
    loseItem() {
        // logic for inventory to lose this item
    }
    create() {
        return {
            type: this.item_type_id,
            uuid: uuidv4(),
            extra: this.extra_data()
        }
    }
}

module.exports = { BaseItem }