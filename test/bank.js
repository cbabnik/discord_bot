const { bank } = require( '../components/bank' );
const util = require( '../util' );

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

sinon.stub( bank, 'saveJSON' );
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

    beforeEach( () => {
        bank.json = {
            '1': {'credits': 10},
            '2': {'credits': 10, 'buckbucks': 5},
        };
    } );

    describe( '-balance', () => {
        it( 'returns value', () => {
            bank.getAmount( false, metaInfo );
            const result = bank.commitAction();
            expect( result.message ).to.include( '10' );
        } );
    } );

    describe( '-give', () => {
        it( 'gives correctly', () => {
            bank.give( 'One', 5, metaInfo );
            expect( bank.balance( metaInfo.authorId ) ).to.equal( 5 );
            expect( bank.balance( '1' ) ).to.equal( 15 );
        } );
        it( 'doesnt give to nonexistant player', () => {
            bank.give( 'Three', 15, metaInfo );
            expect( bank.balance( metaInfo.authorId ) ).to.equal( 10 );
            expect( bank.balance( '1' ) ).to.equal( 10 );
        } );
        it( 'cant over give', () => {
            bank.give( 'One', 15, metaInfo );
            expect( bank.balance( metaInfo.authorId ) ).to.equal( 10 );
            expect( bank.balance( '1' ) ).to.equal( 10 );
        } );
        it( 'cant give negative', () => {
            bank.give( 'One', -5, metaInfo );
            expect( bank.balance( metaInfo.authorId ) ).to.equal( 10 );
            expect( bank.balance( '1' ) ).to.equal( 10 );
        } );
    } );
    describe( 'balance API', () => {
        it( 'returns value', () => {
            expect( bank.balance( metaInfo.authorId ) ).to.equal( 10 );
            expect( bank.balance( metaInfo.authorId, 'buckbucks' ) ).to.equal( 5 );
        } );
    } );

    describe( 'payAmount', () => {
        it( 'subtracts properly', () => {
            expect( bank.payAmount( '2', 5 ) ).to.equal( true );
            expect( bank.json['2']['credits'] ).to.equal( 5 );
        } );
        it( 'subtracts buckbucks', () => {
            expect( bank.payAmount( '2', 5, 'buckbucks' ) ).to.equal( true );
            expect( bank.json['2']['buckbucks'] ).to.equal( 0 );
            expect( bank.json['2']['credits'] ).to.equal( 10 );
        } );
        it( 'cant pay negative', () => {
            expect( bank.payAmount( '2', -5 ) ).to.equal( false );
            expect( bank.json['2']['buckbucks'] ).to.equal( 5 );
            expect( bank.json['2']['credits'] ).to.equal( 10 );
        } );
        it( 'cant make NaN', () => {
            expect( bank.payAmount( '2', 'Henry' ) ).to.equal( false );
            expect( bank.json['2']['buckbucks'] ).to.equal( 5 );
            expect( bank.json['2']['credits'] ).to.equal( 10 );
        } );
    } );

    describe( 'addAmount', () => {
        it( 'adds properly', () => {
            bank.addAmount( '2', 5 );
            expect( bank.json['2']['credits'] ).to.equal( 15 );
        } );
        it( 'adds negative fine', () => {
            bank.addAmount( '2', -5 );
            expect( bank.json['2']['credits'] ).to.equal( 5 );
        } );
        it( 'adds negative into negative values', () => {
            bank.addAmount( '2', -15 );
            expect( bank.json['2']['credits'] ).to.equal( -5 );
        } );
        it( 'adds buckbucks', () => {
            bank.addAmount( '2', 5, 'buckbucks' );
            expect( bank.json['2']['buckbucks'] ).to.equal( 10 );
            expect( bank.json['2']['credits'] ).to.equal( 10 );
        } );
        it( 'cant make NaN', () => {
            bank.addAmount( '2', 'Henry' );
            expect( bank.json['2']['buckbucks'] ).to.equal( 5 );
            expect( bank.json['2']['credits'] ).to.equal( 10 );
        } );
    } );
} );
