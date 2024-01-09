const Storage = require('../src/core/pdata')
const { CONFIG } = require('../src/core/constants')

const expect = require('chai').expect
const sinon = require('sinon')

const fs = require('fs')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('core', () => {

    describe( 'storage', () => {
        let storage;
        beforeEach(async () => {
            storage = await Storage('coreA')
        });
        afterEach(async () => {
            await storage.storage.clear()
        });
        before(() => {
            if (!fs.existsSync(`${CONFIG.STORAGE_DIRECTORY}`)) {
                fs.mkdirSync(`${CONFIG.STORAGE_DIRECTORY}`)
            }
            if (!fs.existsSync(`${CONFIG.STORAGE_DIRECTORY}coreC`)) {
                fs.mkdirSync(`${CONFIG.STORAGE_DIRECTORY}coreC`)
            }
        })
        after(() => {
            fs.rmdirSync('storage/test/coreA', { recursive: true })
            fs.rmdirSync('storage/test/coreB', { recursive: true })
            fs.rmdirSync('storage/test/coreC', { recursive: true })
        })

        // tests
        it( 'storage can create new directory and file', async () => {
            await storage.set('a','b')
            expect(await storage.get('a')).to.equal('b')
        } );
        it( 'hold and letgo work', async () => {
            await storage.hold('a')
            await storage.letgo('a','b')
            expect(await storage.get('a')).to.equal('b')
        } );
        it( 'storage is unique by id', async () => {
            await storage.set('a','b')
            const storageB = await Storage('coreB');
            await storageB.set('a', 'c')
            expect(await storage.get('a')).to.equal('b')
            expect(await storageB.get('a')).to.equal('c')
            await storageB.storage.clear()
        } );
        it( 'storage is overwritten', async () => {
            await storage.set('a', 'b')
            await storage.set('a', 'c')
            expect(await storage.get('a')).to.equal('c')
        } );
        // operations
        it( 'adding works', async () => {
            expect(await storage.get('a')).to.equal(0)
            await storage.add('a',5);
            await storage.add('a',3);
            await storage.add('a',2);
            expect(await storage.get('a')).to.equal(10)
        } );
        it( 'appending works', async () => {
            expect(await storage.get('a')).to.equal(0)
            await storage.append('a','a')
            expect(await storage.get('a')).to.eql(['a'])
            await storage.append('a','b')
            await storage.append('a','c')
            expect(await storage.get('a')).to.eql(['a','b','c'])
        } );
        it( 'applying works', async () => {
            expect(await storage.get('a')).to.equal(0)
            await storage.apply('a',5,0, Math.max)
            expect(await storage.get('a')).to.equal(5)
            await storage.apply('a',2,0, Math.max)
            expect(await storage.get('a')).to.equal(5)
        } );

        // complex workings
        it( 'storage avoids race conditions', async () => {
            await storage.set('a', 0)
            asyncIncrement = async () => {
                await storage.add('a')
            };
            for(let i = 0; i < 75; i++) {
                asyncIncrement()
            }
            await sleep(250)
            expect(await storage.get('a')).to.equal(75);
        } );
        /*
        it( 'backup creates a file', () => {
            storage.backupAllStorageNow('tmp');
            expect(fs.existsSync('backups/tmp.zip')).to.equal(true);
        } );
        */
        // multi storage
        it( 'storage is shared by id', async () => {
            const storageB = await Storage('coreA');
            await storage.set('a', 'd')
            expect(await storageB.get('a')).to.equal('d')
        } );
        it( 'multi storage avoids race conditions', async () => {
            expect(await storage.get('a')).to.equal(0)
            const storageB = await Storage('coreA')
            asyncIncrement = async () => {
                await storage.add('a')
            };
            asyncIncrementB = async () => {
                await storageB.add('a')
            };
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            await sleep(250)
            expect(await storage.get('a')).to.equal(60)
        } );
        // json stuff
        it( 'seperate out', () => {
            expect(storage.seperate_out('a.b')).to.eql(['a','b'])
            expect(storage.seperate_out('a.b.c')).to.eql(['a','b.c'])
        })
        it( 'json basic test', async () => {
            await storage.set('a.c', 'e')
            expect(await storage.get('a.c')).to.equal('e')
        })
        it( 'json set test', async () => {
            await storage.set('a.b.c', 'd')
            await storage.set('a.b.f', 'g')
            await storage.set('a.c', 'e')
            expect(await storage.get('a')).to.eql({
                b: {
                    c: 'd',
                    f: 'g'
                },
                c: 'e'
            })
            expect(await storage.get('a.b')).to.eql({
                c: 'd',
                f: 'g'
            })
        } );
        it( 'json add race conditon test', async () => {
            expect(await storage.get('a.b.c')).to.equal(0)
            const storageB = await Storage('coreA')
            asyncIncrement = async () => {
                await storage.add('a.b.c')
            };
            asyncIncrementB = async () => {
                await storageB.add('a.b.c')
            };
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            for (let i = 0; i < 10; i++) { asyncIncrement() }
            for (let i = 0; i < 10; i++) { asyncIncrementB() }
            await sleep(250)
            expect(await storage.get('a.b.c')).to.equal(60)
        })

    } );
} ); 