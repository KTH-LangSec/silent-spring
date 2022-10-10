var Group = require( "../../../lib/group" ).Group;

exports.create = {
	setUp: function( done ) {
		this.app = {
			database: {}
		};
		this.group = new Group( this.app );
		done();
	},

	"missing name": function( test ) {
		test.expect( 3 );

		this.group.create({
			description: "A group of users."
		}, function( error ) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required field `name`.",
				"Should throw for missing name." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "name", "Should pass field name with error." );
			test.done();
		});
	},

	"invalid name": function( test ) {
		test.expect( 4 );

		this.group.create({
			name: "debt collectors",
			description: "A group of users."
		}, function( error ) {
			test.strictEqual( error.message, "E_INVALID_DATA: Invalid `name` (debt collectors).",
				"Should throw for invalid name." );
			test.strictEqual( error.code, "E_INVALID_DATA" );
			test.strictEqual( error.field, "name", "Should pass field name with error." );
			test.strictEqual( error.name, "debt collectors", "Should pass name with error." );
			test.done();
		});
	},

	"database insertion error": function( test ){
		test.expect( 3 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `groups` SET " +
					"`name` = ?," +
					"`description` = ?",
				"Query should insert values into database." );
			test.deepEqual( values,
				[ "debt-collectors", "A group of users." ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( new Error( "database gone" ) );
			});
		};

		this.group.create({
			name: "debt-collectors",
			description: "A group of users."
		}, function( error ) {
			test.strictEqual( error.message, "database gone", "Should pass the error." );
			test.done();
		});
	},

	"valid": function( test ){
		test.expect( 4 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `groups` SET " +
					"`name` = ?," +
					"`description` = ?",
				"Query should insert values into database." );
			test.deepEqual( values,
				[ "debt-collectors", "A group of users." ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, { insertId: 99 } );
			});
		};

		this.group.create({
			name: "debt-collectors",
			description: "A group of users."
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
		this.group = new Group( this.app );
		done();
	},

	"missing id": function( test ) {
		test.expect( 3 );

		this.group.get( null, function( error ) {
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
				"SELECT * FROM `groups` WHERE `id` = ?",
				"Query should search by id." );
			test.deepEqual( values, [ 37 ], "Should pass values for escaping." );

			process.nextTick(function() {
				callback( new Error( "database gone" ) );
			});
		};

		this.group.get( 37, function( error ) {
			test.strictEqual( error.message, "database gone", "Should pass the error." );
			test.done();
		});
	},

	"not found": function( test ) {
		test.expect( 5 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `groups` WHERE `id` = ?",
				"Query should search by id." );
			test.deepEqual( values, [ 37 ], "Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, [] );
			});
		};

		this.group.get( 37, function( error ) {
			test.strictEqual( error.message, "E_NOT_FOUND: Unknown group id: 37",
				"Should pass the error." );
			test.strictEqual( error.code, "E_NOT_FOUND" );
			test.strictEqual( error.id, 37, "Should pass id with error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 4 );

		var providedGroup = {
			id: 37,
			name: "debt-collector",
			description: "A group of users."
		};

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `groups` WHERE `id` = ?",
				"Query should search by id." );
			test.deepEqual( values, [ 37 ], "Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, [ providedGroup ] );
			});
		};

		this.group.get( 37, function( error, group ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( group, providedGroup, "Should pass group." );
			test.done();
		});
	}
};

exports.getByName = {
	setUp: function( done ) {
		this.app = {
			database: {}
		};
		this.group = new Group( this.app );
		done();
	},

	"missing name": function( test ) {
		test.expect( 3 );

		this.group.getByName( null, function( error ) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required parameter `name`.",
				"Should throw for missing name." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "name", "Should pass field name with error." );
			test.done();
		});
	},

	"database query error": function( test ) {
		test.expect( 3 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `groups` WHERE `name` = ?",
				"Query should search by name." );
			test.deepEqual( values, [ "debt-collector" ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( new Error( "database gone" ) );
			});
		};

		this.group.getByName( "debt-collector", function( error ) {
			test.strictEqual( error.message, "database gone", "Should pass the error." );
			test.done();
		});
	},

	"not found": function( test ) {
		test.expect( 4 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `groups` WHERE `name` = ?",
				"Query should search by name." );
			test.deepEqual( values, [ "debt-collector" ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, [] );
			});
		};

		this.group.getByName( "debt-collector", function( error, group ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( group, null, "Should not pass a group." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 4 );

		var providedGroup = {
			id: 37,
			name: "debt-collector",
			description: "A group of users."
		};

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `groups` WHERE `name` = ?",
				"Query should search by name." );
			test.deepEqual( values, [ "debt-collector" ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, [ providedGroup ] );
			});
		};

		this.group.getByName( "debt-collector", function( error, group ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( group, providedGroup, "Should pass group." );
			test.done();
		});
	}
};
