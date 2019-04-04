const { utility } = require( '../components/utility' );

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

sinon.stub( utility, 'saveJSON' );

describe( 'Utility', () => {

    describe( '-random', () => {
        it( 'check comma seperated values', () => {
            utility.random( 1, 'a,b,c' );
            const result = utility.commitAction();
            expect( ['a', 'b', 'c'] ).to.include( result.message );
        } );
        it( 'check space seperated values', () => {
            utility.random( 1, 'a b c' );
            const result = utility.commitAction();
            expect( ['a', 'b', 'c'] ).to.include( result.message );
        } );
        it( 'check that spaces take priority', () => {
            utility.random( 1, 'a,b c,d' );
            const result = utility.commitAction();
            expect( ['a,b', 'c,d'] ).to.include( result.message );
        } );
    } );

    describe( '-roll', () => {
        it( 'check negative values', () => {
            utility.roll( '-5', '-5' );
            const result = utility.commitAction();
            expect( result.message ).to.equal( '-5' );
        } );
        it( 'check big values', () => {
            utility.roll( '10000000000000000000000', '10000000000000000000000' );
            const result = utility.commitAction();
            expect( result.message ).to.equal( '10000000000000000000000' );
        } );
    } );

    describe( '-math', () => {
        it( 'evaluates complicated expressions', () => {
            utility.calculate( '((5**2 + 100)/5)**.5/.5' );
            const result = utility.commitAction();
            expect( result.message ).to.include( '10' );
        } );
    } );

    describe( '-coinflip', () => {
        let sandbox;
        beforeEach( () => {
            sandbox = sinon.createSandbox();
        } );
        afterEach( () => {
            sandbox.restore();
        } );
        it( 'heads works', () => {
            sandbox.stub( Math, 'random' ).returns( 0.5 );
            utility.coinflip( 'heads', 'tails' );
            const result = utility.commitAction();
            expect( result.message ).to.include( 'heads' );
            expect( result.image ).to.include( 'heads' );
        } );
        it( 'tails works', () => {
            sandbox.stub( Math, 'random' ).returns( 0.0 );
            utility.coinflip( 'heads', 'tails' );
            const result = utility.commitAction();
            expect( result.message ).to.include( 'tails' );
            expect( result.image ).to.include( 'tails' );
        } );
    } );
} );
