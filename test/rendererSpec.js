import { renderRoute } from '../src/renderer';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import marko, { missingMarko, failToLoadMarko, failToRenderMarko } from './mocks/markoMocks.js';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('renderer', () => {
  let markoSpy;
  let loadSpy;
  let renderSpy;
  beforeEach(() => {
    renderSpy = sinon.stub().yields(null, 'Result');
    loadSpy = sinon.stub().returns({
      render: renderSpy,
    });
    markoSpy = {
      load: loadSpy,
    };
  });

  it('should export a renderRoute function', () => {
    expect(renderRoute).to.be.a('Function');
  });

  describe('renderRoute', () => {
    it('should render a route', () => (
      expect(renderRoute({
        path: '/',
        resolveTemplate: '/template.marko',
        marko,
      })).to.eventually.equal('Result')
    ));

    it('should resolve context from a function', done => {
      renderRoute({
        path: '/',
        resolveTemplate: '/template.marko',
        marko: markoSpy,
        resolveContext: () => 'test',
      }).then(res => {
        expect(renderSpy.firstCall.args[0].context).to.equal('test');
        expect(res).to.equal('Result');
        done();
      });
    });

    it('should resolve context from an object', done => {
      renderRoute({
        path: '/',
        resolveTemplate: '/template.marko',
        marko: markoSpy,
        resolveContext: {
          test: 'testing',
        },
      }).then(res => {
        expect(renderSpy.firstCall.args[0].context.test).to.equal('testing');
        expect(res).to.equal('Result');
        done();
      });
    });

    it('should resolve template from a string', done => {
      renderRoute({
        path: '/',
        resolveTemplate: '/template.marko',
        marko: markoSpy,
      }).then(res => {
        expect(loadSpy.firstCall.args[0]).to.equal('/template.marko');
        expect(res).to.equal('Result');
        done();
      });
    });

    it('should resolve template from a function', done => {
      renderRoute({
        path: '/',
        resolveTemplate: () => '/template.marko',
        marko: markoSpy,
      }).then(res => {
        expect(loadSpy.firstCall.args[0]).to.equal('/template.marko');
        expect(res).to.equal('Result');
        done();
      });
    });

    describe('renderRoute errors', () => {
      it('should reject if no path passed', () => (
        expect(renderRoute({})).to.be.rejectedWith('No path')
      ));

      it('should reject if no template resolver passed', () => (
        expect(renderRoute({ path: '/' })).to.be.rejectedWith('No template resolver')
      ));

      it('should reject if no marko instance passed', () => (
        expect(renderRoute({
          path: '/',
          resolveTemplate: 'r',
        })).to.be.rejectedWith('No marko instance')
      ));

      it('should reject if resolveContext fails', () => (
        expect(renderRoute({
          path: '/',
          resolveTemplate: 'r',
          marko,
          resolveContext: () => {
            throw new Error();
          },
        })).to.be.rejectedWith('context resolver')
      ));

      it('should reject if resolveContext rejects', () => (
        expect(renderRoute({
          path: '/',
          resolveTemplate: 'r',
          marko,
          resolveContext: () => (
            Promise.reject(new Error('Error'))
          ),
        })).to.be.rejectedWith('unable to be resolved')
      ));

      it('should reject if resolveTemplate fails', () => (
        expect(renderRoute({
          path: '/',
          resolveTemplate: () => {
            throw new Error();
          },
          marko,
        })).to.be.rejectedWith('template path')
      ));

      it('should reject if resolveTemplate is not a string or function', () => (
        expect(renderRoute({
          path: '/',
          resolveTemplate: 42,
          marko,
        })).to.be.rejectedWith('function or a string')
      ));

      it('should reject if template cannot be found', () => (
        expect(renderRoute({
          path: '/',
          resolveTemplate: 'r',
          marko: missingMarko,
        })).to.be.rejectedWith('Cannot find')
      ));

      it('should reject if template loading fails', () => (
        expect(renderRoute({
          path: '/',
          resolveTemplate: 'r',
          marko: failToLoadMarko,
        })).to.be.rejectedWith('Error loading')
      ));

      it('should reject if template rendering fails', () => (
        expect(renderRoute({
          path: '/',
          resolveTemplate: 'r',
          marko: failToRenderMarko,
        })).to.be.rejectedWith('render')
      ));
    });
  });
});
