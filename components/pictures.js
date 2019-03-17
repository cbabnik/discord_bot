const { Component } = require("../component");

const ID = "pictures";

class Pictures extends Component {
    constructor() {
        super(ID);
        this.addCommand("-burger", this.burger);
        this.addCommand("-add[bB]urger (.*)", this.addBurger);

        if (!this.json.burgers)
            this.json["burgers"] = [];
    }

    burger() {
        if (this.json["burgers"].length === 0)
            this.setAction("message", "Sorry, there are no burgers yet :(");
        else {
            const index = Math.floor(Math.random()*this.json["burgers"].length);
            const img = this.json["burgers"][index];
            this.setAction("imageLink", img);
        }
    }

    addBurger(link) {
        this.json["burgers"].push(link);
        this.saveJSON();
    }
}

module.exports = { pictures: new Pictures() };