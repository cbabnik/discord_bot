// manages active components and their default switch status

const { Component } = require( './component' );
const fs = require( 'fs' );
const _ = require( 'lodash' );
const { CONFIG, PERMISSION_LEVELS } = require( '../core/constants' );

const componentsEnabled = [
    'switchboard',
    'utility',
    'admin',
    'patchnotes',
    'statistics',
    'fun',
    'pictures',
    'calendar',
    'quotes',
    'requests',
    'bank',
    'payroll',
    'audio',
    'lottery',
    //'inventory',
    //'shop',
    'help']; // help has to go last
if ( CONFIG.VERSION == "alpha" ) {

}
if ( fs.existsSync( './secret.js' ) ) {
    componentsEnabled.push( 'secret' );
}

ON = ':white_check_mark:'
OFF = ':x:'
REPAIR = ':tools:'
LOCKED = ':lock:'
DISABLED = ':skull_crossbones:'
HIDDEN = 'HIDDEN'

const switchboard = {
    switchboard: { module: 'switchboard', status: LOCKED },
    help: { module: 'help', status: LOCKED },
    patchnotes: { module: 'patchnotes', status: LOCKED },
    statistics: { module: 'statistics', status: ON },
    utility: { module: 'utility', status: ON,
        subs: {
            random: { module: 'utility', status: ON },
            math: { module: 'utility', status: OFF },
            coinflip: { module: 'utility', status: ON },
            roll: { module: 'utility', status: ON },
            alias: { module: 'utility', status: ON },
            vote: { module: 'utility', status: ON },
        }},
    slots: { module: 'lottery', status: ON,
        subs: {
            cslots: { module: 'lottery', status: ON },
            gslots: { module: 'lottery', status: ON },
            mslots: { module: 'lottery', status: ON },
            pslots: { module: 'lottery', status: REPAIR },
            bgslots: { module: 'lottery', status: ON },
        }},
    fun: { module: 'fun', status: ON,
        subs: {
            brag: { module: 'fun', status: ON },
            win: { module: 'fun', status: ON },
        }},
    audio: { module: 'audio', status: ON,
        subs: {
            play: { module: 'audio', status: ON },
            live: { module: 'audio', status: ON },
            queueItUp: { module: 'audio', status: DISABLED },
        }},
    pictures: { module: 'pictures', status: ON,
        subs: {
            burger: { module: 'pictures', status: ON },
            waifu: { module: 'pictures', status: ON },
            rem: { module: 'pictures', status: ON },
        }},
    quotes: { module: 'quotes', status: ON },
    requests: { module: 'requests', status: ON },
    calendar: { module: 'calendar', status: ON },
    items: { module: undefined, status: LOCKED,
        subs: {
            bank: { module: 'bank', status: ON,
                subs: {
                    loan: { module: 'bank', status: DISABLED },
                    iou: { module: 'bank', status: ON },
                    allowance: { module: 'payroll', status: LOCKED },
                    bankruptcy: { module: 'bank', status: REPAIR },
                }},
            inventory: { module: 'inventory', status: REPAIR },
            profile: { module: 'inventory', status: REPAIR },
            shop: { module: 'shop', status: REPAIR },
        }},
}
const switches = {}

const ID = 'switchboard';
class SwitchBoard extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^####BUG####$/, () => {} ) // first command not recognized
        this.addCommand( /^#switch on (\S+)$/, (name, mi) => this.switch(name, true, mi), "switchboard" )
        this.addCommand( /^#switch off brag$/, this.bragSafeGuard, "switchboard" )
        this.addCommand( /^#switch off (\S+)$/, (name, mi) => this.switch(name, false, mi), "switchboard" )
        this.addCommand( /^#switchboard$/, this.switchboard, "switchboard" )
        this.addCommand( /^#features$/, this.switchboard, "switchboard" )
        this.addCommand( /^#switch /, this.switchHelp )

        this.switchboard_setup(switchboard)
    }

    switchHelp(metaInfo) {
        this.setAction("message", "Try `switch on <feature>`")
    }

    bragSafeGuard(metaInfo) {
        this.setAction("message", "I don't mean to brag.... buut")
        this.queueAction()
        this.setAction("delay", 2)
        this.setAction("message", `**${metaInfo.author}** tried to turn brag off and failed.`)
    }

    switchboard(metaInfo) {
        this.setAction( 'security', PERMISSION_LEVELS.ADMIN );
        if ( !PERMISSION_LEVELS.ADMIN.includes( metaInfo.authorId ) ) {
            return;
        }
        const msg = this.switchboard_helper(switchboard, 0)
        this.setAction( 'message', `.\n${msg}`)
    }
    switchboard_helper(board, indentLevel, off=false) {
        let output = ""
        Object.keys(board).forEach((name)=> {
            let swi = board[name];
            if (swi.status !== HIDDEN) {
                output += `${_.repeat("     ",indentLevel)}${swi.status}${name}\n`;
                if (swi.status !== REPAIR && swi.status !== OFF) {
                    if (swi['subs'])
                        output += this.switchboard_helper(swi.subs, indentLevel+1)
                }
            }
        })
        return output
    }

    switch( groupName, enabled, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        if ( !PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            return;
        }
        if (!Object.keys(switches).includes(groupName)) {
            this.setAction('message', 'not found')
            return
        }
        let swi = switches[groupName]
        if (swi.status != ON && swi.status != OFF) {
            this.setAction('reaction', '❌')
        } else {
            if (enabled)
                swi.status = ON
            else
                swi.status = OFF
            this.setAction('reaction', '✅')
        }
        this.storage.set(`preference.${groupName}`, enabled)
    }

    switch( groupName, enabled, metaInfo ) {
        this.setAction( 'security', PERMISSION_LEVELS.SUPERUSER );
        if ( !PERMISSION_LEVELS.SUPERUSER.includes( metaInfo.authorId ) ) {
            return;
        }
        if (!Object.keys(switches).includes(groupName)) {
            this.setAction('message', 'not found')
            return
        }
        let swi = switches[groupName]
        if (swi.status != ON && swi.status != OFF) {
            this.setAction('reaction', '❌')
        } else {
            if (enabled)
                swi.status = ON
            else
                swi.status = OFF
            this.setAction('reaction', '✅')
        }
        this.storage.set(`preference.${groupName}`, enabled)
    }

    // setup
    switchboard_setup(board, parent='') {
        Object.keys(board).forEach((name)=> {
            let swi = board[name];
            if (parent)
                swi['parent']=parent
            switches[name] = swi
            if (swi.module !== undefined && !componentsEnabled.includes(swi.module)) {
                swi.status = REPAIR
            }
            if (swi['subs'])
                this.switchboard_setup(swi['subs'], name)
        })
    }

    async bootUp() {
        const prefs = await this.storage.get('preference')
        Object.keys(prefs).forEach((pref) => {
            let swi = switches[pref]
            if (swi && (swi.status == ON || swi.status == OFF)) {
                if (prefs[pref]) {
                    swi.status = ON
                } else {
                    swi.status = OFF
                }
            }
        })
    }

    // API

    isEnabled( groupName ) {
        if ( groupName === undefined ) {
            return true
        }
        if (!Object.keys(switches).includes(groupName)) {
            return false
        }
        let swi = switches[groupName]
        do {
            if ( swi.status != ON && swi.status != LOCKED ) {
                return false
            } else {
                if ( swi.parent ) {
                    swi = switches[swi.parent]
                } else {
                    swi = undefined
                }
            }
        } while ( swi !== undefined )

        return true
    }
}

module.exports = { switchboard: new SwitchBoard(), filesToLoad: componentsEnabled };