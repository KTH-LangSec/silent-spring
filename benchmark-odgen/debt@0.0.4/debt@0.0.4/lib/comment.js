var async = require( "async" );
var util = require( "./util" );
var Comment = require( "../model/comment" ).Comment;

exports = module.exports = commentManager;
exports.CommentManager = CommentManager;

function commentManager( app ) {
	return new CommentManager( app );
}

function CommentManager( app ) {
	this.app = app;
	this.database = this.app.database;
}

util.extend( CommentManager.prototype, {
	create: function( data, callback ) {
		if ( !data.ticketId ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required field `ticketId`.",
				field: "ticketId"
			}));
		}

		if ( !data.userId ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required field `userId`.",
				field: "userId"
			}));
		}

		if ( !data.body ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required field `body`.",
				field: "body"
			}));
		}

		var connection = callback.connection || this.database;
		var createdValue = data.created ?
			connection.escape( data.created ) :
			"NOW()";

		connection.query(
			"INSERT INTO `comments` SET " +
				"`ticketId` = ?," +
				"`userId` = ?," +
				"`body` = ?," +
				"`created` = " + createdValue,
			[ data.ticketId, data.userId, data.body ],
		function( error, result ) {
			if ( error ) {
				var invalidField = connection.referenceError( error );
				if ( invalidField ) {
					error = util.createError({
						code: "E_INVALID_DATA",
						message: "Invalid `" + invalidField + "` (" + data[ invalidField ] + ").",
						field: invalidField
					});
					error[ invalidField ] = data[ invalidField ];
					return callback( error );
				}

				return callback( error );
			}

			callback( null, result.insertId );
		}.bind( this ));
	},

	get: function( id, callback ) {
		if ( !id ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `id`.",
				field: "id",
			}));
		}

		var connection = callback.connection || this.database;
		connection.query(
			"SELECT * FROM `comments` WHERE `id` = ?",
			[ id ],
		function( error, rows ) {
			if ( error ) {
				return callback ( error );
			}

			if ( !rows.length ) {
				return callback( util.createError({
					code: "E_NOT_FOUND",
					message: "Unknown comment id: " + id,
					id: id
				}));
			}

			callback( null, rows[ 0 ] );
		});
	},

	getTicketComments: function( ticketId, callback ) {
		if ( !ticketId ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `ticketId`.",
				field: "ticketId",
			}));
		}

		var connection = callback.connection || this.database;
		connection.query(
			"SELECT * FROM `comments` WHERE `ticketId` = ?",
			[ ticketId ],
		function( error, rows ) {
			if ( error ) {
				return callback ( error );
			}

			callback( null, rows );
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

	getTicketCommentInstances: function( ticketId, callback ) {
		this.getTicketComments( ticketId, function( error, comments ) {
			if ( error ) {
				return callback( error );
			}

			async.map( comments, function( settings, callback ) {
				this._getInstance( settings, callback );
			}.bind( this ), function( error, comments ) {
				if ( error ) {
					return callback( error );
				}

				callback( null, comments );
			});
		}.bind( this ));
	},

	_getInstance: function( settings, callback ) {
		var comment = new Comment( this.app, settings.id );
		comment.initFromSettings( settings, function( error ) {
			if ( error ) {
				return callback( error );
			}

			callback( null, comment );
		});
	},
});
