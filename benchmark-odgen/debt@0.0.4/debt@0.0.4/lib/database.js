var inherits = require( "util" ).inherits;
var mysql = require( "mysql" );
var util = require( "./util" );

exports = module.exports = Database;
exports.createClient = createClient;

function createClient( options, callback ) {
	var database = new Database( options, function( error ) {
		if ( error ) {
			return callback( error );
		}

		callback( null, database );
	});
}

function Connection( connection ) {
	this.connection = connection;
}

util.extend( Connection.prototype, {
	query: function() {
		return this.connection.query.apply( this.connection, arguments );
	},

	escape: function() {
		return this.connection.escape.apply( this.connection, arguments );
	},

	referenceError: function( error ) {
		if ( error.code !== "ER_NO_REFERENCED_ROW_" ) {
			return null;
		}

		return (/FOREIGN KEY \(`([^`]+)`\)/).exec( error.message )[ 1 ];
	}
});

function Database( options, callback ) {
	this.pool = mysql.createPool( options );
	this.pool.getConnection(function( error, connection ) {
		if ( error ) {
			return callback( error );
		}

		Connection.call( this, connection );
		callback( null );
	}.bind( this ));
}

Database.Connection = Connection;
inherits( Database, Connection );

require( "./database/transaction" )( Database );
require( "./database/tables" )( Database );
