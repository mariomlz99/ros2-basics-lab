// Internal C++ bridge protocol. These functions never inspect student source.
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

function finiteValues(values, length, label) {
  if (!Array.isArray(values) || values.length !== length) {
    throw new Error(label + ' requires ' + length + ' numeric values');
  }
  return Array.from(values, (value, index) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(label + '[' + index + '] must be a finite number');
    }
    return value;
  });
}

function currentId(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Call this C++ report inside the current ' + label + ' callback');
  }
  return value;
}

/**
 * Bind reports to the worker's active callback, never a caller-provided ID.
 * The shared RuntimeAdapter still validates reports against actual sensor data.
 */
export function associateReport(message, {sample = null, frame = null} = {}) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new Error('Invalid C++ report');
  }
  if (message.kind === 'course_report') {
    const arities = {range: 1, sectors: 3, position: 2, pose: 3, relative: 2, transform: 2};
    if (!own(arities, message.report)) throw new Error('Unknown C++ course report: ' + String(message.report));
    const values = finiteValues(message.values, arities[message.report], 'C++ ' + message.report + ' report');
    const boundSample = message.report === 'relative' || message.report === 'transform'
      ? null : currentId(sample, 'sensor');
    return {kind: 'course_report', report: message.report, values, sample: boundSample};
  }
  if (message.kind === 'detection') {
    const boundFrame = currentId(frame, 'image');
    if (typeof message.visible !== 'boolean') throw new Error('C++ detection visible must be a boolean');
    const cx = message.cx ?? null;
    if (cx !== null && (typeof cx !== 'number' || !Number.isFinite(cx))) {
      throw new Error('C++ detection cx must be null or a finite number');
    }
    return {kind: 'detection', frame: boundFrame, visible: message.visible, cx};
  }
  if (message.kind === 'image_stats') {
    const boundFrame = currentId(frame, 'image');
    const shape = finiteValues(message.shape, 3, 'C++ image shape');
    if (shape.some(value => !Number.isSafeInteger(value) || value <= 0)) {
      throw new Error('C++ image shape must contain positive integer dimensions');
    }
    return {kind: 'image_stats', frame: boundFrame, shape,
      means: finiteValues(message.means, 3, 'C++ image means')};
  }
  throw new Error('Unknown C++ report kind: ' + String(message.kind));
}
