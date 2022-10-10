var Model = require( "./model" ).Model;
var markdown = require( "../lib/markdown" );

exports.Comment = Model.factory( "Comment", {
	_initFromSettings: function( settings, callback ) {
		this.rawBody = settings.body;
		this.body = markdown.parse( this.rawBody );
		this.ticketId = settings.ticketId;
		this.userId = settings.userId;
		this.created = settings.created;
		callback( null );
	},

	_init: function( callback ) {
		this._loadUser( callback );
	},

	_loadUser: function( callback ) {
		this.app.user.getInstance( this.userId, function( error, user ) {
			if ( error ) {
				return callback( error );
			}

			this.user = user;
			callback( null );
		}.bind( this ));
	}
});
