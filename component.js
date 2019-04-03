// boilerplate compatibility stuff for components, each component should extend this class

// this provides each component with its own
//     json storage file

// each component needs:
//     uniqueId
//     a publicly accessible [REGEX, CB] list.
//     a list of other services it uses.

// down the line there should be some mechanism for service update hotswapping. the list of services would be ids
// point to a central service collection object. For now the list of other services are simply references to the
// components themselves

const fs = require( 'fs' );

class Component {
    constructor( id ) {
        this.id = id;
        this.jsonFile = './storage/'+id+'.json';
        if ( !fs.existsSync( this.jsonFile ) ) {
            fs.mkdir( './storage/', {}, () => {} );
            fs.writeFileSync( this.jsonFile, '{}' );
        }
        this.json = require( this.jsonFile );
        this.action = {};
        this.actionPart = this.action;
        this.commands = [];
    }

    addCommand( regex, cb ) {
        this.commands.push( {regex, cb} );
    }

    getAllCommands() {
        return this.commands;
    }

    setAction( option, value ) {
        this.actionPart[option] = value;
    }

    queueAction() {
        this.actionPart.next = {};
        this.actionPart = this.actionPart.next;
    }

    commitAction() {
        const temp = this.action;
        this.action = {};
        this.actionPart = this.action;
        return temp;
    }

    saveJSON() {
        fs.writeFile( this.jsonFile, JSON.stringify( this.json ), 'utf8', () => {} );
    }
}

module.exports = { Component };