const { Component } = require( './component' );
const { statistics } = require( './statistics' );

const _ = require( 'lodash' );
const gm = require( 'gm' );
const sharp = require( 'sharp' );
const tmp = require( 'tmp' );
const { PERMISSION_LEVELS, ACTIONS, BUCKS } = require( '../core/constants' );

const util = require( '../core/util' );
const ID = 'inventory';

RELICS = {
    BROKEN_TIMEPIECE: 'brokentimepiece',
    MIKOTOS_AFFECTION: 'mikoto',
    EXCALIBUR: 'excalibur',
};

// enabled items
item_list = []
item_list.push(require(`./items/goldenMarble`))
item_list.push(require(`./items/platinumMarble`))
item_list.push(require(`./items/bait`))
const items_by_id = {}
item_list.forEach((it) => {
    items_by_id[it.item_type_id] = it
    items_by_id[`${it.item_type_id}`] = it
})

INV_SIZE = 31; // backpacks added later?

class Inventory extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^-inventory$/, this.getInventory );
        this.addCommand( /^-inv$/, this.getInventory );
        this.addCommand( /^\-inv +(.+)$/, this.look );
        this.addCommand( /^\-inventory +(.+)$/, this.look );
        this.addCommand( /^\?inv/, this.helpInventory );
        this.addCommand( /^-inventory /, this.helpInventory );
        this.addCommand( /^-inv /, this.helpInventory );
        //this.addCommand( /^-use (.*)$/, this.useItem );
        //this.addCommand( /^-gift ([^ ]+) (.*)$/, this.gift );
        //this.addCommand( /^#gift ([^ ]+) (.*)$/, this.adminGift );
        //this.addCommand( /^-[gG]ood ?[mM]orning ?[vV]ietnam$/, this.goodMorningVietnam );
        //this.addCommand( /-[hH]oly[mM]antle$/, ( metaInfo ) => this.holyMantle( null, metaInfo ) ) ;
        //this.addCommand( /-[hH]oly[mM]antle ?(\d+)/, this.holyMantle );
        // see who holds every relic
    }

    // should move to help
    
    helpInventory() {
        this.setAction("message", `Help for \`inv\` or \`inventory\`,
\`-inv\` to show inventory
\`-inv look 1\` to get details on first item
\`-inv look [item_name]\` to look at an item you have by name ex: \`-inv look sludge\`
\`-inv look B5\` to look at an item in second row, fifth column
\`-inv use X\` use item in slot X
\`-inv trash X\` trash an item in slot X
\`-inv move X Y\` trash an item in slot X to slot Y
\`-gift user X\` give an item in slot X to user **<not implemented>**
Slots go from 1-31. 1-8 on first row, 9-16 on second. etc
Can use the described item_name or A1 indexing for use, trash, and move
I wanted to make the UI much nicer, but I hate the nodejs library I used.
I'll probably prioritize other stuff`)
    }
    

    async getInventory( metaInfo ) {
        const id = metaInfo.authorId;

        let inv = await this.storage.get( `${id}`, {} )
        let img = await this.createInventoryImage(inv);

        this.setAction( 'image', img)
    }

    adminGift( to, item, metaInfo ) {
        item = item.toLowerCase().replace( /\s/g, '' );
        if ( !PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            this.setAction( 'message', 'You don\'t have permission to do that.' );
            return;
        }

        const toId = util.getId( to );
        if ( !toId ) {
            this.setAction( 'message', `user ${to} was not found.` );
            return;
        }
        const obj = this.get( `items.${item}` );
        if ( !obj ) {
            this.setAction( 'message', `item ${item} does not exist.` );
            return;
        }
        this.setAction( ACTIONS.MESSAGE, 'Success!' );
        this.getItem( toId, item );
    }


    async look( slot_input, mi ) {
        const slot = this.convertUserInputToSlot(slot_input)
        if (slot == false) {
            this.setAction("message", `Either the slot was empty or \`${slot_input}\` was invalid input.`)
            return
        }
        item = this.storage.get(`${mi.authorId}`)

        this.setAction("message", `Item: **${item.name}**
description: ${item.description()}`)
        this.setAction("image", item.icon())
    }

    // HELPERS

    async createInventoryImage( inv, selected=null ) {

        const img_width = 256;
        const gap_size = 32;

        const image = gm()

        for( var i = 0; i < 4; i++ ) {
            for( var j = 0; j < 8; j++ ) {
                const idx = i*8+j;
                let item_img_loc = null
                const type = _.get(inv,`${idx}.type`,null)
                if (type !== null) {
                    item_img_loc = items_by_id[`${type}`].icon()
                }
                if (idx == 31) {
                    image.in('-page', 
                            `+${(img_width+gap_size)*j+gap_size}`+ //x
                            `+${(img_width+gap_size)*i+gap_size}` /*y*/).in(
                        "res/icons/fishing/fishing_53_t.png"
                    )
                } else {
                    image.in('-page', 
                            `+${(img_width+gap_size)*j+gap_size}`+ //x
                            `+${(img_width+gap_size)*i+gap_size}` /*y*/).in(
                        item_img_loc
                    )
                }
            }
        }
        image.minify()
        image.mosaic();
        image.stroke("black",4).fill("#ffffffff").drawRectangle(0,0,128,128)

        const fileName = await tmp.tmpNameSync() + '.jpg';
        await image.write( fileName, (err) => {console.error(err)} );
        await new Promise(resolve => setTimeout(resolve, 250));

        return fileName;
    }

    async convertUserInputToSlot( val ) {
        if (!isNaN(val)){
            return parseInt(val)-1
        }
        if (str.lower().match(/^[abcd][12345678]$/)) {
            const char = str.toLowerCase()[0]
            const digit = parseInt(str[1])
            const char_val = (char.charCodeAt(0)-97)*8
            return char_val + digit - 1
        }
        const inv = await this.storage.get(user_id)
        for(var i = 0; i < INV_SIZE; i++) {
            const type_id = _.get(inv,`${i}.type`, null)
            if (type_id !== null) {
                if (val.toLowerCase() == items_by_id[type_id].name.toLowerCase()) {
                    return i;
                }
            }
        }

        return false;
    }

    // API

    async gainItem( user_id, item_id ) {
        console.log(item_id)
        console.log(items_by_id)
        const item = items_by_id[`${item_id}`]

        if (item.unique && await this.has(user_id, item_id) !== false) {
            return false
        }

        console.log(item)

        const inv = await this.storage.get(user_id)
        for (var slot = 0; slot < INV_SIZE; slot++) {
            if (!_.get(inv,`${slot}`, null)) {
                await this.storage.set(`${user_id}.${slot}`, item.create())
                console.log("created?")
                break
            }
        }
        return false;
    }
    async moveItem( user_id, from_slot, to_slot ) {
        if (await this.slotEmpty(user_id, from_slot)) {
            return false;
        } else if(! (await this.slotEmpty(user_id, to_slot))) {
            return false;
        }

        const slot = await this.slotOf(user_id, item_uuid)
        await this.set(`${user_id}.${slot}`, null)
    }
    async slotEmpty( user_id, slot) {
        const inv = await this.storage.get(user_id)
        if (!_.get(inv,`${slot}`, null)) {
            return true
        }
        return false;
    }
    async slotOf( user_id, item_uuid ) {
        const inv = await this.storage.get(user_id);
        for (var slot = 0; slot < INV_SIZE; slot++) {
            if (_.get(inv,`${slot}.uuid`, null) == item_uuid) {
                return slot
            }
        }
        return false
    }
    async has( user_id, item_id ) {
        const inv = await this.storage.get(user_id);
        for (var slot = 0; slot < INV_SIZE; slot++) {
            if (_.get(inv,`${slot}.type`, null) == item_id) {
                return slot
            }
        }
        return false
    }

}

module.exports = { inventory: new Inventory() };
