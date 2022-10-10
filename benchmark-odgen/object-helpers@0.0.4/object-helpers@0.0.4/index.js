'use strict';

const validObj = (obj) => {
  return obj && (typeof obj === 'object' || typeof obj === 'function');
};


module.exports = {
  get(obj, path, value) {
    if (!validObj(obj) ||  typeof path !== 'string') {
      return value ? undefined : value;
    }

    const props = path.split('.');

    for (let i = 0; i < props.length; i += 1) {
      if (!Object.prototype.propertyIsEnumerable.call(obj, props[i])) {
        return value;
      }

      obj = obj[props[i]];

      if (obj === undefined || obj === null) {
        if (i !== props.length - 1) {
          return value;
        }

        break;
      }
    }

    return obj;
  },

  set(obj, path, value) {
    if (!validObj(obj) || typeof path !== 'string') {
      return obj;
    }

    const sourceObj = obj;
    const props = path.split('.');

    for (let i = 0; i < props.length; i += 1) {
      const prop = props[i];

      if (!validObj(obj[prop])) {
        obj[prop] = {};
      }

      if (i === props.length - 1) {
        obj[prop] = value;
      }

      obj = obj[prop];
    }

    return sourceObj;
  },

  delete(obj, path) {
    if (!validObj(obj) || typeof path !== 'string') {
      return;
    }

    const props = path.split('.');

    for (let i = 0; i < props.length; i += 1) {
      const prop = props[i];

      if (i === props.length - 1) {
        delete obj[prop];
        return;
      }

      obj = obj[prop];

      if (!validObj(obj)) {
        return;
      }
    }
  },

  has(obj, path) {
    if (!validObj(obj) || typeof path !== 'string') {
      return false;
    }

    const props = path.split('.');

    for (let i = 0; i < props.length; i += 1) {
      if (validObj(obj)) {
        if (!(props[i] in obj)) {
          return false;
        }

        obj = obj[props[i]];
      } else {
        return false;
      }
    }

    return true;
  }
};