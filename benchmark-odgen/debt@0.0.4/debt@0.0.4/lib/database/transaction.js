var inherits = require( "util" ).inherits;
var async = require( "async" );
var util = require( "../util" );

module.exports = function( Database ) {

function Transaction( database, callback ) {
	this.data = {};

	database.pool.getConnection(function( error, connection ) {
		if ( error ) {
			return callback( error );
		}

		Database.Connection.call( this, connection );
		this.query( "START TRANSACTION", function( error ) {
			if ( error ) {
				connection.release();
				return callback( error );
			}

			callback( null );
		});
	}.bind( this ));
}

Database.Transaction = Transaction;
inherits( Transaction, Database.Connection );

util.extend( Transaction.prototype, {
	done: function( error, callback ) {
		if ( error ) {
			return this.query( "ROLLBACK", function( rollbackError ) {
				this.connection.release();
				callback( rollbackError || error );
			}.bind( this ));
		}

		this.query( "COMMIT", function( error ) {
			if ( error ) {
				return this.done( error, callback );
			}

			this.connection.release();
			callback( null );
		}.bind( this ));
	},

	wrap: function( fn ) {
		fn.connection = this.connection;
		return fn;
	},

	set: function( key, value ) {
		this.data[ key ] = value;
	},

	get: function( key ) {
		return this.data[ key ];
	}
});

Database.prototype.transaction = function( actions, callback ) {
	var transaction = new Database.Transaction( this, function( error ) {
		if ( error ) {
			return callback( error );
		}

		async.eachSeries( Object.keys( actions ), function( action, callback ) {
			actions[ action ]( transaction, function( error, data ) {
				if ( error ) {
					return callback( error );
				}

				transaction.set( action, data );
				callback( null );
			});
		}, function( error ) {
			transaction.done( error, function( error ) {
				if ( error ) {
					return callback( error );
				}

				callback( null, transaction.data );
			});
		});
	});
};

};
