var TicketManager = require( "../../../lib/ticket" ).TicketManager;
var Ticket = require( "../../../model/ticket" ).Ticket;

exports.create = {
	setUp: function( done ) {
		this.app = {
			database: {}
		};
		this.ticketManager = new TicketManager( this.app );
		done();
	},

	"missing title": function( test ) {
		test.expect( 3 );

		this.ticketManager.create({
			body: "some description",
			userId: 37
		}, function( error ) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required field `title`.",
				"Should throw for missing title." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "title", "Should pass field name with error." );
			test.done();
		});
	},

	"missing userId": function( test ) {
		test.expect( 3 );

		this.ticketManager.create({
			title: "my ticket",
			body: "some description"
		}, function( error ) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required field `userId`.",
				"Should throw for missing userId." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "userId", "Should pass field name with error." );
			test.done();
		});
	},

	"invalid reference": function( test ) {
		test.expect( 7 );

		var providedError = new Error();

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `tickets` SET " +
					"`title` = ?," +
					"`body` = ?," +
					"`userId` = ?," +
					"`created` = NOW()," +
					"`edited` = NOW()",
				"Query should insert values into database." );
			test.deepEqual( values, [ "my ticket", "some description", 37 ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( providedError );
			});
		};

		this.app.database.referenceError = function( error ) {
			test.strictEqual( error, providedError, "Should check if error is a reference error." );
			return "userId";
		};

		this.ticketManager.create({
			title: "my ticket",
			body: "some description",
			userId: 37
		}, function( error ) {
			test.strictEqual( error.message, "E_INVALID_DATA: Invalid `userId` (37)." );
			test.strictEqual( error.code, "E_INVALID_DATA" );
			test.strictEqual( error.field, "userId", "Should pass field name with error." );
			test.strictEqual( error.userId, 37, "Should pass field value with error." );
			test.done();
		});
	},

	"database insertion error": function( test ) {
		test.expect( 4 );

		var providedError = new Error( "database gone" );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `tickets` SET " +
					"`title` = ?," +
					"`body` = ?," +
					"`userId` = ?," +
					"`created` = NOW()," +
					"`edited` = NOW()",
				"Query should insert values into database." );
			test.deepEqual( values, [ "my ticket", "some description", 37 ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( providedError );
			});
		};

		this.app.database.referenceError = function( error ) {
			test.strictEqual( error, providedError, "Should check if error is a reference error." );
			return null;
		};

		this.ticketManager.create({
			title: "my ticket",
			body: "some description",
			userId: 37
		}, function( error ) {
			test.strictEqual( error.message, "database gone", "Should pass the error." );
			test.done();
		});
	},

	"minimal": function( test ) {
		test.expect( 4 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `tickets` SET " +
					"`title` = ?," +
					"`body` = ?," +
					"`userId` = ?," +
					"`created` = NOW()," +
					"`edited` = NOW()",
				"Query should insert values into database." );
			test.deepEqual( values, [ "my ticket", "some description", 37 ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, { insertId: 99 } );
			});
		};

		this.ticketManager.create({
			title: "my ticket",
			body: "some description",
			userId: 37
		}, function( error, id ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( id, 99, "Should return inserted id." );
			test.done();
		});
	},

	"with created": function( test ) {
		test.expect( 5 );

		this.app.database.escape = function( value ) {
			test.deepEqual( value, new Date( "Mon Nov 4 2013 11:01:54 -0500" ),
				"Should escape created value" );

			return "'escaped date'";
		};

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `tickets` SET " +
					"`title` = ?," +
					"`body` = ?," +
					"`userId` = ?," +
					"`created` = 'escaped date'," +
					"`edited` = NOW()",
				"Query should insert values into database." );
			test.deepEqual( values, [ "my ticket", "some description", 37 ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, { insertId: 99 } );
			});
		};

		this.ticketManager.create({
			title: "my ticket",
			body: "some description",
			userId: 37,
			created: new Date( "Mon Nov 4 2013 11:01:54 -0500" )
		}, function( error, id ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( id, 99, "Should return inserted id." );
			test.done();
		});
	}
};

exports.get = {
	setUp: function( done ) {
		this.app = {
			database: {}
		};
		this.ticketManager = new TicketManager( this.app );
		done();
	},

	"missing id": function( test ) {
		test.expect( 3 );

		this.ticketManager.get( null, function( error) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required parameter `id`.",
				"Should throw for missing id." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "id", "Should pass field name with error." );
			test.done();
		});
	},

	"not found": function( test ) {
		test.expect( 5 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `tickets` WHERE `id` = ?",
				"Query should select values by id." );
			test.deepEqual( values, [ 37 ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, [] );
			});
		};

		this.ticketManager.get( 37, function( error ) {
			test.strictEqual( error.message, "E_NOT_FOUND: Unknown ticket id: 37",
				"Should pass the error." );
			test.strictEqual( error.code, "E_NOT_FOUND" );
			test.strictEqual( error.id, 37, "Should pass id with error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 4 );

		var providedTicket = {
			id: 37,
			title: "my ticket",
			body: "some description",
			userId: 99,
			created: new Date( "Mon Nov 4 2013 11:01:54 -0500" ),
			edited: new Date( "Mon Dec 9 2013 20:56:17 -0500" )
		};

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `tickets` WHERE `id` = ?",
				"Query should select values by id." );
			test.deepEqual( values, [ 37 ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, [ providedTicket ] );
			});
		};

		this.ticketManager.get( 37, function( error, ticket ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( ticket, providedTicket, "Should pass ticket." );
			test.done();
		});
	}
};

