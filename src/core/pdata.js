// persistent data storage
// uses node-persist and local data
// it might be good to use AWS database stuff in the future

const persist = require('node-persist');
const { Mutex } = require( 'async-mutex' );

const { time } = require( './util' );
const {CONFIG} = require( './constants' );

const archiver = require( 'archiver' );
const fs = require( 'fs' );
const _ = require( 'lodash' );

const debug = require( 'debug' )( 'basic' );

const supply_mutex = new Mutex();
StorageSupplier = async (id) => {
    await supply_mutex.acquire();
    if (id in pdata) {
        supply_mutex.release(); 
        return pdata[id]  
    }
    else {
        const storage = new Storage(id);
        pdata[id] = storage;
        await storage.storage.init()
        supply_mutex.release();
        return storage;
    }
};

class Storage {
    constructor( id ) {
        this.id = id;
        this.mutex = new Mutex();
        this.location = CONFIG.STORAGE_DIRECTORY+id;
        this.storage = persist.create( {dir: this.location} );
    }

    seperate_out(key) {
        if (typeof key !== "string") return [key, undefined]
        let idx = key.indexOf('.')
        if (idx === -1) return [key, undefined]
        return [key.substring(0,idx), key.substring(idx+1)]
    }

    async get( key, default_val=0 ) {
        await this.mutex.acquire()
        const [bin, field] = this.seperate_out(key)
        if (field === undefined) {
            const val = await this.storage.getItem(bin)
            this.mutex.release()
            return (val===undefined?default_val:val)
        }
        const json = await this.storage.getItem(bin)
        this.mutex.release()
        return (json===undefined?default_val:_.get( json, field, default_val ))
    }

    async getUnprotected( key, default_val=0 ) {
        const [bin, field] = this.seperate_out(key)
        if (field === undefined) {
            const val = await this.storage.getItem(bin)
            return (val===undefined?default_val:val)
        }
        const json = await this.storage.getItem(bin)
        return (json===undefined?default_val:_.get( json, field, default_val ))
    }

    async set( key, value ) {
        const [bin, field] = this.seperate_out(key)
        if (field === undefined) {
            await this.storage.setItem(bin,value)
        } else {
            let json = await this.storage.getItem(bin)
            if (json === undefined) json = {};
            _.set( json, field, value )
            await this.storage.setItem(bin, json)
        }
    }

    async hold( key, default_val=0 ) {
        await this.mutex.acquire()
        return await this.getUnprotected(key, default_val )
    }

    async letgo( key, value ) {
        await this.set( key, value )
        this.mutex.release()
    }

    async apply( key, argument, default_val, fn ) {
        const old_val = await this.hold(key, default_val)
        const new_val = fn(old_val, argument)
        await this.letgo(key, new_val)
        return new_val
    }

    async add( key, operand=1, default_val=0 ) {
        return await this.apply( key, operand, default_val, (a,b) => a+b );
    }

    async multiply( key, operand, default_val=1 ) {
        return await this.apply( key, operand, default_val, _.multiply );
    }

    async append( key, elem, default_val=[] ) {
        return await this.apply( key, elem, default_val, (arr, elem) => arr.concat([elem]) );
    }
}

const pdata = [];

module.exports = StorageSupplier;
