const Storage = require('../src/core/pdata')
const { CONFIG_DEFAULTS } = require('../src/core/constants')

const expect = require('chai').expect
const sinon = require('sinon')

const fs = require('fs')

describe('core', () => {

    describe( 'storage', () => {
        let storage;
        beforeEach(() => {
            storage = Storage('coreA')
        });
        afterEach(() => {
            storage.storage.clearSync()
        });
        before(() => {
            if (!fs.existsSync(`${CONFIG_DEFAULTS.STORAGE_DIRECTORY}`)) {
                fs.mkdirSync(`${CONFIG_DEFAULTS.STORAGE_DIRECTORY}`)
            }
            if (!fs.existsSync(`${CONFIG_DEFAULTS.STORAGE_DIRECTORY}coreC`)) {
                fs.mkdirSync(`${CONFIG_DEFAULTS.STORAGE_DIRECTORY}coreC`)
            }
            fs.writeFileSync( `${CONFIG_DEFAULTS.STORAGE_DIRECTORY}coreC/0cc175b9c0f1b6a831c399e269772661`,
                              '{"key":"a","value":"d"}')
        })
        after(() => {
            fs.unlinkSync('backups/tmp.zip')
            fs.rmdirSync('storage/test/coreA')
            fs.rmdirSync('storage/test/coreB')
            fs.rmdirSync('storage/test/coreC')
        })

        // tests
        it( 'storage can create new directory and file', () => {
            storage.set('a','b')
            expect(storage.get('a')).to.equal('b')
        } );
        it( 'storage is unique by id', () => {
            storage.set('a','b')
            const storageB = Storage('coreB');
            storageB.set('a', 'c')
            expect(storage.get('a')).to.equal('b')
            expect(storageB.get('a')).to.equal('c')
            storageB.storage.clear()
        } );
        it( 'storage is overwritten', () => {
            storage.set('a', 'b')
            storage.set('a', 'c')
            expect(storage.get('a')).to.equal('c')
        } );
        it( 'storage is loaded', () => {
            const storageC = Storage('coreC')
            expect(storageC.get('a')).to.equal('d')
            storageC.storage.clear()
        } );
        // operations
        it( 'adding works', () => {
            expect(storage.get('a')).to.equal(0)
            storage.add('a',5);
            storage.add('a',3);
            storage.add('a',2);
            expect(storage.get('a')).to.equal(10)
        } );
        it( 'appending works', () => {
            expect(storage.get('a')).to.equal(0)
            storage.append('a','a')
            expect(storage.get('a')).to.eql(['a'])
            storage.append('a','b')
            storage.append('a','c')
            expect(storage.get('a')).to.eql(['a','b','c'])
        } );
        it( 'applying works', () => {
            expect(storage.get('a')).to.equal(0)
            storage.apply('a',5,0, Math.max)
            expect(storage.get('a')).to.equal(5)
            storage.apply('a',2,0, Math.max)
            expect(storage.get('a')).to.equal(5)
        } );

        // complex workings
        it( 'storage avoids race conditions', () => {
            storage.set('a', 0)
            asyncIncrement = async () => {
                storage.add('a')
            };
            for(let i = 0; i < 75; i++) {
                asyncIncrement()
            }
            expect(storage.get('a')).to.equal(75);
        } );
        it( 'backup creates a file', () => {
            storage.backupAllStorageNow('tmp');
            expect(fs.existsSync('backups/tmp.zip')).to.equal(true);
        } );
        // multi storage
        it( 'storage is shared by id', () => {
            const storageB = Storage('coreA');
            storage.set('a', 'd')
            expect(storageB.get('a')).to.equal('d')
        } );
        it( 'multi storage avoids race conditions', () => {
            expect(storage.get('a')).to.equal(0)
            const storageB = Storage('coreA')
            asyncIncrement = async () => {
                storage.add('a')
            };
            asyncIncrementB = async () => {
                storageB.add('a')
            };
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            expect(storage.get('a')).to.equal(60)
        } );
        // json stuff
        it( 'seperate out', () => {
            expect(storage.seperate_out('a.b')).to.eql(['a','b'])
            expect(storage.seperate_out('a.b.c')).to.eql(['a','b.c'])
        })
        it( 'json basic test', () => {
            storage.set('a.c', 'e')
            expect(storage.get('a.c')).to.equal('e')
        })
        it( 'json set test', () => {
            storage.set('a.b.c', 'd')
            storage.set('a.b.f', 'g')
            storage.set('a.c', 'e')
            expect(storage.get('a')).to.eql({
                b: {
                    c: 'd',
                    f: 'g'
                },
                c: 'e'
            })
            expect(storage.get('a.b')).to.eql({
                c: 'd',
                f: 'g'
            })
        } );
        it( 'json add race conditon test', () => {
            expect(storage.get('a.b.c')).to.equal(0)
            const storageB = Storage('coreA')
            asyncIncrement = async () => {
                storage.add('a.b.c')
            };
            asyncIncrementB = async () => {
                storageB.add('a.b.c')
            };
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            expect(storage.get('a.b.c')).to.equal(60)
        })

    } );
} ); 