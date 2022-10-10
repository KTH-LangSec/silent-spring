var CommentManager = require( "../../../lib/comment" ).CommentManager;

exports.create = {
	setUp: function( done ) {
		this.app = {
			database: {}
		};
		this.commentManager = new CommentManager( this.app );
		done();
	},

	"missing ticketId": function( test ) {
		test.expect( 3 );

		this.commentManager.create({
			userId: 37,
			body: "pay down your debt"
		}, function( error ) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required field `ticketId`.",
				"Should throw for missing ticketId." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "ticketId", "Should pass field name with error." );
			test.done();
		});
	},

	"missing userId": function( test ) {
		test.expect( 3 );

		this.commentManager.create({
			ticketId: 99,
			body: "pay down your debt"
		}, function( error ) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required field `userId`.",
				"Should throw for missing userId." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "userId", "Should pass field name with error." );
			test.done();
		});
	},

	"missing body": function( test ) {
		test.expect( 3 );

		this.commentManager.create({
			ticketId: 99,
			userId: 37
		}, function( error ) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required field `body`.",
				"Should throw for missing body." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "body", "Should pass field name with error." );
			test.done();
		});
	},

	"invalid reference": function( test ) {
		test.expect( 7 );

		var providedError = new Error();

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `comments` SET " +
					"`ticketId` = ?," +
					"`userId` = ?," +
					"`body` = ?," +
					"`created` = NOW()",
				"Query should insert values into database." );
			test.deepEqual( values,
				[ 99, 37, "pay down your debt" ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( providedError );
			});
		};

		this.app.database.referenceError = function( error ) {
			test.strictEqual( error, providedError, "Should check if error is a reference error." );
			return "ticketId";
		};

		this.commentManager.create({
			ticketId: 99,
			userId: 37,
			body: "pay down your debt"
		}, function( error ) {
			test.strictEqual( error.message, "E_INVALID_DATA: Invalid `ticketId` (99)." );
			test.strictEqual( error.code, "E_INVALID_DATA" );
			test.strictEqual( error.field, "ticketId", "Should pass field name with error." );
			test.strictEqual( error.ticketId, 99, "Should pass field value with error." );
			test.done();
		});
	},

	"database insertion error": function( test ) {
		test.expect( 4 );

		var providedError = new Error( "database gone" );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `comments` SET " +
					"`ticketId` = ?," +
					"`userId` = ?," +
					"`body` = ?," +
					"`created` = NOW()",
				"Query should insert values into database." );
			test.deepEqual( values,
				[ 99, 37, "pay down your debt" ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( providedError );
			});
		};

		this.app.database.referenceError = function( error ) {
			test.strictEqual( error, providedError, "Should check if error is a reference error." );
			return null;
		};

		this.commentManager.create({
			ticketId: 99,
			userId: 37,
			body: "pay down your debt"
		}, function( error ) {
			test.strictEqual( error.message, "database gone", "Should pass the error." );
			test.done();
		});
	},

	"minimal": function( test ) {
		test.expect( 4 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `comments` SET " +
					"`ticketId` = ?," +
					"`userId` = ?," +
					"`body` = ?," +
					"`created` = NOW()",
				"Query should insert values into database." );
			test.deepEqual( values,
				[ 99, 37, "pay down your debt" ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, { insertId: 123 } );
			});
		};

		this.commentManager.create({
			ticketId: 99,
			userId: 37,
			body: "pay down your debt"
		}, function( error, id ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( id, 123, "Should return inserted id." );
			test.done();
		});
	},

	"with created": function( test ) {
		test.expect( 5 );

		this.app.database.escape = function( value ) {
			test.deepEqual( value, new Date( "Wed Nov 27 16:24:07 2013 -0500" ),
				"Should escape created value" );

			return "'escaped date'";
		};

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `comments` SET " +
					"`ticketId` = ?," +
					"`userId` = ?," +
					"`body` = ?," +
					"`created` = 'escaped date'",
				"Query should insert values into database." );
			test.deepEqual( values,
				[ 99, 37, "pay down your debt" ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, { insertId: 123 } );
			});
		};

		this.commentManager.create({
			ticketId: 99,
			userId: 37,
			body: "pay down your debt",
			created: new Date( "Wed Nov 27 16:24:07 2013 -0500" )
		}, function( error, id ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( id, 123, "Should return inserted id." );
			test.done();
		});
	}
};

exports.get = {
	setUp: function( done ) {
		this.app = {
			database: {}
		};
		this.commentManager = new CommentManager( this.app );
		done();
	},

	"missing id": function( test ) {
		test.expect( 3 );

		this.commentManager.get( null, function( error ) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required parameter `id`.",
				"Should throw for missing id." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "id", "Should pass field name with error." );
			test.done();
		});
	},

	"database query error": function( test ) {
		test.expect( 3 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `comments` WHERE `id` = ?",
				"Query should search by id." );
			test.deepEqual( values, [ 37 ], "Should pass values for escaping." );

			process.nextTick(function() {
				callback( new Error( "database gone" ) );
			});
		};

		this.commentManager.get( 37, function( error ) {
			test.strictEqual( error.message, "database gone", "Should pass the error." );
			test.done();
		});
	},

	"not found": function( test ) {
		test.expect( 5 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `comments` WHERE `id` = ?",
				"Query should search by id." );
			test.deepEqual( values, [ 37 ], "Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, [] );
			});
		};

		this.commentManager.get( 37, function( error ) {
			test.strictEqual( error.message, "E_NOT_FOUND: Unknown comment id: 37",
				"Should pass the error." );
			test.strictEqual( error.code, "E_NOT_FOUND" );
			test.strictEqual( error.id, 37, "Should pass id with error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 4 );

		var providedComment = {
			id: 123,
			ticketId: 99,
			userId: 37,
			body: "pay down your debt",
			created: new Date( "Wed Nov 27 16:24:07 2013 -0500" )
		};

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `comments` WHERE `id` = ?",
				"Query should search by id." );
			test.deepEqual( values, [ 37 ], "Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, [ providedComment ] );
			});
		};

		this.commentManager.get( 37, function( error, comment ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( comment, providedComment, "Should pass comment." );
			test.done();
		});
	}
};

exports.getTicketComments = {
	setUp: function( done ) {
		this.app = {
			database: {}
		};
		this.commentManager = new CommentManager( this.app );
		done();
	},

	"missing ticketId": function( test ) {
		test.expect( 3 );

		this.commentManager.getTicketComments( null, function( error ) {
			test.strictEqual( error.message,
				"E_MISSING_DATA: Missing required parameter `ticketId`.",
				"Should throw for missing name." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "ticketId", "Should pass field name with error." );
			test.done();
		});
	},

	"database query error": function( test ) {
		test.expect( 3 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `comments` WHERE `ticketId` = ?",
				"Query should search by ticketId." );
			test.deepEqual( values, [ 99 ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( new Error( "database gone" ) );
			});
		};

		this.commentManager.getTicketComments( 99, function( error ) {
			test.strictEqual( error.message, "database gone", "Should pass the error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 4 );

		var providedComments = {};

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `comments` WHERE `ticketId` = ?",
				"Query should search by ticketId." );
			test.deepEqual( values, [ 99 ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, providedComments );
			});
		};

		this.commentManager.getTicketComments( 99, function( error, comments ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( comments, providedComments, "Should pass comment." );
			test.done();
		});
	}
};
