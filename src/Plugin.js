export default class Plugin {
    constructor(name, config) {
        // short circuit option name
        if (typeof name === 'object') {
            config = name;
        } else {
            // overwrite the name
            config = {...config, name};
        }

        // check that we were given a name
        if (!config.name) {
            throw new Error('Plugin must have a name');
        } else {
            this.name = config.name;
        }

        // attach the options if we were given any
        if (config.options) {
            this.options = config.options;
        }

        // attach custom watch expressions if we were given any
        if (config.watchExpressions) {
            this.watchExpressions = config.watchExpressions;
        } else {
            this.watchExpressions = [];
        }

        // set up the resolvers
        if (!config.resolvers && config.resolver) {
            // if a single resolver was attached, add it to an array
            this.resolvers = [config.resolver];
        } else {
            this.resolvers = config.resolvers || [];
        }

        // check all resolvers are configured correctly
        this.resolvers.forEach(resolver => {
            if (!resolver.resolveRoutes) {
                throw new Error('Resolver must provide resolveRoutes');
            }
            if (!resolver.handleRoute && !resolver.resolveTemplate) {
                throw new Error('Resolver must provide resolveTemplate or handleRoute');
            }
        });
    }

    resolveRoutes() {
        return Promise.all(this.resolvers.map(resolver => {
            if (typeof resolver.resolveRoutes === 'function') {
                return Promise.resolve(resolver.resolveRoutes())
                    .then(routes => routes.map(route => ({route: route, resolver: resolver})));
            } else if (Array.isArray(resolver.resolveRoutes)) {
                return Promise.resolve(resolver.resolveRoutes.map(route => ({route: route, resolver: resolver})));
            } else {
                throw new Error('resolveRoutes must be an Array or a function returning an Array or Promise for an Array');
            }
        })).then(routeArrays => {
            return routeArrays.reduce((prev, curr) => {
                return prev.concat(curr);
            }, []);
        });
    }
}
