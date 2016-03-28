import Acid, { create, __RewireAPI__ as AcidModuleRewireAPI } from '../src/Acid';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

let templ = require.resolve('./templates/template.marko');

chai.use(chaiAsPromised);

const dummyResolver = {
    resolveRoutes: ['/'],
    resolveTemplate: () => templ
};
AcidModuleRewireAPI.__Rewire__('renderer', {
    renderRoute: route => Promise.resolve(route)
});

describe('acid', () => {
    it('should export a create function', () => {
        expect(create).to.be.a('function');
    });

    it('should load up the acid.conf.js if no options passed');

    it('should accept options to the constructor function', () => {
        let acid = new Acid({marko: 'marko'});
        expect(acid.marko).to.equal('marko');
    });
    it('should initialize plugins in the constructor function', () => {
        let acid = new Acid({
            plugins: [{
                name: 'test',
                resolver: dummyResolver
                }]
            });
        expect(acid.plugins.test).to.not.be.undefined;
    });
    it('should throw if plugins is not an array', () => {
        expect(() => {
            new Acid({plugins: 'test'});
        }).to.throw('plugins must be an array');
    });

    it('should not allow calling renderRoute before registerRoutes', () => {
        let acid = new Acid();
        return expect(acid.renderRoute('/')).to.eventually.be.rejectedWith('registerRoutes');
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
                        resolver: dummyResolver
                    });
                    acid.addPlugin('testAgain', {
                        mountPoint: '/blah',
                        resolver: dummyResolver
                    });
                    expect(acid.plugins.test).to.not.be.undefined;
                    expect(acid.plugins.testAgain).to.not.be.undefined;
                });
            });

            describe('config errors', () => {
                it('should only allow a single default config', () => {
                    acid.addPlugin('test', {
                        resolver: dummyResolver
                    });
                    expect(acid.addPlugin.bind(acid, 'testAgain', {
                        resolver: dummyResolver
                    })).to.throw('default');
                });
            });
        });

        describe('renderRoute', () => {
            it('should have a renderRoute function', () => {
                expect(acid.renderRoute).to.be.a('Function');
            });

            it('should render a route from a resolver with a resolveTemplate', () => {
                acid.addPlugin('test', {
                    resolver: dummyResolver
                });
                return acid.registerRoutes().then(() => {
                    return expect(acid.renderRoute('/')).to.eventually.equal('/');
                });
            });

            it('should render a route from a resolver with a handleRoute', () => {
                acid.addPlugin('test', {
                    resolver: {
                        path: '/',
                        handleRoute: t => t,
                        resolveRoutes: ['/']
                    }
                });
                return acid.registerRoutes().then(() => {
                    return expect(acid.renderRoute('/')).to.eventually.equal('/');
                });
            });

            it('should call renderRoute from renderer');

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
                        resolveRoutes: () => ['/one', '/two']
                    }
                });
                return expect(acid.resolveRoutes()).to.eventually.eql(['/one', '/two']);
            });

            it('should combine routes from a plugin with multiple resolvers', () => {
                acid.addPlugin('test', {
                    resolvers: [{
                        path: '/',
                        resolveTemplate: 't',
                        resolveRoutes: () => ['/one', '/two']
                    }, {
                        path: 'other',
                        resolveTemplate: 't',
                        resolveRoutes: () => ['/three', '/four']
                    }]
                });
                return expect(acid.resolveRoutes()).to.eventually.eql(['/one', '/two', '/three', '/four']);
            });

            it('should combine routes from multiple pkugins', () => {
                acid.addPlugin('test', {
                    resolver: {
                        path: '/',
                        resolveTemplate: 't',
                        resolveRoutes: () => ['/one', '/two']
                    }
                });
                acid.addPlugin('testAgain', {
                    mountPoint: '/test',
                    resolver: {
                        path: '/',
                        resolveTemplate: 't',
                        resolveRoutes: () => ['/three', '/four']
                    }
                });
                return expect(acid.resolveRoutes()).to.eventually.eql(['/one', '/two', '/three', '/four']);
            });

            it('should accept an array as resolveRoutes', () => {
                acid.addPlugin('test', {
                    resolver: {
                        path: '/',
                        resolveTemplate: 't',
                        resolveRoutes: ['/one', '/two']
                    }
                });
                return expect(acid.resolveRoutes()).to.eventually.eql(['/one', '/two']);
            });

            describe('resolveRoutes errors', () => {
                it('should throw if resolveRoutes is not a function or array', () => {
                    acid.addPlugin('test', {
                        resolver: {
                            path: '/',
                            resolveTemplate: 't',
                            resolveRoutes: {}
                        }
                    });
                    return expect(acid.resolveRoutes.bind(acid)).to.throw('resolveRoutes');
                });
            });
        });
    });
});
