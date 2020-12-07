// manages active components and their default switch status

const { Component } = require( './component' );
const fs = require( 'fs' );
const _ = require( 'lodash' );
const { CONFIG, PERMISSION_LEVELS } = require( '../core/constants' );

const ID = 'patchnotes';
class PatchNotes extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^\?[pP]atch ?[nN]otes$/, this.patchNotesHistory, 'patchnotes' )
        this.addCommand( /^-[pP]atch ?[nN]otes$/, this.patchNotesLatest, 'patchnotes' )
        this.addCommand( /^-[pP]atch ?[nN]otes +minor$/, this.patchNotesLatest, 'patchnotes' )
        this.addCommand( /^-[pP]atch ?[nN]otes +list$/, this.patchNotesHistory, 'patchnotes' )
        this.addCommand( /^-[pP]atch ?[nN]otes +all$/, this.patchNotesHistory, 'patchnotes' )
        this.addCommand( /^-[pP]atch ?[nN]otes +history$/, this.patchNotesHistory, 'patchnotes' )
        this.addCommand( /^-[pP]atch ?[nN]otes +major$/, this.patchNotesMajor, 'patchnotes' )
        this.addCommand( /^-[pP]atch ?[nN]otes +(\d+.\d+.\d+)$/, this.patchNotes, 'patchnotes' )
        this.addCommand( /^\?[pP]atch ?[nN]otes +.*$/, this.patchNotesHistory, 'patchnotesHistory' )
    }

    patchNotesHistory() {
        let msg = "Patch History:"
        Object.keys(notes).forEach((ps) => {
            msg += `\n${ps} - ${oneline[ps]}`
        })
        msg += "\n\nUse \`-patch notes 0.1.0\` to see specific notes"
        this.setAction( 'message', msg )
    }

    patchNotesMajor() {
        let highest = "0.1.0"
        Object.keys(notes).forEach((number) => {
            if (number.endsWith(".0")) {
                highest = this.max(highest, number)
            }
        })
        this.patchNotes(highest)
    }

    patchNotesLatest() {
        let highest = "0.0.0"
        Object.keys(notes).forEach((number) => {
            highest = this.max(highest, number)
        })
        this.patchNotes(highest)
    }

    patchNotes(patchString) {
        if (!Object.keys(notes).includes(patchString)) {
            this.patchNotesHistory();
            console.log(patchString);
        }
        this.setAction( 'message', notes[patchString] )
        if ( Object.keys(banners).includes(patchString) ) {
            this.setAction( 'image', banners[patchString] )
        }
    }

    // helpers

    majorMinorPatch(patchString) {
        const regex = /^(\d+).(\d+).(\d+)$/
        const match = patchString.match(regex)
        const [ _, major, minor, patch ] = match
        console.log(patchString, match)
        return [Number(major),Number(minor),Number(patch)]
    }

    max(patchString1, patchString2) {
        const [mj1,mn1,p1] = this.majorMinorPatch(patchString1)
        const [mj2,mn2,p2] = this.majorMinorPatch(patchString2)
        if (mj1 > mj2) {
            return patchString1
        } else if (mj1 < mj2) {
            return patchString2
        }
        if (mn1 > mn2) {
            return patchString1
        } else if (mn1 < mn2) {
            return patchString2
        }
        if (p1 > p2) {
            return patchString1
        } else if (p1 < p2) {
            return patchString2
        }
        return patchString1
    }
}

notes = {
    "0.0.2" : `**PATCH 0.0.2**
+ Slots are fun now!
+ Coin slots now uses a weighted coin.
New Commands: \`-calendar -allBirthdays -nextBirthday -nextHoliday -allHolidays -queueItUp -bankruptcy -patchnotes -live -quote -newquote -brag\`
New Audio: \`prooh readygo\`

Sound effects now only happen if the user is in a voice channel, and it happens in the same voice channel they are in.
Live music can be played with \`-live url\`
`,
    "0.1.0" : `**PATCH 0.1.0 - THE BIG REFACTOR UPDATE**
aka the REVIVAL, aka the BETA UPDATE
Release Date: ~~Dec 31 2019~~ Dec 15 2020 (Happy Birthday Colton)
Release was delayed by Covid :yum: :fingers_crossed:

**REFACTORING FOR STABILITY**
+ Better logging
+ Better persistent storage, which saves immediately and is asyncronous (p.s. I hate js)
+ Way more unit tests
+ Tests run automatically before launching beta
+ Hosted on AWS bot, so Curtis' computer/internet is not an issue
+ Updated libraries that got security vulnerabilities
+ Registered new bucks! Welcome **Santahvetzorz**, **MillsyToe**, **Crenden**, **ArenYule**, **sepulchrimbus**, **shibelockwow**
* note that there are probably still crashes, and the bot will go down. but Curtis will get emails and better logs to aim for 24/7 available in the next bugfix updates.

**NEW FEATURES**
+ added \`-patchnotes\` cmd
+ added admin module (30 commands for debugging/control)
+ added switchboard module (\`-switchboard\`) for admins to toggle features
* added statistics module
+ Curtis gets emailed by buckbot whenever the bot crashes

**FRAMEWORK EXPANDED**
* support for reactions
* Buckbot has an email address
* Upgraded to Discord.js@12 API

**REMASTERING**
+ added \`-humble brag\`
+ colton.mp3 added
+
+
+

`
}
oneline = {
    "0.0.2" : "Slots are now fun!",
    "0.1.0" : "The Big Refactor Update",
}
banners = {
    "0.1.0" : "updates/bigrefactor.png",
}

module.exports = { patchnotes: new PatchNotes() };