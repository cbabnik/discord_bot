const { Component } = require( './component' );
const fs = require( 'fs' );
const _ = require( 'lodash' );
const util = require( '../core/util' );
const { BUCKS } = require( '../core/constants' );


// sum + / each & / min v, max^
// <stat>.<user>.<subcategories>
const ID = 'statistics';
class Statistics extends Component {
    constructor() {
        super( ID );
        this.addCommand( /^\-stat(?:istic)?s +((?:[\w\+^&v]+)(?:[\. ][\w\+^&v]+)*) +\[([\+^v]{1,3})\]$/, this.stats, "statistics" )
        this.addCommand( /^\-stat(?:istic)?s +((?:[\w\+^&v]+)(?:[\. ][\w\+^&v]+)*)$/, (a, mi) => this.stats(a, "+^v", mi), "statistics" )
        this.addCommand( /^-stat(?:istic)?s list$/, this.listCats, "statistics" )
        this.addCommand( /^\?stat(?:istic)?s.*$/, this.statsHelp, "statistics" )
        this.addCommand( /^-stat(?:istic)?s.*$/, this.statsHelp, "statistics" )
    }

    async stats(field_string, order, mi) {
        field_string = field_string.replace(".sum", ".+")
        field_string = field_string.replace(" sum", ".+")
        field_string = field_string.replace(".min", ".v")
        field_string = field_string.replace(" min", ".v")
        field_string = field_string.replace(".max", ".^")
        field_string = field_string.replace(" max", ".^")
        field_string = field_string.replace(".all", ".&")
        field_string = field_string.replace(" all", ".&")
        field_string = field_string.replace(".me", "."+mi.author)
        field_string = field_string.replace(" me", "."+mi.author)
        if (!order.includes("+")) {
            order = order + "+"
        }
        if (!order.includes("v")) {
            order = order + "v"
        }
        if (!order.includes("^")) {
            order = order + "^"
        }
        const pieces = field_string.split(/[\. ]/)
        let given_depth = pieces.length -1;
        let [category, user, subcategories] = [pieces.shift(), pieces.shift(), pieces]
        if ( ["&","^","+","v"].includes(category)) {
            this.setAction("message", "Can't use wildcards on first statistic field. Try \`?statistics\` for more info")
            return
        } else if ( !(await this.storage.storage.keys()).includes(category) ) {
            this.setAction("message", `No data for \`${category}\` statistic.`)
            this.queueAction()
            await this.listCats();
            return
        }
        const stat_data = await this.storage.get(category)
        let fields = [];
        const depth = this.find_depth(stat_data)
        if (given_depth < 1) {
            user = '&'
            given_depth = 1
        }
        if (given_depth < depth) {
            for (var i = given_depth; i < depth; i++) {
                subcategories.push("&")
            }
        } else if (given_depth > depth) {
            this.setAction("message", `Too many subcategories provided for ${category}. Try \`-stats <user>\` to peek at the subcats`)
            return
        }
        if ( ["&","^","+","v"].includes(user)) {
            Object.keys(stat_data).forEach((userId) => {
                fields.push(userId)
            })
        } else {
            const userId = util.getId(user);
            fields.push(userId)
            if ( userId === undefined ) {
                this.setAction("message", `Sorry, user **${user}** not recognized`)
                return;
            }
        }
        subcategories.forEach((subcat) => {
            let length = fields.length;
            while (length > 0) {
                const f = fields.shift()
                const subdata = _.get(stat_data, f)
                if ( ["&","^","+","v"].includes(subcat)) {
                    try {
                        Object.keys(subdata).forEach((key) => {
                            fields.push(f+"."+key)
                        })
                    } catch {
                        fields.push(key)
                    }
                } else {
                    fields.push(f+"."+subcat)
                }
                length = length - 1;
            }
        })
        const keys = [user, ...subcategories]
        for (var i = 0; i < order.length; i++) {
            const next = order[i];
            if (next == "+") {
                for (var j = 0; j < keys.length; j++) {
                    const key = keys[j]
                    if (key == "+") {
                        const new_fields = new Set([]);
                        fields.forEach((f) => {
                            const new_f = this.replaceIndex(f, '%', j)
                            const val =  _.get(stat_data,f,0) + _.get(stat_data,new_f,0)
                            _.set(stat_data, new_f, val)
                            new_fields.add(new_f)
                        })
                        fields = [ ...new_fields ];
                    }
                }
            }
            if (next == "^") {
                for (var j = 0; j < keys.length; j++) {
                    const key = keys[j]
                    if (key == "^") {
                        const owners = {}
                        fields.forEach((f) => {
                            const new_f = this.replaceIndex(f, '%', j)
                            const old_val = _.get(stat_data,new_f,Number.MIN_SAFE_INTEGER)
                            const challenger_val = _.get(stat_data,f,Number.MIN_SAFE_INTEGER)
                            if (challenger_val > old_val) {
                                if (field_string.includes("+") && order.indexOf("+") > order.indexOf("^")) {
                                    owners[new_f] = new_f;
                                } else {
                                    owners[new_f] = f;
                                }
                            }
                            const val =  Math.max(challenger_val , old_val )
                            _.set(stat_data, new_f, val)
                        })
                        fields = [ ...Object.values(owners) ];
                    }
                }
            }
            if (next == "v") {
                for (var j = 0; j < keys.length; j++) {
                    const key = keys[j]
                    if (key == "v") {
                        const owners = {}
                        fields.forEach((f) => {
                            const new_f = this.replaceIndex(f, '%', j)
                            const old_val = _.get(stat_data,new_f,Number.MAX_SAFE_INTEGER)
                            const challenger_val = _.get(stat_data,f,Number.MAX_SAFE_INTEGER)
                            if (challenger_val < old_val) {
                                if (field_string.includes("+") && order.indexOf("+") > order.indexOf("v")) {
                                    owners[new_f] = new_f;
                                } else {
                                    owners[new_f] = f;
                                }
                            }
                            const val =  Math.min(challenger_val , old_val )
                            _.set(stat_data, new_f, val)
                        })
                        fields = [ ...Object.values(owners) ];
                    }
                }
            }
        }

        let msg = `${category}:`
        fields = fields.sort()
        fields.forEach((f) => {
            let title;
            const pieces = f.split(".", 2)
            if (pieces[0].match(/\d{18}/)) {
                let displayUser
                if (["+"].includes(user)) {
                    displayUser = ""
                } else {
                    displayUser = `**${util.getUser(pieces[0])}** `
                }
                title = `${displayUser}${f.substr(19,f.length)}`
            } else {
                title = f
            }
            title = title.replace("%.","")
            title = title.replace(".%","")
            title = title.replace("%","")
            // replace in title
            
            const val = _.get(stat_data, f)
            if (val !== undefined && val !== Number.MAX_SAFE_INTEGER && val !== Number.MIN_SAFE_INTEGER) {
                msg = `${msg}\n${title}: \`${val}\``
            }
            Object.keys(BUCKS).forEach((key) => {
                const id = BUCKS[key];
                msg = _.replace(msg, new RegExp(`user#${id}`,'g'), key.toLowerCase() );
                msg = _.replace(msg, new RegExp(`${id}`,'g'), key.toLowerCase() );
            })
        })
        if( msg.length > 2000 ) {
            this.setAction("message", "This list is too long. Please subcategorize. Try \`-stats\` for more info.")
        } else {
            this.setAction("message", msg)
        }
    }

