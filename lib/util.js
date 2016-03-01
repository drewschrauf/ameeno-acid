"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.flattenArray = flattenArray;
function flattenArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.reduce(function (prev, curr) {
        return prev.concat(curr);
    }, []);
}