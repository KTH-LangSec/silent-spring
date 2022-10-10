var hbs = require( "hbs" );
var handlebars = require( "handlebars" );
var moment = require( "moment" );
var gravatar = require( "gravatar" );
var util = require( "./util" );

hbs.handlebars = handlebars;

handlebars.registerHelper( "not", function( value ) {
	return !value;
});

handlebars.registerHelper( "equal", function ( a, b ) {
	if ( a != null ) {
		a = a.valueOf();
	}
	if ( b != null ) {
		b = b.valueOf();
	}

	return a === b;
});

handlebars.registerHelper( "concat", function() {
	var args = [].slice.apply( arguments );
	var options = args.pop();
	return args.join( options.hash.delimiter || "" );
});

handlebars.registerHelper( "timeSince", function( date ) {
	return new handlebars.SafeString(
		util.htmlTag( "span", { title: date.toString() } ) +
			moment( date ).fromNow() +
		"</span>"
	);
});

handlebars.registerHelper( "ticketLink", function( ticket, options ) {
	var label = options.hash.label || ("#" + ticket.id);

	return new handlebars.SafeString(
		util.htmlTag( "a", { href: "/tickets/" + ticket.id } ) +
			label +
		"</a>"
	);
});

handlebars.registerHelper( "userLink", function( user, options ) {
	var label = options.hash.label || user.username;

	return new handlebars.SafeString(
		util.htmlTag( "a", { href: "/users/" + user.username } ) +
			label +
		"</a>"
	);
});

handlebars.registerHelper( "hasPermission", function( permission ) {
	if ( !this.activeUser ) {
		return false;
	}

	return this.activeUser.hasPermission( permission );
});

handlebars.registerHelper( "avatar", function( user, options ) {
	var size = options.hash.size || 48;
	var url = gravatar.url( user.email, { s: size } );
	var html = util.htmlTag( "img", {
		src: url,
		class: options.hash.class
	});

	if ( options.hash.noLink ) {
		return new handlebars.SafeString( html );
	}

	options.hash.label = html;
	return handlebars.helpers.userLink.call( this, user, options );
});