    async statsHelp() {
        const msg = `syntax: \`-stats <statistic> <user> <subcategories...>\`
Example: \`-stats feature_used Lunes.roll\` will show how many times Lunes used a roll command

If you don't provide user or subcategories, all will be printed
Example: \`-stats feature_used\` lists all the features all users used

More complex usage:
Wild cards can be used to \`sum\` up, \`max\`, or \`min\` specified fields
E.G. \`-stats lottery_winnings sum.sum\` or \`-stats lottery_winnings +.+\` will show the total winnings/losses with slot machine
E.G. \`-stats lottery_winnings all.max\` or \`-stats lottery_winnings &.+\` will show for every user, the slot machine they won the most with

Even more complex usage:
If you'd like to specify the order wildcards are specfied, append an ordered list like \`[+^v\]\` to the cmd.
E.G. \`-stats lottery_winnings ^.+ [+^]\` shows the user whos won the most in total in slots
E.G. \`-stats lottery_winnings ^.+ [^+]\` shows the sum of each players best slot machine
E.G. \`-stats lottery_winnings v.^ [^v]\` shows the user who has has the smallest winnings on their best slot machine
E.G. \`-stats lottery_winnings v.^ [v^]\` shows which machine was least cruel to the person it was most cruel to.
`
        this.setAction("message", msg)
        this.queueAction()
        await this.listCats()
    }

    async listCats() {
        let msg = "Statistics available:"
        const keys = await this.storage.storage.keys()
        this.setAction("message", `Statistics available: ${keys.map((k) => `\`${k}\``).join(",")}`)
    }

    // helpers

    replaceIndex(str, by, index) {
        let pieces = str.split('.')
        pieces[index] = by
        return pieces.join('.')
    }

    find_depth(obj) {
        if (typeof obj !== "object" || obj === null ) {
            return 0;
        } else if (obj.length === 0) {
            return 1;
        }
        return this.find_depth(Object.values(obj)[0]) + 1;
    }

    // api

    async add( key, operand=1, default_val=0 ) {
        return await this.storage.add(key,operand,default_val)
    }
}

module.exports = { statistics: new Statistics() };
