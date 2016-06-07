import Plugin from '../src/Plugin';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('Plugin', () => {
  describe('#constructor', () => {
    it('should accept a config', () => {
      const plugin = new Plugin({ name: 'test' });
      expect(plugin.name).to.equal('test');
    });

    it('should accept a name and a config', () => {
      const plugin = new Plugin('newName', { name: 'test' });
      expect(plugin.name).to.equal('newName');
    });

    it('should accept a config without a resolver', () => {
      const plugin = new Plugin({
        name: 'test',
      });
      expect(plugin.name).to.equal('test');
    });

    it('should ensure all configs are named', () => {
      expect(() => new Plugin()).to.throw('have a name');
    });

    it('should accept multiple resolvers', () => {
      const plugin = new Plugin('test', {
        resolvers: [
          { resolveRoutes: [], handleRoute: 'r' },
          { resolveRoutes: [], handleRoute: 'r' },
        ],
      });
      expect(plugin.resolvers).to.have.length(2);
    });

    it('should attach options if provided', () => {
      const plugin = new Plugin({ name: 'name', options: 'opts' });
      expect(plugin.options).to.equal('opts');
    });

    it('should attach watchExpressions if provided', () => {
      const plugin = new Plugin({ name: 'name', watchExpressions: ['a', 'b'] });
      expect(plugin.watchExpressions).to.eql(['a', 'b']);
    });

    it('should default watchExpressions to an empty array if not provided', () => {
      const plugin = new Plugin({ name: 'name' });
      expect(plugin.watchExpressions).to.eql([]);
    });

    it('should error if watchExpressions is not an array', () => {
      expect(() =>
        new Plugin({ name: 'name', watchExpressions: 'test' })
      ).to.throw('must be an Array');
    });

    describe('resolver errors', () => {
      it('should fail if resolver does not declare resolveTemplate', () => {
        expect(() => new Plugin('test', {
          resolver: {
            resolveRoutes: [],
          },
        })).to.throw('resolveTemplate');
      });

      it('should fail if resolver does not declare resolveRoutes', () => {
        expect(() => new Plugin('test', {
          resolver: {},
        })).to.throw('resolveRoutes');
      });
    });
  });

  describe('#resolveRoutes', () => {
    it('should return routes from Arrays', done => {
      const plugin = new Plugin({
        name: 'test',
        resolver: {
          resolveRoutes: ['/one', '/two'],
          handleRoute: 'h',
        },
      });
      plugin.resolveRoutes().then(routes => {
        expect(routes[0].route).to.equal('/one');
        expect(routes[1].route).to.equal('/two');
        done();
      }).catch(err => {
        done(err);
      });
    });

    it('should return routes from functions returning Arrays', done => {
      const plugin = new Plugin({
        name: 'test',
        resolver: {
          resolveRoutes: () => ['/one', '/two'],
          handleRoute: 'h',
        },
      });
      plugin.resolveRoutes().then(routes => {
        expect(routes[0].route).to.equal('/one');
        expect(routes[1].route).to.equal('/two');
        done();
      }).catch(err => {
        done(err);
      });
    });

    it('should return routes from functions returning Promises for Arrays', done => {
      const plugin = new Plugin({
        name: 'test',
        resolver: {
          resolveRoutes: () => Promise.resolve(['/one', '/two']),
          handleRoute: 'h',
        },
      });
      plugin.resolveRoutes().then(routes => {
        expect(routes[0].route).to.equal('/one');
        expect(routes[1].route).to.equal('/two');
        done();
      }).catch(err => {
        done(err);
      });
    });

    it('should combine routes from multiple resolvers', done => {
      const plugin = new Plugin({
        name: 'test',
        resolvers: [{
          resolveRoutes: ['/one', '/two'],
          handleRoute: 'h',
        }, {
          resolveRoutes: ['/three', '/four'],
          handleRoute: 'h',
        }],
      });
      plugin.resolveRoutes().then(routes => {
        expect(routes[0].route).to.equal('/one');
        expect(routes[1].route).to.equal('/two');
        expect(routes[2].route).to.equal('/three');
        expect(routes[3].route).to.equal('/four');
        done();
      }).catch(err => {
        done(err);
      });
    });
  });
});
