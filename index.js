module.exports = function(endpoints) {
  if(!endpoint) {
    throw new Error('Must supply an array of endpoints.');
  } else {
    var endpoints = endpoints;
  };

  return function(handle) {
    handle('request', function(env, next) {
      var target = endpoints.shift();
      env.target.url = target;
      endpoints.push(target);
      next(env);
    });
  };
};
