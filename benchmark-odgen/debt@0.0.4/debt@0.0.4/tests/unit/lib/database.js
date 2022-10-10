var inherits = require( "util" ).inherits;
var mysql = require( "mysql" );
var Database = require( "../../../lib/database" );
var Transaction = Database.Transaction;

exports.constructor = {
	setUp: function( done ) {
		this._createPool = mysql.createPool;
		done();
	},

	tearDown: function( done ) {
		mysql.createPool = this._createPool;
		done();
	},

	"pool error": function( test ) {
		test.expect( 3 );

		var providedOptions = {};
		var providedError = new Error();

		mysql.createPool = function( options ) {
			test.strictEqual( options, providedOptions, "Should pass options." );

			return {
				getConnection: function( callback ) {
					test.ok( "Should get a connection." );

					process.nextTick(function() {
						callback( providedError );
					});
				}
			};
		};

		new Database( providedOptions, function( error ) {
			test.strictEqual( error, providedError, "Should pass error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 4 );

		var providedOptions = {};
		var providedConnection = {};

		mysql.createPool = function( options ) {
			test.strictEqual( options, providedOptions, "Should pass options." );

			return {
				getConnection: function( callback ) {
					test.ok( "Should get a connection." );

					process.nextTick(function() {
						callback( null, providedConnection );
					});
				}
			};
		};

		var database = new Database( providedOptions, function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( database.connection, providedConnection,
				"Should have a connection." );
			test.done();
		});
	}
};

exports.referenceError = {
	"no error": function( test ) {
		test.expect( 1 );

		test.strictEqual( Database.prototype.referenceError( new Error() ), null,
			"Should not treat generic error as a reference error." );
		test.done();
	},

	"reference error": function( test ) {
		test.expect( 1 );

		var error = new Error();
		error.code = "ER_NO_REFERENCED_ROW_";
		error.message = "Cannot add or update a child row: " +
			"a foreign key constraint fails (" +
				"`bug-tracker`.`comments`, " +
				"CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)" +
			")";

		test.strictEqual( Database.prototype.referenceError( error ), "userId",
			"Should parse field id out of reference error." );
		test.done();
	}
};

exports[ "Transaction constructor" ] = {
	setUp: function( done ) {
		this.connection = {};
		this.database = {
			pool: {
				getConnection: function( callback ) {
					process.nextTick(function() {
						callback( null, this.connection );
					}.bind( this ));
				}.bind( this )
			}
		};
		done();
	},

	"pool error": function( test ) {
		test.expect( 2 );

		var providedError = new Error();

		this.database.pool.getConnection = function( callback ) {
			test.ok( "Should get a connection." );

			process.nextTick(function() {
				callback( providedError );
			});
		};

		new Transaction( this.database, function( error ) {
			test.strictEqual( error, providedError, "Should pass error." );
			test.done();
		});
	},

	"start error": function( test ) {
		test.expect( 3 );

		var providedError = new Error();

		this.connection.query = function( query, callback ) {
			test.strictEqual( query, "START TRANSACTION", "Should start transaction." );

			process.nextTick(function() {
				callback( providedError );
			});
		};

		this.connection.release = function() {
			test.ok( "Should release connection." );
		};

		new Transaction( this.database, function( error ) {
			test.strictEqual( error, providedError, "Should pass error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 3 );

		this.connection.query = function( query, callback ) {
			test.strictEqual( query, "START TRANSACTION", "Should start transaction." );

			process.nextTick(function() {
				callback( null );
			});
		};

		var transaction = new Transaction( this.database, function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( transaction.connection, this.connection, "Should store connection." );
			test.done();
		}.bind( this ));
	}
};

exports[ "Transaction done" ] = {
	setUp: function( done ) {
		this.connection = {
			query: function( query, callback ) {
				process.nextTick(function() {
					callback( null );
				});
			}
		};
		this.database = {
			pool: {
				getConnection: function( callback ) {
					process.nextTick(function() {
						callback( null, this.connection );
					}.bind( this ));
				}.bind( this )
			}
		};
		this.transaction = new Transaction( this.database, function() {
			done();
		});
	},

	"rollback error": function( test ) {
		test.expect( 3 );

		var providedError = new Error();

		this.connection.query = function( query, callback ) {
			test.strictEqual( query, "ROLLBACK", "Should rollback transaction." );

			process.nextTick(function() {
				callback( providedError );
			});
		};

		this.connection.release = function() {
			test.ok( "Should release connection." );
		};

		this.transaction.done( new Error(), function( error ) {
			test.strictEqual( error, providedError, "Should pass error." );
			test.done();
		});
	},

	"rollback success": function( test ) {
		test.expect( 3 );

		var providedError = new Error();

		this.connection.query = function( query, callback ) {
			test.strictEqual( query, "ROLLBACK", "Should rollback transaction." );

			process.nextTick(function() {
				callback( null );
			});
		};

		this.connection.release = function() {
			test.ok( "Should release connection." );
		};

		this.transaction.done( providedError, function( error ) {
			test.strictEqual( error, providedError, "Should pass error." );
			test.done();
		});
	},

	"commit error": function( test ) {
		test.expect( 3 );

		var providedError = new Error();

		this.connection.query = function( query, callback ) {
			test.strictEqual( query, "COMMIT", "Should commit transaction." );

			this.transaction.done = function( error, callback ) {
				test.strictEqual( error, providedError, "Should pass error to done()." );

				process.nextTick(function() {
					callback( error );
				});
			};

			process.nextTick(function() {
				callback( providedError );
			});
		}.bind( this );

		this.transaction.done( null, function( error ) {
			test.strictEqual( error, providedError, "Should pass error." );
			test.done();
		});
	},

	"commit success": function( test ) {
		test.expect( 3 );

		this.connection.query = function( query, callback ) {
			test.strictEqual( query, "COMMIT", "Should commit transaction." );

			process.nextTick(function() {
				callback( null );
			});
		}.bind( this );

		this.connection.release = function() {
			test.ok( true, "Should release connection." );
		};

		this.transaction.done( null, function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.done();
		});
	}
};

exports.transaction = {
	setUp: function( done ) {
		this._Transaction = Database.Transaction;

		this.connection = {};
		this.pool = {
			getConnection: function( callback ) {
				process.nextTick(function() {
					callback( null, this.connection );
				}.bind( this ));
			}.bind( this )
		};

		this._createPool = mysql.createPool;
		mysql.createPool = function() {
			return this.pool;
		}.bind( this );

		this.database = new Database( {}, function() {
			done();
		});
	},

	tearDown: function( done ) {
		Database.Transaction = this._Transaction;
		mysql.createPool = this._createPool;
		done();
	},

	"constructor error": function( test ) {
		test.expect( 2 );

		var providedDatabase = this.database;
		var providedError = new Error();

		Database.Transaction = function( database, callback ) {
			test.strictEqual( database, providedDatabase, "Should pass database." );

			process.nextTick(function() {
				callback( providedError );
			});
		};

		this.database.transaction( {}, function( error ) {
			test.strictEqual( error, providedError, "Should pass error." );
			test.done();
		});
	},

	"action error": function( test ) {
		test.expect( 4 );

		var providedTransaction;
		var providedDatabase = this.database;
		var providedError = new Error();

		Database.Transaction = function( database, callback ) {
			providedTransaction = this;

			test.strictEqual( database, providedDatabase, "Should pass database." );

			process.nextTick(function() {
				callback( null );
			});
		};

		this.database.transaction({
			first: function( transaction, callback ) {
				test.strictEqual( transaction, providedTransaction, "Should pass transaction." );

				transaction.done = function( error, callback ) {
					test.strictEqual( error, providedError, "Should pass error." );

					process.nextTick(function() {
						callback( error );
					});
				};

				process.nextTick(function() {
					callback( providedError );
				});
			}
		}, function( error ) {
			test.strictEqual( error, providedError, "Should pass error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 7 );

		var providedTransaction;
		var originalTransaction = this._Transaction;
		var providedDatabase = this.database;
		var providedError = new Error();

		Database.Transaction = function( database, callback ) {
			providedTransaction = this;

			test.strictEqual( database, providedDatabase, "Should pass database." );

			this.query = function( query, callback ) {
				process.nextTick(function() {
					callback( null );
				});
			};

			originalTransaction.apply( this, arguments );
		};

		inherits( Database.Transaction, this._Transaction );

		this.database.transaction({
			first: function( transaction, callback ) {
				test.strictEqual( transaction, providedTransaction, "Should pass transaction." );

				process.nextTick(function() {
					transaction.set( "foo", "bar" );
					callback( null, "first result" );
				});
			},

			second: function( transaction, callback ) {
				test.strictEqual( transaction.get( "foo" ), "bar", "Should store arbitrary data." );
				test.strictEqual( transaction.get( "first" ), "first result",
					"Should store action result." );

				transaction.done = function( error, callback ) {
					test.strictEqual( error, null, "Should not pass error." );

					process.nextTick(function() {
						callback( null );
					});
				};

				process.nextTick(function() {
					callback( null, "second result" );
				});
			}
		}, function( error, data ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.deepEqual( data, {
				foo: "bar",
				first: "first result",
				second: "second result"
			});
			test.done();
		});
	}
};
