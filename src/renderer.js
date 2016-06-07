import RenderError from './errors/RenderError';
import VError from 'verror';

async function resolveContextItem(resolveContext, path) {
  try {
    if (!resolveContext) {
      return {};
    }
    if (typeof resolveContext === 'function') {
      return await resolveContext(path);
    }
    return resolveContext;
  } catch (err) {
    throw new VError(err, `Context item unable to be resolved for ${path}`);
  }
}

async function resolveTemplatePath(resolveTemplate, path, item) {
  try {
    // find the template to use
    if (typeof resolveTemplate === 'function') {
      return await resolveTemplate(path, item);
    }
    if (typeof resolveTemplate === 'string') {
      return await Promise.resolve(resolveTemplate);
    }
  } catch (err) {
    throw new VError(err, 'Error resolving template path');
  }
  // we can only get here if resolveTemplate isn't what we need
  throw new RenderError('resolveTemplate must be a function or a string');
}

function loadTemplate(templatePath, marko) {
  try {
    return marko.load(templatePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new VError(err, `Cannot find template at ${templatePath}`);
    } else {
      throw new VError(err, `Error loading template at ${templatePath}`);
    }
  }
}

function renderTemplate(template, context, globals) {
  return new Promise((resolve, reject) => {
    template.render({
      context,
      $global: {
        ...globals,
        context,
      },
    }, (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    });
  });
}

// render a page with the given arguments using the provided marko instance
export async function renderRoute(options) {
  const { path, resolveTemplate, resolveContext, plugins, marko } = options;

  if (!path) {
    throw new RenderError('No path');
  }
  if (!resolveTemplate) {
    throw new RenderError('No template resolver');
  }
  if (!marko) {
    throw new RenderError('No marko instance');
  }

  try {
    const item = await resolveContextItem(resolveContext, path);
    const templatePath = await resolveTemplatePath(resolveTemplate, item, path);
    const template = loadTemplate(templatePath, marko);
    return renderTemplate(template, item, { path, plugins });
  } catch (err) {
    throw new VError(err, `Unable to render route ${path}`);
  }
}
