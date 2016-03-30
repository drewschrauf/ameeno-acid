'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.create = create;

var _Plugin = require('./Plugin');

var _Plugin2 = _interopRequireDefault(_Plugin);

var _routes = require('routes');

var _routes2 = _interopRequireDefault(_routes);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _util = require('./util');

var _renderer = require('./renderer');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Acid object

var Acid = function () {
    function Acid(options) {
        _classCallCheck(this, Acid);

        // read in options
        options = options || {};
        this.marko = options.marko || require('marko');

        // set up some defaults
        this.pluginsArray = [];
        this.hasDefaultConfig = false;

        // add the plugins if any were provided
        if (options.plugins && Array.isArray(options.plugins)) {
            options.plugins.forEach(this.addPlugin.bind(this));
        } else if (options.plugins && !Array.isArray(options.plugins)) {
            throw new Error('plugins must be an array');
        }
    }

    // reduce the pluginsArray to a simple object


    _createClass(Acid, [{
        key: 'addPlugin',


        // add a config object to the config array
        value: function addPlugin(name, config) {
            var plugin = new _Plugin2.default(name, config);

            if (plugin.mountPoint === '/' && this.hasDefaultConfig) {
                throw new Error('Only one plugin can be the default');
            } else {
                this.hasDefaultConfig = true;
            }

            // all good, let's add it to the config array
            this.pluginsArray = [].concat(_toConsumableArray(this.pluginsArray), [plugin]);

            this._routesRegistered = false;
        }
    }, {
        key: 'registerRoutes',
        value: function registerRoutes() {
            var _this = this;

            this.router = (0, _routes2.default)();

            return Promise.all(this.pluginsArray.map(function (plugin) {
                return plugin.resolveRoutes();
            })).then(function (routesArray) {
                (0, _util.flattenArray)(routesArray).forEach(function (route) {
                    _this.router.addRoute(route.route, route.resolver);
                });

                _this._routesRegistered = true;
            });
        }

        // resolve all routes from all plugins

    }, {
        key: 'resolveRoutes',
        value: function resolveRoutes() {
            return Promise.all(this.pluginsArray.map(function (plugin) {
                return plugin.resolveRoutes();
            })).then(function (routesArray) {
                return (0, _util.flattenArray)(routesArray);
            }).then(function (routes) {
                return routes.map(function (route) {
                    return route.route;
                });
            });
        }

        // render the passed route and return a promise for the result

    }, {
        key: 'renderRoute',
        value: function renderRoute(route) {
            if (!this._routesRegistered) {
                return Promise.reject('Must call registerRoutes() before renderRoute(route)');
            }

            // match it to a config
            var rt = this.router.match(route);
            if (!rt) {
                return Promise.reject('Unable to map route for ' + route);
            }
            var resolver = rt.fn;

            // render the route
            if (resolver.resolveTemplate) {
                return (0, _renderer.renderRoute)({
                    path: route,
                    resolveTemplate: resolver.resolveTemplate,
                    resolveContext: resolver.resolveContext,
                    marko: this.marko,
                    plugins: this.plugins
                });
            } else {
                return Promise.resolve(resolver.handleRoute(route, this.plugins));
            }
        }
    }, {
        key: 'plugins',
        get: function get() {
            return (0, _util.arrayToObject)(this.pluginsArray, 'name');
        }
    }]);

    return Acid;
}();

// create a new instance of Acid


exports.default = Acid;
function create(options) {
    if (!options) {
        var configPath = _path2.default.resolve('acid.config.js');
        if (_fs2.default.existsSync(configPath)) {
            options = require(configPath);
        }
    }

    var instance = new Acid(options);
    return instance.registerRoutes().then(function () {
        return instance;
    });
}