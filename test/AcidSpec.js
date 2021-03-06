/* eslint no-underscore-dangle:0, no-unused-expressions:0 */
import Acid, { create, __RewireAPI__ as AcidModuleRewireAPI } from '../src/Acid';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

const templ = require.resolve('./templates/template.marko');

chai.use(chaiAsPromised);

const dummyResolver = {
  resolveRoutes: ['/'],
  resolveTemplate: () => templ,
};
AcidModuleRewireAPI.__Rewire__('renderer', {
  renderRoute: route => Promise.resolve(route),
});

describe('acid', () => {
  it('should export a create function', () => {
    expect(create).to.be.a('function');
  });

  it('should accept options to the constructor function', () => {
    const acid = new Acid({ marko: 'marko' });
    expect(acid.marko).to.equal('marko');
  });
  it('should initialize plugins in the constructor function', () => {
    const acid = new Acid({
      plugins: [{
        name: 'test',
        resolver: dummyResolver,
      }],
    });
    expect(acid.plugins.test).to.not.be.undefined;
  });
  it('should throw if plugins is not an array', () => {
    expect(() => (
      new Acid({ plugins: 'test' })
    )).to.throw('plugins must be an array');
  });

  it('should expose watchExpressions', () => {
    const acid = new Acid({
      plugins: [{
        name: 'test',
        resolver: dummyResolver,
      }],
    });
    expect(acid.watchExpressions).to.be.an('Array');
  });

  it('should combine watchExpressions', () => {
    const acid = new Acid({
      plugins: [{
        name: 'test',
        resolver: dummyResolver,
        watchExpressions: ['a'],
      }, {
        name: 'testagain',
        resolver: dummyResolver,
        watchExpressions: ['b'],
      }],
    });
    expect(acid.watchExpressions).to.eql(['a', 'b']);
  });

  it('should not allow calling renderRoute before registerRoutes', () => {
    const acid = new Acid();
    return expect(acid.renderRoute('/')).to.eventually.be.rejectedWith('registerRoutes');
  });

  describe('config loading', () => {
    beforeEach(() => {
      AcidModuleRewireAPI.__Rewire__('path', {
        resolve: path => require.resolve(`./files/${path}`),
      });
    });

    afterEach(() => {
      AcidModuleRewireAPI.__ResetDependency__('path');
    });

    it('should load up the acid.conf.js if no options passed', () => {
      create().then(acid => {
        expect(acid.marko).to.equal('marko');
      });
    });

    it('should use passed options if present', () => {
      create({ marko: 'othermarko' }).then(acid => {
        expect(acid.marko).to.equal('othermarko');
      });
    });
  });

  describe('acid object', () => {
    let acid;
    beforeEach(done => {
      create().then(a => {
        acid = a;
        done();
      });
    });

    describe('addPlugin', () => {
      it('should have an addPlugin method', () => {
        expect(acid.addPlugin).to.be.a('function');
      });

      describe('multiple configs', () => {
        it('should combine multiple configs', () => {
          acid.addPlugin('test', {
            resolver: dummyResolver,
          });
          acid.addPlugin('testAgain', {
            resolver: dummyResolver,
          });
          expect(acid.plugins.test).to.not.be.undefined;
          expect(acid.plugins.testAgain).to.not.be.undefined;
        });
      });
    });

    describe('renderRoute', () => {
      it('should have a renderRoute function', () => {
        expect(acid.renderRoute).to.be.a('Function');
      });

      it('should render a route from a resolver with a resolveTemplate', () => {
        acid.addPlugin('test', {
          resolver: dummyResolver,
        });
        return acid.registerRoutes().then(() => (
          expect(acid.renderRoute('/')).to.eventually.equal('/')
        ));
      });

      it('should render a route from a resolver with a handleRoute', () => {
        acid.addPlugin('test', {
          resolver: {
            path: '/',
            handleRoute: t => t,
            resolveRoutes: ['/'],
          },
        });
        return acid.registerRoutes().then(() => (
          expect(acid.renderRoute('/')).to.eventually.equal('/')
        ));
      });

      describe('renderRoute errors', () => {
        it('should throw a rejected promise if the route can\'t be found', () => {
          expect(acid.renderRoute('/')).to.be.a('Promise');
        });
      });
    });

    describe('resolveRoutes', () => {
      it('should have a resolveRoutes function', () => {
        expect(acid.resolveRoutes).to.be.a('Function');
      });

      it('should return routes from a single resolver plugin', () => {
        acid.addPlugin('test', {
          resolver: {
            path: '/',
            resolveTemplate: 't',
            resolveRoutes: () => ['/one', '/two'],
          },
        });
        return expect(acid.resolveRoutes()).to.eventually.eql(['/one', '/two']);
      });

      it('should combine routes from a plugin with multiple resolvers', () => {
        acid.addPlugin('test', {
          resolvers: [{
            path: '/',
            resolveTemplate: 't',
            resolveRoutes: () => ['/one', '/two'],
          }, {
            path: 'other',
            resolveTemplate: 't',
            resolveRoutes: () => ['/three', '/four'],
          }],
        });
        return expect(acid.resolveRoutes()).to.eventually.eql(['/one', '/two', '/three', '/four']);
      });

      it('should combine routes from multiple plugins', () => {
        acid.addPlugin('test', {
          resolver: {
            path: '/',
            resolveTemplate: 't',
            resolveRoutes: () => ['/one', '/two'],
          },
        });
        acid.addPlugin('testAgain', {
          resolver: {
            path: '/',
            resolveTemplate: 't',
            resolveRoutes: () => ['/three', '/four'],
          },
        });
        return expect(acid.resolveRoutes()).to.eventually.eql(['/one', '/two', '/three', '/four']);
      });

      it('should accept an array as resolveRoutes', () => {
        acid.addPlugin('test', {
          resolver: {
            path: '/',
            resolveTemplate: 't',
            resolveRoutes: ['/one', '/two'],
          },
        });
        return expect(acid.resolveRoutes()).to.eventually.eql(['/one', '/two']);
      });

      describe('resolveRoutes errors', () => {
        it('should throw if resolveRoutes is not a function or array', () => {
          acid.addPlugin('test', {
            resolver: {
              path: '/',
              resolveTemplate: 't',
              resolveRoutes: {},
            },
          });
          return expect(acid.resolveRoutes(acid)).to.eventually.be.rejectedWith('must be an Array');
        });
      });
    });
  });
});
