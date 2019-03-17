const { utility } = require('../components/utility');

const expect = require('chai').expect;
const sinon = require('sinon');

const saveStub = sinon.stub(utility, "saveJSON");

describe("Utility", () => {

    describe('-random', () => {
        it('check comma seperated values', () => {
            utility.random("a,b,c");
            const result = utility.commitAction();
            expect(["a", "b", "c"]).to.include(result.message);
        });
        it('check space seperated values', () => {
            utility.random("a b c");
            const result = utility.commitAction();
            expect(["a", "b", "c"]).to.include(result.message);
        });
        it('check that spaces take priority', () => {
            utility.random("a,b c,d");
            const result = utility.commitAction();
            expect(["a,b", "c,d"]).to.include(result.message);
        });
    });

    describe('-roll', () => {
        it('check negative values', () => {
            utility.roll("-5", "-5");
            const result = utility.commitAction();
            expect(result.message).to.equal("-5");
        });
        it('check big values', () => {
            utility.roll("10000000000000000000000", "10000000000000000000000");
            const result = utility.commitAction();
            expect(result.message).to.equal("10000000000000000000000");
        });
    });
});
