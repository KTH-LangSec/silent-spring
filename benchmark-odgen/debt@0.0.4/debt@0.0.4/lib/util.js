exports.delay = delay;
exports.extend = extend;
exports.deepExtend = deepExtend;
exports.escapeHtml = escapeHtml;
exports.htmlTag = htmlTag;
exports.isLabel = isLabel;
exports.isEmail = isEmail;
exports.createError = createError;

function delay( callback ) {
	var args = [].slice.call( arguments, 1 );
	process.nextTick(function() {
		callback.apply( null, args );
	});
}

var classToType = {};
[
	"Boolean",
	"Number",
	"String",
	"Function",
	"Array",
	"Date",
	"RegExp",
	"Object",
	"Error"
].forEach(function( type ) {
	classToType[ "[object " + type + "]" ] = type.toLowerCase();
});

function type( obj ) {
	return classToType[ ({}).toString.call( obj ) ];
}

function extend( a, b ) {
	for ( var prop in b ) {
		a[ prop ] = b[ prop ];
	}

	return a;
}

function deepExtend( a, b ) {
	for ( var prop in b ) {
		if ( typeof b[ prop ] === "object" ) {
			a[ prop ] = type( a[ prop ] ) === "object" ?
				deepExtend( a[ prop ] || {}, b[ prop ] ) :
				b[ prop ];
		} else {
			a[ prop ] = b[ prop ];
		}
	}

	return a;
}

function escapeHtml( string ) {
	return string.replace( /[&<>"'`]/g, function( char ) {
		return ({
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#039;"
		})[ char ];
	});
}

function htmlTag( nodeName, attributes ) {
	var html = "<" + nodeName + "";
	if ( attributes ) {
		html += Object.keys( attributes ).map(function( name ) {
			var value = attributes[ name ];

			// Boolean attributes with a false value should be omitted
			if ( value === false ) {
				return "";
			}

			// Boolean attributes with a true value are expanded to long form
			if ( value === true ) {
				value = name;
			}

			return " " + name + "='" + escapeHtml( value ) + "'";
		}).join( "" );
	}
	html += ">";

	return html;
}

function isLabel( str ) {
	return (/^[a-z0-9][a-z0-9_-]{0,62}$/i).test( str );
}

var localAddr = /^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/i;
var domain = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function isEmail( str ) {
	var parts = str.split( "@" );
	if ( parts.length !== 2 ) {
		return false;
	}

	if ( !localAddr.test( parts[ 0 ] ) ) {
		return false;
	}

	if ( !domain.test( parts[ 1 ] ) ) {
		return false;
	}

	return true;
}

function createError( settings ) {
	var message = settings.message;
	if ( settings.code ) {
		message = settings.code + ": " + message;
	}
	delete settings.message;

	var error = new Error( message );
	extend( error, settings );

	return error;
}
