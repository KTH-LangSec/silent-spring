var Model = require( "./model" ).Model;

exports.User = Model.factory( "User", {
	hasPermission: function( permission ) {
		return this.app.permission.satisfies( this.permissions, permission );
	},

	_initFromSettings: function( settings, callback ) {
		this.username = settings.username;
		this.email = settings.email;
		this.name = settings.name;
		this.apiKey = settings.apiKey;
		callback( null );
	},

	_init: function( callback ) {
		this._loadPermissions( callback );
	},

	_loadPermissions: function( callback ) {
		this.app.permission.getUserPermissions( this.id, function( error, permissions ) {
			if ( error ) {
				return callback( error );
			}

			this.permissions = permissions;
			callback( null );
		}.bind( this ));
	}
});
