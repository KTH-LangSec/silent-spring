var marked = require( "marked" );
var sanitizer = require( "sanitizer" );

exports.parse = parse;

function parse( str ) {
	str = marked( str );
	str = sanitizer.sanitize( str, function( url ) {
		return url;
	});
	return str;
}
