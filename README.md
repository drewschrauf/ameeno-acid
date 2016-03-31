# Acid

[![Build Status](https://travis-ci.org/drewschrauf/ameeno-acid.svg?branch=master)](https://travis-ci.org/drewschrauf/ameeno-acid)
[![Coverage Status](https://coveralls.io/repos/github/drewschrauf/ameeno-acid/badge.svg?branch=master)](https://coveralls.io/github/drewschrauf/ameeno-acid?branch=master)

Acid is a fully asynchronous static site generator designed to make working with content services simple. It is designed for use with [Webpack](https://webpack.github.io/) and the excellent [Marko](http://markojs.com/) templating language.

Acid allows for plugins to be written and imported to connect to any service that provides an API. These plugins can add routes in your static site as well as supply custom Marko tags that can fetch additional content mid-render.

## How Does it Work?

Acid allows for simple data access through two main methods. The first is through the plugin system and the second is custom Marko tags.

### Acid Plugins

Acid plugins can provide a set of resolvers that handle requests for a given path. Each resolver is able to determine its own context item and provide the path to a template required for rendering it. As an example, you could configure a blog resolver to handle any requests under `/blog`, fetch the content from the Wordpress REST API then render the page using a template called `post.marko`.

See more in the [Acid Plugins](#acid-plugins) section.

### Custom Marko Tags

As Marko was designed from the ground up with asynchronous rendering in mind, it's possible to import or write your own tags that can fetch data when you need it. As a simple example, suppose you were rendering a blog post and wanted to include details about the author. Assuming the author's ID is available at `data.context.authorId`, you could use a custom Marko tag called `author-by-id` to create a local variable called `author` like so:

    <author-by-id id="${data.context.authorId}" as="author">
        <img class="author-image" src="${author.imageUrl}"/>
        <p class="author-name">${author.name}</p>
    </author-by-id>

This allows for increased flexibility in your templates as you can decide what data you need, when you need it. More information about writing your own Marko tags can be found in the [Marko documentation](http://markojs.com/docs/).

## Getting Started

The recommended way to use Acid is through [webpack-plugin-acid](https://github.com/drewschrauf/webpack-plugin-acid). View the project for documentation on its usage.

A config file can be provided at acid.config.js and will be loaded automatically if detected. Following is an example config using the [acid-plugin-static](https://github.com/drewschrauf/acid-plugin-static) plugin.

    var acidPluginStatic = require('acid-plugin-static');
    module.exports = {
        plugins: [
            acidPluginStatic({
                templateDir: './src/templates/static',
                generateListing: false
            })
        ]
    };

If you wish to use Acid outside of a Webpack environment, you may create an instance by calling the `create` method. This method returns a promise for the actual Acid instance as `create` will also ensure routes are registered which may be an asynchronous task.

    import Acid from 'ameeno-acid';
    Acid.create().then(acid => {
        let myAcid = acid; // this is the acid instance
    });

## Acid Plugins

Acid plugins can provide both routes to be added to the static site and/or configuration data for any custom Marko tags provided by the plugin. Plugins can be added either through the `acid.config.js` file or by invoking the `addPlugin(config)` method on the acid object.

If you intend to write your own plugin, the format of the plugin object follows.

### Configuration Object

Acid plugins must return a configuration object in the form:

    {
        name: '...', // required
        resolver: {...}, // a single resolver object
    }

or:

    {
        name: '...', // required
        resolvers: [{...}, {...}] // multiple resolver objects
    }

Resolver objects do not need to be supplied if the purpose of the configuration is to simply attach custom properties that can be accessed from the module's custom tags.

### Resolver Object

If the modules is intended to handle a route (or routes) in your site, it must provide one or more resolver objects. These take the form:

    {
        resolveRoutes: ..., // required
        resolveContext: ..., // optional
        resolveTemplate: ... // required
    }

or:

    {
        resolveRoutes: ..., // required
        handleRequest: ... // required
    }

A description of each method is provided below.

#### resolveRoutes

`resolveRoutes()`

This method is invoked by acid to map any routes that should be made available to the site. The acceptable return values are:

    - Array
    - Function returning an Array
    - Function returning a Promise for an Array

#### handleRequest

`handleRequest(path)`

If this method is supplied, Marko template rendering will be bypassed and this method will be invoked to generate the content for any routes returned from `resolveRoutes`. The acceptable return values are:

    - Object
    - Function returning an Object
    - Function returning a Promise for an Object

#### resolveContext

`resolveContext(path)`

If `handleRequest` is not supplied, this method will be invoked against each route returned from `resolveRoutes`. The result of this function will be made available to the template render via:

    ${data.context}

and

    ${out.global.context}

The acceptable return values are:

    - Anything
    - Function returning anything
    - Function returning a Promise for anything

If this method is not supplied, no context will be provided to the render.

#### resolveTemplate

`resolveTemplate(path, context)`

If `handleRequest` is not supplied, this method will be invoked against each route return from `resolveRoutes`. This function will be provided both the path and the resolved context in order to select an appropriate template. The acceptable return values are:

    - Path to a Marko template
    - Function returning a path to a Marko template

### Accessing Configuration

The entire configuration, including any custom keys will be attached to Marko's global object during render. The `name` value returned by the plugin will be the key used on Acid's `config` object. A config in the form:

    {
        name: 'example',
        customString: 'my custom key'
        customObject: {key: 'value'}
    }

will have its properties available in marko templates via:

    ${out.global.config.example.customString}
    ${out.global.config.example.customObject}

Plugins that only provide Marko tags and don't need any custom configuration (such as API keys) do not need to be added to Acid's configuration. The modules simply needs to be installed with `npm` and the tags will be resolved using Marko's own [tag resolution](http://markojs.com/docs/marko/custom-taglibs/#scanning-for-tags).

## Templating

Documentation for the Marko templating language can be found at [markojs.com](http://markojs.com/).
