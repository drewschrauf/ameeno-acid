import { flattenArray, arrayToObject } from '../src/util';
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

  describe('#arrayToObject', () => {
    it('should convert an array to an object', () => {
      expect(arrayToObject([{ a: 'test' }, { a: 'again' }], 'a'))
        .to.eql({ test: { a: 'test' }, again: { a: 'again' } });
    });
    it('should not fail on an empty array', () => {
      expect(arrayToObject([], 'key')).to.eql({});
    });
  });
});
