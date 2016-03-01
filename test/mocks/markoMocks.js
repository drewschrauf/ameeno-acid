export default {
    load: () => ({
        render: (config, callback) => {
            callback(null, 'Result');
        }
    })
};

export const missingMarko = {
    load: () => {
        let err = new Error();
        err.code = 'ENOENT';
        throw err;
    }
};

export const failToLoadMarko = {
    load: () => {
        throw new Error();
    }
};

export const failToRenderMarko = {
    load: () => ({
        render: (config, callback) => {
            callback(new Error('Could not render'));
        }
    })
};
