export function flattenArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.reduce((prev, curr) => [...prev, ...curr], []);
}

export function arrayToObject(arr, key) {
  return arr.reduce((prev, curr) => ({
    ...prev,
    [curr[key]]: curr,
  }), {});
}
