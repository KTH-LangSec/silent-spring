var util = require( "./util" );
var Ticket = require( "../model/ticket" ).Ticket;

exports = module.exports = ticketManager;
exports.TicketManager = TicketManager;

function ticketManager( app ) {
	return new TicketManager( app );
}

function TicketManager( app ) {
	this.app = app;
	this.database = this.app.database;
}

util.extend( TicketManager.prototype, {
	create: function( data, callback ) {
		if ( !data.title ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required field `title`.",
				field: "title"
			}));
		}

		if ( !data.userId ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required field `userId`.",
				field: "userId"
			}));
		}

		var connection = callback.connection || this.database;
		var createdValue = data.created ?
			connection.escape( data.created ) :
			"NOW()";

		connection.query(
			"INSERT INTO `tickets` SET " +
				"`title` = ?," +
				"`body` = ?," +
				"`userId` = ?," +
				"`created` = " + createdValue + "," +
				"`edited` = NOW()",
			[ data.title, data.body || "", data.userId ],
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

			// TODO: insert fields

			callback( null, result.insertId );
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
			"SELECT * FROM `tickets` WHERE `id` = ?",
			[ id ],
		function( error, rows ) {
			if ( error ) {
				return callback ( error );
			}

			if ( !rows.length ) {
				return callback( util.createError({
					code: "E_NOT_FOUND",
					message: "Unknown ticket id: " + id,
					id: id
				}));
			}

			callback( null, rows[ 0 ] );
		});
	},

	getInstance: function( id, callback ) {
		this.get( id, function( error, settings ) {
			if ( error ) {
				return callback( error );
			}

			var ticket = new Ticket( this.app, settings.id );
			ticket.initFromSettings( settings, function( error ) {
				if ( error ) {
					return callback( error );
				}

				callback( null, ticket );
			});
		}.bind( this ));
	},

	edit: function( id, data, callback ) {
		if ( !id ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `id`.",
				field: "id"
			}));
		}

		var query = "UPDATE `tickets` SET ";
		var fields = [];
		var fieldValues = [];

		[ "title", "body", "userId", "edited" ].forEach(function( field ) {
			if ( data[ field ] ) {
				fields.push( "`" + field + "` = ?" );
				fieldValues.push( data[ field ] );
			}
		});

		if ( !data.edited ) {
			fields.push( "`edited` = NOW()" );
		}

		query += fields.join( "," ) + " WHERE `id` = ?";
		fieldValues.push( id );

		var connection = callback.connection || this.database;
		connection.query( query, fieldValues, function( error, result ) {
			if ( error ) {
				return callback( error );
			}

			if ( !result.affectedRows ) {
				return callback( util.createError({
					code: "E_NOT_FOUND",
					message: "Unknown ticket id: " + id,
					id: id
				}));
			}

			callback( null );
		});
	}
});
