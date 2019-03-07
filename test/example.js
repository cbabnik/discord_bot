const { example } = require('../components/example');

const expect = require('chai').expect;
const sinon = require('sinon');

const saveStub = sinon.stub(example, "saveJSON");

describe("Example", () => {
    beforeEach(() => {
        example.json = {
            a: 5,
            b: 2,
        }
    });

    describe('+win', () => {
        it('basic use case', () => {
            example.win({author: "a"});
            const result = example.commitAction();
            expect(result).to.have.property("message");
            expect(result.message).is.a("string");
            expect(result.message).to.include("win");
        });
        it('should count 1st then 2nd', () => {
            example.win({author: "c"});
            let result = example.commitAction();
            expect(result.message).to.include("1st");
            example.win({author: "c"});
            result = example.commitAction();
            expect(result.message).to.include("2nd");
        });
        it('should track wins independently from different sources', () => {
            example.win({author: "a"});
            let result = example.commitAction();
            expect(result.message).to.include("6th");
            example.win({author: "b"});
            result = example.commitAction();
            expect(result.message).to.include("3rd");
            expect(example.json).to.deep.equal({
                a: 6,
                b: 3,
            })
        });
        it('should call saveJSON', () => {
            example.win({author: "a"});
            expect(saveStub.called);
        });
    });

    describe('+delay', () => {
        it('basic use case', () => {
            example.delay(5, "hello");
            let result = example.commitAction();
            expect(result).to.have.property("delay");
            expect(result.delay).to.equal(5);
            expect(result).to.have.property("message");
            expect(result.message).to.equal("hello");
        });
    });
    describe('+spam', () => {
        it('basic use case', () => {
            example.spam(5, "hello");
            let result = example.commitAction();
            expect(result).to.have.property("repeat");
            expect(result.repeat).to.equal(5);
            expect(result).to.have.property("message");
            expect(result.message).to.equal("hello");
        });
    });
    describe('+countdown', () => {
        it('should have the same number of actions as countdown', () => {
            example.countdown(5);
            let result = example.commitAction();
            expect(result.next.next.next.next.next).to.not.be.undefined;
            expect(result.next.next.next.next.next).to.not.have.property("next");
        });
    });
    describe('+alarm', () => {
        it('', () => {

        });
    });
});
