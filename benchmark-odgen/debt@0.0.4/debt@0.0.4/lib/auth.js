var util = require( "./util" );

exports = module.exports = auth;
exports.Auth = Auth;

function auth( app ) {
	return new Auth( app );
}

function Auth( app ) {
	this.app = app;
}

util.extend( Auth.prototype, {
	init: function() {
		this.provider = this.app.options.authProvider( this.app );
		this.provider.init();

		this.app.web.get( "/login", function( request ) {
			request.session.loginRedirect = request.get( "referer" ) || "/";
			this.provider.authorize.apply( this.provider, arguments );
		}.bind( this ));

		this.app.web.get( "/logout", function( request, response ) {
			request.session.destroy(function( error ) {
				if ( error ) {
					return response.send( 500 );
				}

				response.redirect( "back" );
			});
		});
	},

	authorize: function( request ) {
		request.session.authRedirect = request.originalUrl;
		return this.provider.authorize.apply( this.provider, arguments );
	},

	error: function( request, response ) {
		response.send( 500 );
	},

	success: function( request, response, user ) {
		request.session.userId = user.id;
		this._exposeUser( request, response, user );

		var redirect = request.session.authRedirect;
		delete request.session.authRedirect;

		if ( request.session.loginRedirect ) {
			redirect = request.session.loginRedirect;
			delete request.session.loginRedirect;
		}

		response.redirect( redirect );
	},

	registerUser: function( request, response, data ) {
		var app = this.app;

		app.user.create({
			username: data.login,
			email: data.email,
			name: data.name
		}, function( error, userId ) {
			if ( error ) {
				return app.auth.error( request, response, error );
			}

			app.user.getInstance( userId, function( error, user ) {
				if ( error ) {
					return app.auth.error( request, response, error );
				}

				app.auth.success( request, response, user );
			});
		});
	},

	exposeUser: function( request, response, next ) {
		if ( !request.session.userId ) {
			return next();
		}

		this.app.user.getInstance( request.session.userId, function( error, user ) {
			if ( error ) {
				return next( error );
			}

			this._exposeUser( request, response, user );
			next();
		}.bind( this ));
	},

	_exposeUser: function( request, response, user ) {
		response.locals.activeUser = request.user = user;
	}
});
