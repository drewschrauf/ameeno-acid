export function flattenArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.reduce((prev, curr) => {
        return prev.concat(curr);
    }, []);
}
