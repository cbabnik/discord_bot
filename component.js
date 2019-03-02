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

const fs = require('fs');

const Component = (id) => {

    const jsonFile = "./storage/"+id+".json";
    let json = require(jsonFile);
    let action = {};
    let actionPart = action;
    let commands = [];

    const addCommand = (regex, cb) => {
        commands.push({regex, cb});
    };

    const getAllCommands = () => {
        return commands;
    };

    const setAction = (option, value) => {
        actionPart[option] = value;
    };

    const queueAction = () => {
        actionPart.next = {};
        actionPart = actionPart.next;
    };

    const commitAction = () => {
        const temp = action;
        this.action = {};
        return temp;
    };

    const saveJSON = () => {
        fs.writeFile( jsonFile, JSON.stringify( json ), "utf8", (err) => {})
    };

    return {
        id,
        json,
        addCommand,
        getAllCommands,
        setAction,
        queueAction,
        commitAction,
        saveJSON,
    };
};

module.exports = { Component };