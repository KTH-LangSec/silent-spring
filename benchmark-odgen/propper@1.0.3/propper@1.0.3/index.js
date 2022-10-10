module.exports = prop;

function prop(obj, path, value) {
  if (!obj) return undefined;
  
  var isGet = arguments.length === 2;

  var parts = path;
  if (typeof (path) === 'string') {
    if (path.charAt(0) === '/') {
      // support /a/b/c
      parts = path.substr(1).split('/');  
    } else {
      //support a.b.c.
      parts = path.split('.');
    }
  }
  
  var origParts = JSON.parse(JSON.stringify(parts));
  parts = parts.reverse();  

  var target = obj;  
  
  var key = parts.pop();
  while (parts.length) {
    var nextTarget = target[key];
    if (!nextTarget) {
      if (value === undefined) {
        return undefined;
      } else {
        nextTarget = target[key] = {};
      }      
    }

    target = nextTarget;
    key = parts.pop();
  }  

  if (isGet) {
    return target[key];
  } 

  if (value !== undefined) {
    target[key] = value;
    return value;
  }

  delete(target[key]);
  if (Object.keys(target).length === 0 && origParts.length > 1) {
      // Since the case of recursive delete is infrequent, this is likely performant enough.    
      origParts.pop();
      prop(obj, origParts, undefined);          
  }
}
