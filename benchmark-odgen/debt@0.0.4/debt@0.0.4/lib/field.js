var fs = require( "fs" );
var basename = require( "path" ).basename;
var inherits = require( "util" ).inherits;
var util = require( "./util" );
var Field = require( "../model/field" ).Field;

exports = module.exports = fieldManager;
exports.FieldManager = FieldManager;

function fieldManager( app ) {
	return new FieldManager( app );
}

function FieldManager( app ) {
	this.app = app;
	this.database = app.database;

	// Map of type name to constructor
	this.types = {};

	// Register all native field types
	Object.keys( FieldManager.nativeTypes ).forEach(function( type ) {
		this.register( type, FieldManager.nativeTypes[ type ] );
	}.bind( this ));
}

util.extend( FieldManager.prototype, {
	register: function( type, prototype ) {
		if ( !type ) {
			throw util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `type`.",
				field: "type"
			});
		}

		if ( !util.isLabel( type ) ) {
			throw util.createError({
				code: "E_INVALID_DATA",
				message: "Invalid `type` (" + type + ").",
				field: "type",
				type: type
			});
		}

		function Constructor() {
			Field.apply( this, arguments );
		}

		inherits( Constructor, Field );

		prototype.type = type;
		util.extend( Constructor.prototype, prototype );
		this.types[ type ] = Constructor;
	},

	create: function( settings, callback ) {
		if ( !settings.type ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required field `type`.",
				field: "type"
			}));
		}

		if ( !this.types.hasOwnProperty( settings.type ) ) {
			return util.delay( callback, util.createError({
				code: "E_INVALID_DATA",
				message: "Invalid `type` (" + settings.type + ").",
				field: "type",
				type: settings.type
			}));
		}

		if ( !settings.label ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required field `label`.",
				field: "label"
			}));
		}

		if ( settings.label.length > 63 ) {
			return util.delay( callback, util.createError({
				code: "E_INVALID_DATA",
				message: "Invalid `label` (" + settings.label + ").",
				field: "label",
				label: settings.label
			}));
		}

		var connection = callback.connection || this.database;

		// TODO: Check for duplicate labels

		connection.query(
			"INSERT INTO `fields` SET " +
				"`type` = ?," +
				"`label` = ?," +
				"`config` = ?",
			[ settings.type, settings.label, settings.config || "" ],
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
			"SELECT * FROM `fields` WHERE `id` = ?",
			[ id ],
		function( error, rows ) {
			if ( error ) {
				return callback( error );
			}

			if ( !rows.length ) {
				return callback( util.createError({
					code: "E_NOT_FOUND",
					message: "Unknown field id: " + id,
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

			var Constructor = this.types[ settings.type ];

			if ( !Constructor ) {
				return callback( new Error( "Invalid `type` (" + settings.type + ") " +
					"for field " + id + "." ) );
			}

			var field = new Constructor( this.app, id );
			field.initFromSettings( settings, function( error ) {
				if ( error ) {
					return callback( error );
				}

				callback( null, field );
			});
		}.bind( this ));
	}
});

// Load all built-in field types
FieldManager.nativeTypes = {};
fs.readdirSync( __dirname + "/field" ).forEach(function( module ) {
	var type = basename( module, ".js" );
	var prototype = require( "./field/" + type );
	FieldManager.nativeTypes[ type ] = prototype;
});
