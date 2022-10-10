var crypto = require( "crypto" );
var util = require( "./util" );
var User = require( "../model/user" ).User;

exports = module.exports = userManager;
exports.UserManager = UserManager;

function userManager( app ) {
	return new UserManager( app );
}

function UserManager( app ) {
	this.app = app;
	this.database = this.app.database;
}

util.extend( UserManager.prototype, {
	create: function( data, callback ) {
		if ( !data.username ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required field `username`.",
				field: "username"
			}));
		}

		if ( !util.isLabel( data.username ) ) {
			return util.delay( callback, util.createError({
				code: "E_INVALID_DATA",
				message: "Invalid `username` (" + data.username + ").",
				field: "username",
				username: data.username
			}));
		}

		if ( !data.email ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required field `email`.",
				field: "email"
			}));
		}

		if ( !util.isEmail( data.email ) ) {
			return util.delay( callback, util.createError({
				code: "E_INVALID_DATA",
				message: "Invalid `email` (" + data.email + ").",
				field: "email",
				email: data.email
			}));
		}

		var connection = callback.connection || this.database;

		this._createApiKey(function( error, apiKey ) {
			if ( error ) {
				return callback( error );
			}

			connection.query(
				"INSERT INTO `users` SET " +
					"`username` = ?," +
					"`email` = ?," +
					"`name` = ?," +
					"`apiKey` = ?",
				[ data.username, data.email, data.name || "", apiKey ],
			function( error, result ) {
				if ( error ) {
					return callback( error );
				}

				callback( null, result.insertId );
			});
		}.bind( this ));
	},

	get: function( id, callback ) {
		if ( !id ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `id`.",
				field: "id"
			}));
		}

		var connection = callback.connection || this.database;
		connection.query(
			"SELECT * FROM `users` WHERE `id` = ?",
			[ id ],
		function( error, rows ) {
			if ( error ) {
				return callback ( error );
			}

			if ( !rows.length ) {
				return callback( util.createError({
					code: "E_NOT_FOUND",
					message: "Unknown user id: " + id,
					id: id
				}));
			}

			callback( null, rows[ 0 ] );
		});
	},

	getByUsername: function( username, callback ) {
		if ( !username ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `username`.",
				field: "username"
			}));
		}

		var connection = callback.connection || this.database;
		connection.query(
			"SELECT * FROM `users` WHERE `username` = ?",
			[ username ],
		function( error, rows ) {
			if ( error ) {
				return callback ( error );
			}

			if ( !rows.length ) {
				return callback( null, null );
			}

			callback( null, rows[ 0 ] );
		});
	},

	getInstance: function( id, callback ) {
		this.get( id, function( error, settings ) {
			if ( error ) {
				return callback( error );
			}

			this._getInstance( settings, callback );
		}.bind( this ));
	},

	getInstanceByUsername: function( username, callback ) {
		this.getByUsername( username, function( error, settings ) {
			if ( error ) {
				return callback( error );
			}

			if ( !settings ) {
				return callback( null, null );
			}

			this._getInstance( settings, callback );
		}.bind( this ));
	},

	_getInstance: function( settings, callback ) {
		var user = new User( this.app, settings.id );
		user.initFromSettings( settings, function( error ) {
			if ( error ) {
				return callback( error );
			}

			callback( null, user );
		});
	},

	_createApiKey: function( callback ) {
		var shasum = crypto.createHash( "sha1" );
		crypto.randomBytes( 256, function( error, data ) {
			if ( error ) {
				return callback( error );
			}

			shasum.update( data );
			callback( null, shasum.digest( "hex" ) );
		});
	}
});
