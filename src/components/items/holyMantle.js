let _ = require("lodash")
const util = require("../../core/util")

const { Relic } = require( "./relic" )

const mantleEffects = [
    '\'s student loans have been absolved.',
    ' doesn\'t need to pay his parking tickets.',
    ' can tap your girlfriend.',
    ' doesn\'t have to pay alimony.',
    ' doesn\'t have to pay his bar tab.',
    '\'s criminal record has been wiped clean.',
    ' can eat the last nacho.',
    ' can negate poop\'s affect in slots.',
    ' gets to ban Coltsu from his own server.',
    ' can ignore the effects of \'lost child\'.',
    ' can tap your credit card for dinner.',
    ' can roll his car unscathed.',
    ' can make Bugs play CounterStrike.',
    ' can\'t be put on pwobation.',
    ' can\'t be made fun of.',
    ' is not the father.',
];


class HolyMantle extends Relic {
    name = "MissingNo"
    item_type_id = 0

    use(who, args) {

    }

    holyMantle( n, metaInfo ){
        if ( metaInfo.authorId !== this.get( 'relics.holymantle.owner' ) ) {
            this.setAction( 'message', 'The holy mantle (currently) belongs to **Ginge**' );
            return;
        }
        const user = metaInfo.author;
        let str;
        if ( n === null ) {
            str = _.sample( mantleEffects );
        } else {
            n = Number( n );
            if ( n < mantleEffects.length ) {
                str = mantleEffects[n];
            } else {
                this.setAction( 'message', `**${user}** choose a number 0 through 15.` );
                return;
            }
        }
        this.setAction( 'message', `**${user}**${str}` );
    }
}

module.exports = { HolyMantle }