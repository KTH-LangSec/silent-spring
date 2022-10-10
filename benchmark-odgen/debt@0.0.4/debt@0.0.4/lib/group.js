var util = require( "./util" );

exports = module.exports = group;
exports.Group = Group;

function group( app ) {
	return new Group( app );
}

function Group( app ) {
	this.app = app;
	this.database = this.app.database;
}

util.extend( Group.prototype, {
	create: function( data, callback ) {
		if ( !data.name ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required field `name`.",
				field: "name"
			}));
		}

		if ( !util.isLabel( data.name ) ) {
			return util.delay( callback, util.createError({
				code: "E_INVALID_DATA",
				message: "Invalid `name` (" + data.name + ").",
				field: "name",
				name: data.name
			}));
		}

		var connection = callback.connection || this.database;
		connection.query(
			"INSERT INTO `groups` SET " +
				"`name` = ?," +
				"`description` = ?",
			[ data.name, data.description || "" ],
		function( error, result ) {
			if ( error ) {
				return callback( error );
			}

			callback( null, result.insertId );
		});
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
			"SELECT * FROM `groups` WHERE `id` = ?",
			[ id ],
		function( error, rows ) {
			if ( error ) {
				return callback ( error );
			}

			if ( !rows.length ) {
				return callback( util.createError({
					code: "E_NOT_FOUND",
					message: "Unknown group id: " + id,
					id: id
				}));
			}

			callback( null, rows[ 0 ] );
		});
	},

	getByName: function( name, callback ) {
		if ( !name ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `name`.",
				field: "name"
			}));
		}

		var connection = callback.connection || this.database;
		connection.query(
			"SELECT * FROM `groups` WHERE `name` = ?",
			[ name ],
		function( error, rows ) {
			if ( error ) {
				return callback ( error );
			}

			if ( !rows.length ) {
				return callback( null, null );
			}

			callback( null, rows[ 0 ] );
		});
	}
});
