import RenderError from './errors/RenderError';
import VError from 'verror';

// render a page with the given arguments using the provided marko instance
export function renderRoute(options) {
    if (!options.path) {
        return Promise.reject(new RenderError('No path'));
    }
    if (!options.resolveTemplate) {
        return Promise.reject(new RenderError('No template resolver'));
    }
    if(!options.marko) {
        return Promise.reject(new RenderError('No marko instance'));
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
    } catch(err) {
        return Promise.reject(new VError(err, 'Error calling context resolver for ' + options.path));
    }

    var contextObj;
    return Promise.resolve(context).catch(err => {
        throw new VError(err, 'Context item unable to be resolved for ' + options.path);
    }).then(item => {
        contextObj = item;

        // find the template to use
        if (typeof options.resolveTemplate === 'function') {
            return Promise.resolve(options.resolveTemplate(options.path, item));
        } else if (typeof options.resolveTemplate === 'string') {
            return Promise.resolve(options.resolveTemplate);
        } else {
            throw new RenderError('resolveTemplate must be a function or a string');
        }
    }).catch(err => {
        if (err instanceof VError) throw err;
        throw new VError(err, 'Error resolving template path');
    }).then(templatePath => {
        var template;
        try {
             template = options.marko.load(templatePath);
         } catch(err) {
             if (err.code === 'ENOENT') {
                 throw new VError(err, 'Cannot find template at ' + templatePath);
             } else {
                 throw new VError(err, 'Error loading template at ' + templatePath);
             }
         }

        // render the template
        return new Promise((resolve, reject) => {
            template.render({
                context: contextObj,
                $global: {
                    context: contextObj,
                    path: options.path,
                    plugins: options.plugins
                }
            }, (err, output) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(output);
                }
            });
        });
    }).catch(err => {
        throw new VError(err, 'Unable to render route ' + options.path);
    });
}