exports.getInstance = {
	setUp: function( done ) {
		this._initFromSettings = Ticket.prototype.initFromSettings;

		this.app = {};
		this.ticketManager = new TicketManager( this.app );
		done();
	},

	tearDown: function( done ) {
		Ticket.prototype.initFromSettings = this._initFromSettings;
		done();
	},

	"get error": function( test ) {
		test.expect( 2 );

		this.ticketManager.get = function( id, callback ) {
			test.strictEqual( id, 37, "Should pass id." );

			process.nextTick(function() {
				callback( new Error( "database gone" ) );
			});
		};

		this.ticketManager.getInstance( 37, function( error ) {
			test.strictEqual( error.message, "database gone", "Should pass the error." );
			test.done();
		});
	},

	"init error": function( test ) {
		test.expect( 3 );

		var providedSettings = {
			id: 37,
			title: "my ticket",
			body: "some description",
			userId: 99,
			created: new Date( "Mon Nov 4 2013 11:01:54 -0500" ),
			edited: new Date( "Mon Dec 9 2013 20:56:17 -0500" )
		};

		this.ticketManager.get = function( id, callback ) {
			test.strictEqual( id, 37, "Should pass id." );

			process.nextTick(function() {
				callback( null, providedSettings );
			});
		};

		Ticket.prototype.initFromSettings = function( settings, callback ) {
			test.strictEqual( settings, providedSettings, "Should pass settings." );

			process.nextTick(function() {
				callback( new Error( "bad init" ) );
			});
		};

		this.ticketManager.getInstance( 37, function( error ) {
			test.strictEqual( error.message, "bad init", "Should pass the error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 4 );

		var fakeInstance;
		var providedSettings = {
			id: 37,
			title: "my ticket",
			body: "some description",
			userId: 99,
			created: new Date( "Mon Nov 4 2013 11:01:54 -0500" ),
			edited: new Date( "Mon Dec 9 2013 20:56:17 -0500" )
		};

		this.ticketManager.get = function( id, callback ) {
			test.strictEqual( id, 37, "Should pass id." );

			process.nextTick(function() {
				callback( null, providedSettings );
			});
		};

		Ticket.prototype.initFromSettings = function( settings, callback ) {
			fakeInstance = this;

			test.strictEqual( settings, providedSettings, "Should pass settings." );

			process.nextTick(function() {
				callback( null );
			});
		};

		this.ticketManager.getInstance( 37, function( error, instance ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( instance, fakeInstance, "Should pass ticket instance." );
			test.done();
		});
	}
};

exports.edit = {
	setUp: function( done ) {
		this.app = {
			database: {}
		};
		this.ticketManager = new TicketManager( this.app );
		done();
	},

	"missing id": function( test ) {
		test.expect( 3 );

		this.ticketManager.edit( null, {
			body: "some description"
		}, function( error ) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required parameter `id`.",
				"Should throw for missing id." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "id", "Should pass field name with error." );
			test.done();
		});
	},

	"database insertion error": function( test ) {
		test.expect( 3 );

		var providedError = new Error( "database gone" );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"UPDATE `tickets` SET " +
					"`body` = ?," +
					"`edited` = ? " +
				"WHERE `id` = ?",
				"Query should insert values into database." );
			test.deepEqual( values,
				[ "some description", new Date( "Mon Nov 4 2013 11:01:54 -0500" ), 99 ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( providedError );
			});
		};

		this.ticketManager.edit( 99, {
			body: "some description",
			edited: new Date( "Mon Nov 4 2013 11:01:54 -0500" )
		}, function( error ) {
			test.strictEqual( error, providedError, "Should pass the error." );
			test.done();
		});
	},

	"not found": function( test ) {
		test.expect( 5 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"UPDATE `tickets` SET " +
					"`body` = ?," +
					"`edited` = ? " +
				"WHERE `id` = ?",
				"Query should insert values into database." );
			test.deepEqual( values,
				[ "some description", new Date( "Mon Nov 4 2013 11:01:54 -0500" ), 99 ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, { affectedRows: 0 } );
			});
		};

		this.ticketManager.edit( 99, {
			body: "some description",
			edited: new Date( "Mon Nov 4 2013 11:01:54 -0500" )
		}, function( error ) {
			test.strictEqual( error.message, "E_NOT_FOUND: Unknown ticket id: 99",
				"Should pass the error." );
			test.strictEqual( error.code, "E_NOT_FOUND" );
			test.strictEqual( error.id, 99, "Should pass id with error." );
			test.done();
		});
	},

	"without edited": function( test ) {
		test.expect( 3 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"UPDATE `tickets` SET " +
					"`title` = ?," +
					"`body` = ?," +
					"`userId` = ?," +
					"`edited` = NOW() " +
				"WHERE `id` = ?",
				"Query should insert values into database." );
			test.deepEqual( values, [ "my ticket", "some description", 37, 99 ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, { affectedRows: 1 } );
			});
		};

		this.ticketManager.edit( 99, {
			title: "my ticket",
			body: "some description",
			userId: 37
		}, function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.done();
		});
	},

	"with edited": function( test ) {
		test.expect( 3 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"UPDATE `tickets` SET " +
					"`title` = ?," +
					"`body` = ?," +
					"`userId` = ?," +
					"`edited` = ? " +
				"WHERE `id` = ?",
				"Query should insert values into database." );
			test.deepEqual( values, [
				"my ticket",
				"some description",
				37,
				new Date( "Mon Nov 4 2013 11:01:54 -0500" ),
				99
			], "Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, { affectedRows: 1 } );
			});
		};

		this.ticketManager.edit( 99, {
			title: "my ticket",
			body: "some description",
			userId: 37,
			edited: new Date( "Mon Nov 4 2013 11:01:54 -0500" )
		}, function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.done();
		});
	}
};
