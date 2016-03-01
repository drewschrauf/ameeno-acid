'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Plugin = function () {
    function Plugin(name, config) {
        _classCallCheck(this, Plugin);

        // short circuit option name
        if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
            config = name;
        } else {
            // overwrite the name
            config = Object.assign({}, config, { name: name });
        }

        // check that we were given a name
        if (!config.name) {
            throw new Error('Plugin must have a name');
        } else {
            this.name = config.name;
        }

        // set up mount point
        this.mountPoint = config.mountPoint || '/';

        if (!config.resolvers && config.resolver) {
            // if a single resolver was attached, add it to an array
            this.resolvers = [config.resolver];
        } else {
            this.resolvers = config.resolvers || [];
        }

        // check all resolvers are configured correctly
        this.resolvers.forEach(function (resolver) {
            if (!resolver.resolveRoutes) {
                throw new Error('Resolver must provide resolveRoutes');
            }
            if (!resolver.handleRoute && !resolver.resolveTemplate) {
                throw new Error('Resolver must provide resolveTemplate or handleRoute');
            }
        });
    }

    _createClass(Plugin, [{
        key: 'resolveRoutes',
        value: function resolveRoutes() {
            return Promise.all(this.resolvers.map(function (resolver) {
                if (typeof resolver.resolveRoutes === 'function') {
                    return Promise.resolve(resolver.resolveRoutes()).then(function (routes) {
                        return routes.map(function (route) {
                            return { route: route, resolver: resolver };
                        });
                    });
                } else if (Array.isArray(resolver.resolveRoutes)) {
                    return Promise.resolve(resolver.resolveRoutes.map(function (route) {
                        return { route: route, resolver: resolver };
                    }));
                } else {
                    throw new Error('resolveRoutes must be an Array or a function returning an Array or Promise for an Array');
                }
            })).then(function (routeArrays) {
                return routeArrays.reduce(function (prev, curr) {
                    return prev.concat(curr);
                }, []);
            });
        }
    }]);

    return Plugin;
}();

exports.default = Plugin;