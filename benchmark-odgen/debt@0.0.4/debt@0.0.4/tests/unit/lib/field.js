var FieldManager = require( "../../../lib/field" ).FieldManager;
var Field = require( "../../../model/field" ).Field;

exports.register = {
	setUp: function( done ) {
		this.app = {
			database: {}
		};
		this.fieldManager = new FieldManager( this.app );
		done();
	},

	"missing type": function( test ) {
		test.expect( 4 );

		test.throws(
			function() {
				this.fieldManager.register( null, {} );
			}.bind( this ),
			function( error ) {
				test.strictEqual( error.message,
					"E_MISSING_DATA: Missing required parameter `type`." );
				test.strictEqual( error.code, "E_MISSING_DATA" );
				test.strictEqual( error.field, "type", "Should pass field name with error." );
				return true;
			},
			"Should throw for missing type."
		);
		test.done();
	},

	"invalid type": function( test ) {
		test.expect( 5 );

		test.throws(
			function() {
				this.fieldManager.register( "test type", {} );
			}.bind( this ),
			function( error ) {
				test.strictEqual( error.message, "E_INVALID_DATA: Invalid `type` (test type)." );
				test.strictEqual( error.code, "E_INVALID_DATA" );
				test.strictEqual( error.field, "type", "Should pass field name with error." );
				test.strictEqual( error.type, "test type", "Should pass type with error." );
				return true;
			},
			"Should throw for invalid type."
		);
		test.done();
	},

	"registration": function( test ) {
		test.expect( 3 );

		var prototype = {
			testProp: "test value"
		};

		this.fieldManager.register( "test", prototype );
		var Constructor = this.fieldManager.types.test;
		test.ok( Constructor, "Constructor should be stored in FieldManager.types." );
		test.strictEqual( Constructor.super_, Field,
			"Constructor should inherit from Field." );
		test.strictEqual( Constructor.prototype.testProp, "test value",
			"Prototype should pass through." );
		test.done();
	}
};

exports.create = {
	setUp: function( done ) {
		this.app = {
			database: {}
		};
		this.fieldManager = new FieldManager( this.app );
		done();
	},

	"missing type": function( test ) {
		test.expect( 3 );

		this.fieldManager.create({
			label: "my field"
		}, function( error ) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required field `type`.",
				"Should throw for missing type." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "type", "Should pass field name with error." );
			test.done();
		});
	},

	"invalid type": function( test ) {
		test.expect( 4 );

		this.fieldManager.create({
			type: "fake",
			label: "my field"
		}, function( error ) {
			test.strictEqual( error.message, "E_INVALID_DATA: Invalid `type` (fake).",
				"Should throw for invalid type." );
			test.strictEqual( error.code, "E_INVALID_DATA" );
			test.strictEqual( error.field, "type", "Should pass field name with error." );
			test.strictEqual( error.type, "fake", "Should pass type with error." );
			test.done();
		});
	},

	"missing label": function( test ) {
		test.expect( 3 );

		this.fieldManager.create({
			type: "text"
		}, function( error ) {
			test.strictEqual( error.message, "E_MISSING_DATA: Missing required field `label`.",
				"Should throw for missing label." );
			test.strictEqual( error.code, "E_MISSING_DATA" );
			test.strictEqual( error.field, "label", "Should pass field name with error." );
			test.done();
		});
	},

	"invalid label": function( test ) {
		test.expect( 4 );

		var label = new Array( 65 ).join( "a" );

		this.fieldManager.create({
			type: "text",
			label: label
		}, function( error ) {
			test.strictEqual( error.message, "E_INVALID_DATA: Invalid `label` (" + label + ").",
				"Should throw for invalid label." );
			test.strictEqual( error.code, "E_INVALID_DATA" );
			test.strictEqual( error.field, "label", "Should pass field name with error." );
			test.strictEqual( error.label, label, "Should pass label with error." );
			test.done();
		});
	},

	"database insertion error": function( test ){
		test.expect( 3 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `fields` SET " +
					"`type` = ?," +
					"`label` = ?," +
					"`config` = ?",
				"Query should insert values into database." );
			test.deepEqual( values, [ "text", "my field", "" ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( new Error( "database gone" ) );
			});
		};

		this.fieldManager.create({
			type: "text",
			label: "my field"
		}, function( error ) {
			test.strictEqual( error.message, "database gone", "Should pass the error." );
			test.done();
		});
	},

	"minimal": function( test ) {
		test.expect( 4 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `fields` SET " +
					"`type` = ?," +
					"`label` = ?," +
					"`config` = ?",
				"Query should insert values into database." );
			test.deepEqual( values, [ "text", "my field", "" ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, { insertId: 37 } );
			});
		};

		this.fieldManager.create({
			type: "text",
			label: "my field"
		}, function( error, id ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( id, 37, "Should return inserted id." );
			test.done();
		});
	},

	"with config": function( test ) {
		test.expect( 4 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"INSERT INTO `fields` SET " +
					"`type` = ?," +
					"`label` = ?," +
					"`config` = ?",
				"Query should insert values into database." );
			test.deepEqual( values, [ "text", "my field", "custom config" ],
				"Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, { insertId: 37 } );
			});
		};

		this.fieldManager.create({
			type: "text",
			label: "my field",
			config: "custom config"
		}, function( error, id ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( id, 37, "Should return inserted id." );
			test.done();
		});
	}
};

