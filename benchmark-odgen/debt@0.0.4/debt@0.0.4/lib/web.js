var express = require( "express" );
var MysqlStore = require( "connect-mysql" )( express );
var util = require( "./util" );
var routes = require( "./web/routes" );

exports.createServer = createServer;

function createServer( app ) {
	var web = express();

	// Expose DEBT instance to Express app
	web.set( "debt", app );

	// Set all Express options
	Object.keys( app.options.express ).forEach(function( prop ) {
		web.set( prop, app.options.express[ prop ] );
	});

	// Expose application settings to templates via `app`
	web.locals.app = app.options;

	// Expose auth
	web.authorize = app.auth.authorize.bind( app.auth );

	// web.use( express.favicon( "..." ) );
	web.use( express.logger() );
	web.use( express.compress() );
	web.use( express.json() );
	web.use( express.urlencoded() );
	web.use( express.responseTime() );
	web.use( express.query() );

	web.use( express.static( __dirname + "/../public" ) );

	// Enable sessions
	web.use( express.cookieParser() );
	web.use( express.session({
		key: "debt.sid",
		secret: app.options.cookieSecret,
		store: new MysqlStore({
			client: app.database.connection
		}),
		cookie: {
			maxAge: 604800000
		}
	}));

	// Expose the logged in user to the request and response
	web.use( app.auth.exposeUser.bind( app.auth ) );

	routes( web );

	web.use( notFound );
	web.use( errorHandler );

	return web;
}

function notFound( request, response, next ) {
	next( util.createError({
		code: "E_NOT_FOUND",
		message: "Unknown route: " + request.originalUrl
	}));
}

function errorHandler( error, request, response, next ) {
	if ( error.code === "E_NOT_FOUND" ) {
		return response.send( 404, error.message );
	}

	if ( error.code === "E_UNAUTHORIZED" ) {
		return response.send( 401, error.message );
	}

	response.send( 500 );
}
