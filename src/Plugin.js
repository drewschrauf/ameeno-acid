export default class Plugin {
  constructor(name, inputConfig) {
    // short circuit option name
    let config;
    if (typeof name === 'object') {
      config = name;
    } else {
      // overwrite the name
      config = { ...inputConfig, name };
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
      if (!Array.isArray(config.watchExpressions)) {
        throw new Error('watchExpressions must be an Array');
      }
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

  async resolveRoutes() {
    const routeArrays = await Promise.all(this.resolvers.map(
      async function resolveRoutes(resolver) {
        // pull out routes from resolveRoutes
        if (typeof resolver.resolveRoutes === 'function') {
          // this is a function
          const routes = await Promise.resolve(resolver.resolveRoutes());
          return routes.map(route => ({ route, resolver }));
        } else if (Array.isArray(resolver.resolveRoutes)) {
          // this is an array
          return Promise.resolve(resolver.resolveRoutes.map(route => ({
            route,
            resolver,
          })));
        }
        // this wasn't either a function or an array
        throw new Error(
          'resolveRoutes must be an Array or a function returning an Array or Promise for an Array'
        );
      }
    ));
    return routeArrays.reduce((prev, curr) => [...prev, ...curr], []);
  }
}
