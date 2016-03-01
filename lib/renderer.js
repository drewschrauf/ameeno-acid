'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.renderRoute = renderRoute;

var _RenderError = require('./errors/RenderError');

var _RenderError2 = _interopRequireDefault(_RenderError);

var _verror = require('verror');

var _verror2 = _interopRequireDefault(_verror);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// render a page with the given arguments using the provided marko instance
function renderRoute(options) {
    if (!options.path) {
        return Promise.reject(new _RenderError2.default('No path'));
    }
    if (!options.resolveTemplate) {
        return Promise.reject(new _RenderError2.default('No template resolver'));
    }
    if (!options.marko) {
        return Promise.reject(new _RenderError2.default('No marko instance'));
    }

    // get the context item
    var context;
    try {
        if (!options.resolveContext) {
            context = {};
        } else if (typeof options.resolveContext === 'function') {
            context = options.resolveContext(options.path);
        } else {
            context = options.resolveContext;
        }
    } catch (err) {
        return Promise.reject(new _verror2.default(err, 'Error calling context resolver for ' + options.path));
    }

    var contextObj;
    return Promise.resolve(context).catch(function (err) {
        throw new _verror2.default(err, 'Context item unable to be resolved for ' + options.path);
    }).then(function (item) {
        contextObj = item;

        // find the template to use
        if (typeof options.resolveTemplate === 'function') {
            return Promise.resolve(options.resolveTemplate(options.path, item));
        } else if (typeof options.resolveTemplate === 'string') {
            return Promise.resolve(options.resolveTemplate);
        } else {
            throw new _RenderError2.default('resolveTemplate must be a function or a string');
        }
    }).catch(function (err) {
        if (err instanceof _verror2.default) throw err;
        throw new _verror2.default(err, 'Error resolving template path');
    }).then(function (templatePath) {
        var template;
        try {
            template = options.marko.load(templatePath);
        } catch (err) {
            if (err.code === 'ENOENT') {
                throw new _verror2.default(err, 'Cannot find template at ' + templatePath);
            } else {
                throw new _verror2.default(err, 'Error loading template at ' + templatePath);
            }
        }

        // render the template
        return new Promise(function (resolve, reject) {
            template.render({
                context: contextObj,
                $global: {
                    context: contextObj,
                    path: options.path,
                    plugins: options.plugins
                }
            }, function (err, output) {
                if (err) {
                    reject(err);
                } else {
                    resolve(output);
                }
            });
        });
    }).catch(function (err) {
        throw new _verror2.default(err, 'Unable to render route ' + options.path);
    });
}