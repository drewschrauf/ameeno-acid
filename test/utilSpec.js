import { flattenArray } from '../src/util';
import { expect } from 'chai';

describe('util', () => {
    describe('#flatten', () => {
        it('should flatten an array', () => {
            expect(flattenArray([[1, 2], [3, 4]])).to.eql([1, 2, 3, 4]);
        });

        it('should not fail on an empty array', () => {
            expect(flattenArray([])).to.eql([]);
        });

        it('should return an empty array for invalid input', () => {
            expect(flattenArray()).to.eql([]);
            expect(flattenArray({})).to.eql([]);
        });
    });
});
