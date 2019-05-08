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
const { CONFIG_DEFAULTS } = require( './constants' );
const debug = require( 'debug' )( 'basic' );
const util = require( './util' );
const _ = require( 'lodash' );

const DAYMS = 1000*60*60*24;

class Component {
    constructor( id ) {
        this.id = id;
        this.jsonFile = CONFIG_DEFAULTS.STORAGE_DIRECTORY+id+'.json';
        this.json = require( this.jsonFile );
        this.action = {};
        this.actionPart = this.action;
        this.commands = [];

        setTimeout(() => {
            this.bootUp();
        }, 3000);
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
        // make this async, it should only be called on exit and once per hour
        if ( !fs.existsSync( this.jsonFile ) ) {
            fs.mkdir( CONFIG_DEFAULTS.STORAGE_DIRECTORY, {}, () => {} );
        }
        fs.writeFile( this.jsonFile, JSON.stringify( this.json ), 'utf8', () => {} );
    }

    get(field, default_val=0) {
        _.set(this.json, field, default_val);
    }

    set(field, value) {
        _.set(this.json, field, value);
    }

    update(field, operator, default_val=0, f = _.sum) {
        _.set(this.json, field, f( _.get(this.json, field, default_val) , operator) );
    }

    bootUp() {
        // to override if needed.
        // This triggers 3 seconds after constructor to allow several things to set up before actions are made
    }

    addScheduledEvent(time=util.time.today(), field='timestamps.default', delay=DAYMS) {
        // TODO: add repeat = false option to scheduled events, or some manner of unscheduling
        if (typeof time !== 'number') {
            time = time.getTime()
        }
        const currentTime = new Date().getTime();
        let lastTime;
        if (currentTime <= time) { // if passed time
            lastTime = time + Math.floor((currentTime-time)/delay)*delay;
        }
        else {
            lastTime = time - Math.ceil((time-currentTime)/delay)*delay;
        }
        const nextTime = lastTime+delay;
        const timestamp = this.get(field, undefined);
        if ( typeof timestamp === 'undefined' ) {
            this.scheduledEvent(0, field);
            this.set(field, lastTime);
        }
        const misses =  Math.floor((currentTime - timestamp)/delay);
        if (misses > 0) {
            this.set(field, lastTime);
            this.scheduledEvent(misses, field);
        }
        setTimeout( () => {
            this.scheduledEvent(0, field);
            setInterval( () => {
                this.set(field, lastTime);
            }, delay)
        }, nextTime)
    }

    scheduledEvent(misses, field) {
        // to override if needed. Should trigger at 12:00:30
    }

    setActor(actor) {
        // some components need to proactively fire off actions
        this.actor = actor;
    }

    bypassDispatcher() {
        if (typeof this.actor === 'undefined') {
            debug('You can\'t bypass the dispatcher without setting the actor');
        }
        const instructions = this.commitAction();
        this.actor.handle(instructions, null)
    }
}

module.exports = { Component };