exports.get = {
	setUp: function( done ) {
		this.app = {
			database: {}
		};
		this.fieldManager = new FieldManager( this.app );
		done();
	},

	"missing id": function( test ) {
		test.expect( 3 );

		this.fieldManager.get( null, function( error ) {
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
				"SELECT * FROM `fields` WHERE `id` = ?",
				"Query should search by id." );
			test.deepEqual( values, [ 37 ], "Should pass values for escaping." );

			process.nextTick(function() {
				callback( new Error( "database gone" ) );
			});
		};

		this.fieldManager.get( 37, function( error ) {
			test.strictEqual( error.message, "database gone", "Should pass the error." );
			test.done();
		});
	},

	"unknown field": function( test ) {
		test.expect( 5 );

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `fields` WHERE `id` = ?",
				"Query should search by id." );
			test.deepEqual( values, [ 37 ], "Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, [] );
			});
		};

		this.fieldManager.get( 37, function( error ) {
			test.strictEqual( error.message, "E_NOT_FOUND: Unknown field id: 37",
				"Should pass the error." );
			test.strictEqual( error.code, "E_NOT_FOUND" );
			test.strictEqual( error.id, 37, "Should pass id with error." );
			test.done();
		});
	},

	"existing field": function( test ) {
		test.expect( 4 );

		var providedSettings = {
			id: 37,
			type: "text",
			label: "my field",
			config: "custom config"
		};

		this.app.database.query = function( query, values, callback ) {
			test.strictEqual( query,
				"SELECT * FROM `fields` WHERE `id` = ?",
				"Query should search by id." );
			test.deepEqual( values, [ 37 ], "Should pass values for escaping." );

			process.nextTick(function() {
				callback( null, [ providedSettings ]);
			});
		};

		this.fieldManager.get( 37, function( error, settings ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( settings, providedSettings, "Should pass settings." );
			test.done();
		});
	}
};

exports.getInstance = {
	setUp: function( done ) {
		this.app = {};
		this.fieldManager = new FieldManager( this.app );
		done();
	},

	"get error": function( test ) {
		test.expect( 2 );

		this.fieldManager.get = function( id, callback ) {
			test.strictEqual( id, 37, "Should pass id." );

			process.nextTick(function() {
				callback( new Error( "database gone" ) );
			});
		};

		this.fieldManager.getInstance( 37, function( error ) {
			test.strictEqual( error.message, "database gone", "Should pass the error." );
			test.done();
		});
	},

	"invalid type": function( test ) {
		test.expect( 2 );

		this.fieldManager.get = function( id, callback ) {
			test.strictEqual( id, 37, "Should pass id." );

			process.nextTick(function() {
				callback( null, {
					id: 37,
					type: "fake",
					label: "my field",
					config: ""
				});
			});
		};

		this.fieldManager.getInstance( 37, function( error ) {
			test.strictEqual( error.message, "Invalid `type` (fake) for field 37.",
				"Should pass the error." );
			test.done();
		});
	},

	"init error": function( test ) {
		test.expect( 5 );

		var providedApp = this.app;
		var providedSettings = {
			id: 37,
			type: "fake",
			label: "my field",
			config: ""
		};

		this.fieldManager.get = function( id, callback ) {
			test.strictEqual( id, 37, "Should pass id." );

			process.nextTick(function() {
				callback( null, providedSettings );
			});
		};

		this.fieldManager.types.fake = function( app, id ) {
			test.strictEqual( app, providedApp, "Should pass app to field." );
			test.strictEqual( id, 37, "Should pass id to field." );

			this.initFromSettings = function( settings, callback ) {
				test.strictEqual( settings, providedSettings, "Should pass settings." );

				process.nextTick(function() {
					callback( new Error( "bad init" ) );
				});
			};
		};

		this.fieldManager.getInstance( 37, function( error ) {
			test.strictEqual( error.message, "bad init", "Should pass the error." );
			test.done();
		});
	},

	"valid field": function( test ) {
		test.expect( 5 );

		var fakeInstance;
		var providedApp = this.app;
		var providedSettings = {
			id: 37,
			type: "fake",
			label: "my field",
			config: ""
		};

		this.fieldManager.get = function( id, callback ) {
			process.nextTick(function() {
				callback( null, providedSettings );
			});
		};

		this.fieldManager.types.fake = function( app, id ) {
			fakeInstance = this;

			test.strictEqual( app, providedApp, "Should pass app to field." );
			test.strictEqual( id, 37, "Should pass id to field." );

			this.initFromSettings = function( settings, callback ) {
				test.strictEqual( settings, providedSettings, "Should pass settings." );

				process.nextTick(function() {
					callback( null );
				});
			};
		};

		this.fieldManager.getInstance( 37, function( error, instance ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( instance, fakeInstance, "Should pass field instance." );
			test.done();
		});
	}
};
