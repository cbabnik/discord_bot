const { BaseSlotMachine } = require( "./base" )
const _ = require("lodash")

class CoinSlotMachine extends BaseSlotMachine {

    roll(user) {
        let chain = 0;
        let frames = []
        for ( ; Math.random() < 0.505; ) {
            chain += 1;
            frames.push(this.newFrame(user,chain,false))
        }
        frames.push(this.newFrame(user,chain,true))

        return {
            winnings: chain,
            frames,
            frameDelay: 0.6,
            increasingDelay: 0.2,
        }
    }

    cost() {
        return 1;
    }

    newFrame(user, chain, done) {
        return `**${user}** rolled the slots! (Costed 1 credit)
Coin Slots - Keep flipping till you lose!
${_.repeat(":moneybag:", chain)}${done?':x:':''}
Reward: ${chain}$`
    }
}

module.exports = new CoinSlotMachine()