const { Component } = require("../component")

const ID = "help";

class Help extends Component {
    constructor() {
        super(ID);
        this.addCommand("-help (.*)", this.helpInfo);
        this.addCommand("-help$", this.help);
        this.addCommand("\\?help$", this.help);
        this.addCommand("\\?roll", this.rollHelp);
        this.addCommand("-help roll$", this.rollHelp);
        this.addCommand("\\?help roll", this.rollHelp);
        this.addCommand("\\?random", this.randomHelp);
        this.addCommand("-help random", this.randomHelp);
        this.addCommand("\\?help random", this.randomHelp);
        this.addCommand("\\?math", this.mathHelp);
        this.addCommand("-help math", this.mathHelp);
        this.addCommand("\\?help math", this.mathHelp);
        this.addCommand("\\?burger", this.burgerHelp);
        this.addCommand("-help burger", this.burgerHelp);
        this.addCommand("\\?help burger", this.burgerHelp);
    }

    help() {
        this.setAction("message",
            "commands:\n" +
            "`-roll` - Rolls a number in a given range.\n" +
            "`-random` - Returns a random element of a given list.\n" +
            "`-math` - Evaluates an expression.\n" +
            "`-burger` - Unleashes a sweet picture.\n"
        )
    }

    helpInfo(val, metaInfo) {
        if (metaInfo.commandMatchesCount === 1)
            this.setAction("message", "There is no help file for " + val + ". try just `-help` to see most commands.")
    }

    rollHelp() {
        this.setAction("message",
            "-roll\n" +
            "Rolls a number in a given range.\n" +
            "valid uses:\n" +
            "   `-roll <max>` - Rolls between 1 and max.\n" +
            "   `-roll <min> <max>` - Rolls between min and max."
        )
    }

    randomHelp() {
        this.setAction("message",
            "-random\n" +
            "Returns a random element of a given list.\n" +
            "valid use: `-random <list>` - Returns a random member of list.\n" +
            "List must contain at least two elements and can be space or comma delimited. Spaces take priority."
        )
    }

    mathHelp() {
        this.setAction("message",
            "-math\n" +
            "valid use: `-math <expression>` - Evaluates expression.\n" +
            "Accepted Operators are `+`, `-`, `*`, `/`, `**`, `()`."
        )
    }

    burgerHelp() {
        this.setAction("message",
            "-burger\n" +
            "Unleashes a sweet picture."
        )
    }
}

module.exports = { help: new Help() };