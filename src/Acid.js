/* eslint new-cap:0 */
import Plugin from './Plugin';
import Router from 'routes';
import fs from 'fs';
import { flattenArray, arrayToObject } from './util';
import { renderRoute } from './renderer';
import path from 'path';
import marko from 'marko';

// Acid object
export default class Acid {

  constructor(options = {}) {
    // read in options
    this.marko = options.marko || marko;

    // set up some defaults
    this.pluginsArray = [];

    // add the plugins if any were provided
    if (options.plugins && Array.isArray(options.plugins)) {
      options.plugins.forEach(this.addPlugin.bind(this));
    } else if (options.plugins && !Array.isArray(options.plugins)) {
      throw new Error('plugins must be an array');
    }
  }

  // reduce the pluginsArray to a simple object
  get plugins() {
    return arrayToObject(this.pluginsArray, 'name');
  }

  get watchExpressions() {
    return this.pluginsArray.reduce((prev, curr) => (
      curr.watchExpressions ? [...prev, ...curr.watchExpressions] : prev
    ), []);
  }

  // add a config object to the config array
  addPlugin(name, config) {
    const plugin = new Plugin(name, config);

    // all good, let's add it to the config array
    this.pluginsArray = [...this.pluginsArray, plugin];

    this.routesRegistered = false;
  }

  registerRoutes() {
    this.router = Router();

    return Promise.all(this.pluginsArray.map(plugin => (
      plugin.resolveRoutes()
    ))).then(routesArray => {
      flattenArray(routesArray).forEach(route => {
        this.router.addRoute(route.route, route.resolver);
      });

      this.routesRegistered = true;
    });
  }

  // resolve all routes from all plugins
  resolveRoutes() {
    return Promise.all(this.pluginsArray.map(plugin => (
      plugin.resolveRoutes()
    ))).then(routesArray => (
      flattenArray(routesArray)
    )).then(routes => (
      routes.map(route => route.route)
    ));
  }

  // render the passed route and return a promise for the result
  renderRoute(route) {
    if (!this.routesRegistered) {
      return Promise.reject('Must call registerRoutes() before renderRoute(route)');
    }

    // match it to a config
    const rt = this.router.match(route);
    if (!rt) {
      return Promise.reject(`Unable to map route for ${route}`);
    }
    const resolver = rt.fn;

    // render the route
    if (resolver.resolveTemplate) {
      return renderRoute({
        path: route,
        resolveTemplate: resolver.resolveTemplate,
        resolveContext: resolver.resolveContext,
        marko: this.marko,
        plugins: this.plugins,
      });
    }
    return Promise.resolve(resolver.handleRoute(route, this.plugins));
  }
}

// create a new instance of Acid
export function create(inOptions) {
  let options = inOptions;
  if (!options) {
    const configPath = path.resolve('acid.config.js');
    if (fs.existsSync(configPath)) {
      options = require(configPath); // eslint-disable-line global-require
    }
  }

  const instance = new Acid(options);
  return instance.registerRoutes().then(() => instance);
}
