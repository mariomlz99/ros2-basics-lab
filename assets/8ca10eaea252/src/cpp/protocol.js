// Internal C++ bridge protocol. These functions never inspect learner source.
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
const arrayIndex = /^(0|[1-9][0-9]*)$/;

/** Read a dot-separated field without traversing inherited properties. */
export function readField(payload, path) {
  if (typeof path !== 'string' || !path || path.split('.').some(part => !part || forbidden.has(part))) {
    throw new Error('Invalid C++ message field path: ' + String(path));
  }
  let value = payload;
  for (const part of path.split('.')) {
    const indexed = Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView));
    if (value === null || typeof value !== 'object' ||
        (indexed && (!arrayIndex.test(part) || !Number.isSafeInteger(Number(part)))) ||
        !own(value, part)) {
      throw new Error('Missing C++ message field: ' + path);
    }
    value = value[part];
  }
  return value;
}

/** Sensor ranges may contain Infinity for no return; NaN is never a valid field. */
export function numberField(payload, path) {
  const value = readField(payload, path);
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error('C++ message field ' + path + ' must be a number');
  }
  return value;
}

export function arrayLength(payload, path) {
  const value=readField(payload,path);
  if(!Array.isArray(value)&&!(ArrayBuffer.isView(value)&&!(value instanceof DataView)))throw new Error('C++ message field '+path+' must be an array');
  return value.length;
}

export function boolField(payload,path) {
  const value=readField(payload,path);
  if(typeof value!=='boolean')throw new Error('C++ message field '+path+' must be a boolean');
  return value;
}

export function stringField(payload, path) {
  const value = readField(payload, path);
  if (typeof value !== 'string') {
    throw new Error('C++ message field ' + path + ' must be a string');
  }
  return value;
}
