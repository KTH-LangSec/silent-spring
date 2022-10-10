module.exports = function() {
 var grunt = require('grunt');
 // var grunt = {
 //  util: {
 //   _: {
 //    each: function(array, cb){
 //     for (let elem of array){
 //      cb(elem);
 //     }
 //    }
 //   }
 //  }
 // };
 var gruntUtilProperty = require('.');
 return gruntUtilProperty(grunt);
}
