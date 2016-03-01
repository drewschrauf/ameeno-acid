function RenderError(message) {
    this.message = message;
    this.name = 'RenderError';
    Error.captureStackTrace(this, RenderError);
}
RenderError.prototype = Object.create(Error.prototype);
RenderError.prototype.constructor = RenderError;

module.exports = RenderError;
