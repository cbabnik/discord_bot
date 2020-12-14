const { BaseSlotMachine } = require( "./base" )
const _ = require("lodash")
const { statistics } = require( '../statistics' );
const { bank } = require( '../bank' );
const { pictures } = require( '../pictures' );
const gm = require( 'gm' );
const tmp = require( 'tmp' );
const { BUCKS } = require( '../../core/constants' )

class BuckSlotMachine extends BaseSlotMachine {

    async roll(user, id) {
        const bag = ['eight', 'seven', 'one', 'buck', 'bee', 'scary', 'girl', 'kiwi'];
        const roll = [_.sample( bag ), _.sample( bag ), _.sample( bag )];

        let winnings = 0;
        let cuties = false; // assume false but set true
        let won = true; // assume true but set false

        let strNum = '';
        let resultStr = '';
        let giveVal;
        switch ( roll.join( ',' ) ) {
        case 'eight,seven,one':
            statistics.add(`lottery_buckwins.${id}.871`)
            winnings = 871;
            resultStr = 'Huge lotto win! You won a great 871 credits!';
            break;
        case 'seven,seven,seven':
            statistics.add(`lottery_buckwins.${id}.777`)
            winnings = 777;
            resultStr = 'Big lotto win! You won a nice 777 credits!';
            break;
        case 'seven,buck,seven':
            statistics.add(`lottery_buckwins.${id}.7buck7`)
            bank.addAmount( id, 7, 'buckbucks' );
            resultStr = 'Great lotto buck win! You won 7 buck bucks!';
            break;
        case 'buck,buck,buck':
            statistics.add(`lottery_buckwins.${id}.ultimate_buck`)
            bank.addAmount( id, 25, 'buckbucks' );
            resultStr = 'You got the ultimate win!!! 25 buck bucks awarded!';
            break;
        case 'bee,bee,bee':
            statistics.add(`lottery_buckwins.${id}.bugs`)
            bank.addAmount( id, 3, 'buckbucks' );
            resultStr = 'Nice win! 3 buck bucks! This also unlocks the `-bugs` picture command';
            pictures.unlockBugs();
            break;
        case 'scary,scary,scary':
            statistics.add(`lottery_buckwins.${id}.tommi`)
            bank.addAmount( id, 3, 'buckbucks' );
            resultStr = 'Bad win! TOMmi gets 100 of your credits or bankrupts you. You do get 3 buck bucks however.';
            giveVal = Math.min( 100, Math.max( 0, (await bank.balance( id )) ) );
            winnings = -giveVal;
            await bank.addAmount( BUCKS.TOMMI, giveVal );
            break;
        case 'girl,girl,girl':
            statistics.add(`lottery_buckwins.${id}.waifu`)
            bank.addAmount( id, 3, 'buckbucks' );
            resultStr = 'Nice win! 3 buck bucks awarded.';
            cuties = true;
            break;
        case 'kiwi,kiwi,kiwi':
            statistics.add(`lottery_buckwins.${id}.kiwi`)
            bank.addAmount( id, 3, 'buckbucks' );
            resultStr = 'Nice win! 3 buck bucks awarded.';
            // is it kewe audio here
            break;
        default:
            won = false;
            // consolation prizes
            roll.forEach( ( elem ) => {
                switch ( elem ) {
                case 'eight':
                    strNum += '8';
                    break;
                case 'seven':
                    strNum += '7';
                    break;
                case 'one':
                    strNum += '1';
                    break;
                }
            } );
            if ( strNum.length > 2 ) {
                strNum = strNum.slice( 0,2 );
                roll[2] = 'scary';
            }
            winnings = Number( strNum );
            if ( winnings ) {
                resultStr = `Consolation prize: **${winnings}** credits!`;
            } else {
                resultStr = 'Sorry, you lost.';
            }
        }
        const fileName = await this.createImage( roll );

        /*
        if ( cuties ) {
            // where to put cuties back if im not cheap
        }

        */

        // where to message colton if i put back

        return {
            winnings,
            frames: [
                `**${user}**'s roll: ${resultStr}` 
            ],
            images: [
                fileName
            ]
        }
    }

    cost() {
        return 0;
    }

    async createImage( triple ) {
        const image = gm( 'res/images/leftbrace.jpg' );
        triple.forEach( ( elem ) => {
            image.append( `res/images/${elem}.jpg`, true );
        } );
        image.append( 'res/images/rightbrace.jpg', true );
        const fileName = await tmp.tmpNameSync() + '.jpg';
        await image.write( fileName, (err) => {console.error(err)} );
        
        await new Promise(resolve => setTimeout(resolve, 100));

        return fileName;
    }
}

module.exports = new BuckSlotMachine()