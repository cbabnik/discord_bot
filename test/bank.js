const { bank } = require( '../src/components/bank' );
const util = require( '../src/core/util' );

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

sinon.stub( util, 'getId' ).callsFake( ( user ) => {
    switch ( user ) {
    case 'One': return '1';
    case 'Two': return '2';
    }
} );

const metaInfo = {
    authorId: '2',
    author: 'Two',
};

describe( 'Bank', () => {

    beforeEach( async () => {
        await bank.storage.storage.clear()
        await bank.storage.set("1", {'credits': 10})
        await bank.storage.set("2", {'credits': 10, 'buckbucks': 5})
    } );

    before( async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    describe( '-balance', () => {
        it( 'returns value', async () => {
            await bank.getAmount( false, metaInfo );
            const result = bank.commitAction();
            expect( result.message ).to.include( '10' );
        } );
    } );

    describe( '-give', () => {
        it( 'gives correctly', async () => {
            await bank.give( 'One', 5, metaInfo );
            expect( await bank.balance( metaInfo.authorId ) ).to.equal( 5 );
            expect( await bank.balance( '1' ) ).to.equal( 15 );
        } );
        it( 'doesnt give to nonexistant player', async () => {
            await bank.give( 'Three', 15, metaInfo );
            expect( await bank.balance( metaInfo.authorId ) ).to.equal( 10 );
            expect( await bank.balance( '1' ) ).to.equal( 10 );
        } );
        it( 'cant over give', async () => {
            await bank.give( 'One', 15, metaInfo );
            expect( await bank.balance( metaInfo.authorId ) ).to.equal( 10 );
            expect( await bank.balance( '1' ) ).to.equal( 10 );
        } );
        it( 'cant give negative', async () => {
            await bank.give( 'One', -5, metaInfo );
            expect( await bank.balance( metaInfo.authorId ) ).to.equal( 10 );
            expect( await bank.balance( '1' ) ).to.equal( 10 );
        } );
    } );
    describe( 'balance API', () => {
        it( 'returns value', async () => {
            expect( await bank.balance( metaInfo.authorId ) ).to.equal( 10 );
            expect( await bank.balance( metaInfo.authorId, 'buckbucks' ) ).to.equal( 5 );
        } );
    } );

    describe( 'payAmount', () => {
        it( 'subtracts properly', async () => {
            expect( await bank.payAmount( '2', 5 ) ).to.equal( true );
            expect( await bank.storage.get('2.credits') ).to.equal( 5 );
        } );
        it( 'subtracts buckbucks', async () => {
            expect( await bank.payAmount( '2', 5, 'buckbucks' ) ).to.equal( true );
            expect( await bank.storage.get('2.buckbucks') ).to.equal( 0 );
            expect( await bank.storage.get('2.credits') ).to.equal( 10 );
        } );
        it( 'cant pay negative', async () => {
            expect( await bank.payAmount( '2', -5 ) ).to.equal( false );
            expect( await bank.storage.get('2.buckbucks') ).to.equal( 5 );
            expect( await bank.storage.get('2.credits') ).to.equal( 10 );
        } );
        it( 'cant make NaN', async () => {
            expect( await bank.payAmount( '2', 'Henry' ) ).to.equal( false );
            expect( await bank.storage.get('2.buckbucks') ).to.equal( 5 );
            expect( await bank.storage.get('2.credits') ).to.equal( 10 );
        } );
    } );

    describe( 'addAmount', () => {
        it( 'adds properly', async () => {
            await bank.addAmount( '2', 5 );
            expect( await bank.storage.get('2.credits') ).to.equal( 15 );
        } );
        it( 'adds negative fine', async () => {
            await bank.addAmount( '2', -5 );
            expect( await bank.storage.get('2.credits') ).to.equal( 5 );
        } );
        it( 'adds negative into negative values', async () => {
            await bank.addAmount( '2', -15 );
            expect( await bank.storage.get('2.credits') ).to.equal( -5 );
        } );
        it( 'adds buckbucks', async () => {
            await bank.addAmount( '2', 5, 'buckbucks' );
            expect( await bank.storage.get('2.buckbucks') ).to.equal( 10 );
            expect( await bank.storage.get('2.credits') ).to.equal( 10 );
        } );
        it( 'cant make NaN', async () => {
            await bank.addAmount( '2', 'Henry' );
            expect( await bank.storage.get('2.buckbucks') ).to.equal( 5 );
            expect( await bank.storage.get('2.credits') ).to.equal( 10 );
        } );
    } );
} );
