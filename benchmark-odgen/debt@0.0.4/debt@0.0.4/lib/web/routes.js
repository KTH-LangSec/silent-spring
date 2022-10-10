module.exports = function( web ) {

var app = web.get( "debt" );

web.get( "/", function( request, response ) {
	if ( app.state === "database-setup" ) {
		return app.install(function( error ) {
			if ( error ) {
				return response.send( 500 );
			}

			app.state = "user-setup";
			return response.redirect( "/install" );
		});
	}

	if ( app.state === "user-setup" ) {
		return response.redirect( "/install" );
	}

	response.render( "home" );
});

web.get( "/install", web.authorize, function( request, response ) {

	// Prevent users from granting themselves admin rights after install
	if ( app.state === "installed" ) {
		return response.redirect( "/" );
	}

	app.permission.grantToUser( request.session.userId, "DEBT:ADMIN", function( error ) {
		if ( error ) {
			return response.send( 500 );
		}

		app.state = "installed";
		response.render( "installed" );
	});
});

require( "./routes/ticket" )( web );

};
