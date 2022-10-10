var githubAuth = require( "connect-oauth-github" );
var githubRequest = require( "github-request" ).request;
var util = require( "../util" );

exports = module.exports = provider;
exports.Provider = Provider;

function provider( app ) {
	return new Provider( app );
}

function Provider( app ) {
	this.app = app;
}

util.extend( Provider.prototype, {
	init: function() {
		this.client = githubAuth.createClient({
			id: this.app.options.githubClientId,
			secret: this.app.options.githubClientSecret
		});

		this.client.isAuthorized = this.isAuthorized.bind( this );
		this.client.success = this.success.bind( this );
		this.client.error = this.app.auth.error.bind( this.app.auth );

		this.app.web.get( "/auth/github", this.client.handshake );
	},

	authorize: function() {
		return this.client.authorize.apply( this.client, arguments );
	},

	isAuthorized: function( request, callback ) {
		callback( null, !!request.session.userId );
	},

	success: function( request, response, data ) {
		var app = this.app;

		githubRequest({
			path: "/user?access_token=" + data.accessToken
		}, function( error, user ) {
			if ( error ) {
				return app.auth.error( request, response, error );
			}

			app.user.getInstanceByUsername( user.login, function( error, existingUser ) {
				if ( error ) {
					return app.auth.error( request, response, error );
				}

				if ( existingUser ) {
					return app.auth.success( request, response, existingUser );
				}

				app.auth.registerUser( request, response, user );
			});
		});
	}
});
