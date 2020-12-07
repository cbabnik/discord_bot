const { statistics } = require( '../src/components/statistics' );

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

const util = require( '../src/core/util' );

describe( 'Statistics', () => {

    before(async () => {
        await statistics.storage.storage.clear()
        await statistics.storage.set("lottery_winnings", {
            "177955985225154560": {
                "cslots": 100,
                "gslots": 20,
                "mslots": 500,
            },
            "533749978955513856": {
                "cslots": 10,
                "gslots": 200,
                "mslots": 50,
            },
        })
        let sandbox = sinon.createSandbox();
        sandbox.stub( util, 'getUser' ).returns( "user_stub" );
    })
    
    describe( 'helpers', () => {
        it( 'find_depth', async () => {
            expect(statistics.find_depth({
                "a": {
                    "b" : "c"
                }
            })).to.equal(2)
        });
        it( 'replaceIndex', async () => {
            expect(statistics.replaceIndex("a.b.c.d","z",2)).to.equal("a.b.z.d")
        });
    } );

    describe( 'api', () => {
        it( 'can add values', async () => {
            await statistics.add("test.ok")
            await statistics.add("test.ok",5)
            expect(await statistics.storage.get("test.ok")).to.equal(6)
        } );
    } );

    describe( '-stats', () => {
        it( "handles +.+", async () => {
            await statistics.stats( "lottery_winnings.+.+", "+^v" );
            const result = statistics.commitAction();
            expect( result.message ).to.include( '880' );
        });
        it( "handles v.v", async () => {
            await statistics.stats( "lottery_winnings.v.v", "+^v" );
            const result = statistics.commitAction();
            expect( result.message ).to.include( '10' );
        });
        it( "handles ^.^", async () => {
            await statistics.stats( "lottery_winnings.^.^", "+^v" );
            const result = statistics.commitAction();
            expect( result.message ).to.include( '500' );
        });
        it( "handles &.^", async () => {
            await statistics.stats( "lottery_winnings.&.^", "+^v" );
            const result = statistics.commitAction();
            expect( result.message ).to.include( '200' );
            expect( result.message ).to.include( '500' );
        });
        it( "handles ^.+ [+^]", async () => {
            await statistics.stats( "lottery_winnings.^.+", "+^" );
            const result = statistics.commitAction();
            expect( result.message ).to.include( '620' );
        });
        it( "handles ^.+ [^+]", async () => {
            await statistics.stats( "lottery_winnings.^.+", "^+" );
            const result = statistics.commitAction();
            expect( result.message ).to.include( '800' );
        });
        it( "handles v.^ [^v]", async () => {
            await statistics.stats( "lottery_winnings.v.^", "^v" );
            const result = statistics.commitAction();
            expect( result.message ).to.include( '50' );
        });
        it( "handles v.^ [v^]", async () => {
            await statistics.stats( "lottery_winnings.v.^", "^v" );
            const result = statistics.commitAction();
            expect( result.message ).to.include( '50' );
        });
    } );
} );
