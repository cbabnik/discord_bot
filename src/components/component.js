// boilerplate compatibility stuff for components, each component should extend this class

// this provides each component with its own
//     json storage file

// each component needs:
//     uniqueId
//     a publicly accessible [REGEX, CB] list.
//     a list of other services it uses.

const fs = require( 'fs' );
const { CONFIG } = require( '../core/constants' );
const Storage = require( '../core/pdata' );
const { CONFIG_DEFAULTS } = require( '../core/constants' );
const debug = require( 'debug' )( 'basic' );
const util = require( '../core/util' );
const _ = require( 'lodash' );

const DAYMS = 1000*60*60*24;

class Component {
    constructor( id ) {
        this.id = id;
        this.storage = await Storage( id );
        this.action = {};
        this.actionPart = this.action;
        this.commands = [];

        setTimeout( () => {
            this.bootUp();
        }, 3000 );
    }

    addCommand( regex, cb, help=false, groupName=this.id) {
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

    get( field, default_val=0 ) {
        this.storage.get(field, default_val)
    }

    set( field, value ) {
        this.storage.set(field, default_val)
    }

    update( field, operand, default_val=0, f = (a,b) => a+b ) {
        this.storage.apply(field, opearnd, default_val, f)
    }

    bootUp() {
        // to override if needed.
        // This triggers 3 seconds after constructor to allow several things to set up before actions are made
    }

    addScheduledEvent( time=util.time.today(), field='timestamps.default', delay=DAYMS ) {
        // TODO: add repeat = false option to scheduled events, or some manner of unscheduling
        if ( typeof time !== 'number' ) {
            time = time.getTime();
        }
        const currentTime = new Date().getTime();
        let lastTime;
        if ( currentTime <= time ) { // if passed time
            lastTime = time + Math.floor( ( currentTime-time )/delay )*delay;
        } else {
            lastTime = time - Math.ceil( ( time-currentTime )/delay )*delay;
        }
        const nextTime = lastTime+delay;
        const timestamp = this.get( field );
        if ( typeof timestamp === 'undefined' ) {
            this.scheduledEvent( -1, field );
            this.set( field, lastTime );
        } else {
            const misses =  Math.floor( ( currentTime - timestamp )/delay );
            if ( misses > 0 ) {
                this.set( field, lastTime );
                this.scheduledEvent( misses, field );
            }
        }
        setTimeout( () => {
            this.scheduledEvent( 0, field );
            this.set( field, new Date().getTime() );
            setInterval( () => {
                this.set( field, new Date().getTime() );
                this.scheduledEvent( 0, field );
            }, delay );
        }, nextTime - currentTime );
    }

    scheduledEvent() {
        // to override if needed. Should trigger at 12:00:30. params are [misses, field]
    }

    setActor( actor ) {
        // some components need to proactively fire off actions
        this.actor = actor;
    }

    bypassDispatcher() {
        if ( typeof this.actor === 'undefined' ) {
            debug( 'You can\'t bypass the dispatcher without setting the actor' );
        }
        const instructions = this.commitAction();
        this.actor.handle( instructions, null );
    }
}

module.exports = { Component };
