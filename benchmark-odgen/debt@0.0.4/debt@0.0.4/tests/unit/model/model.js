var Model = require( "../../../model/model" ).Model;

exports.factory = {
	"create model": function( test ) {
		test.expect( 4 );

		var prototype = {
			foo: function() {}
		};

		var model = Model.factory( "Test", prototype );
		test.strictEqual( typeof model, "function", "Model should be a function." );
		test.strictEqual( model.prototype.constructor, model, "Constructor should exist." );
		test.strictEqual( model.prototype.module, "test", "Should store module." );
		test.strictEqual( model.prototype.foo, prototype.foo, "Should copy prototype properties." );
		test.done();
	}
};

exports.init = {
	setUp: function( done ) {
		this.Test = Model.factory( "Test", {} );
		this.app = {
			test: {}
		};
		done();
	},

	"app.{module}.get error": function( test ) {
		test.expect( 2 );

		this.app.test.get = function( id, callback ) {
			test.strictEqual( id, 37, "Should pass id to module." );

			process.nextTick(function() {
				callback( new Error( "get error" ) );
			});
		};

		var instance = new this.Test( this.app, 37 );
		instance.init(function( error ) {
			test.strictEqual( error.message, "get error", "Should pass the error." );
			test.done();
		});
	},

	"initFromSettings error": function( test ) {
		test.expect( 3 );

		var providedSettings = {};

		this.app.test.get = function( id, callback ) {
			test.strictEqual( id, 37, "Should pass id to module." );

			process.nextTick(function() {
				callback( null, providedSettings );
			});
		};

		this.Test.prototype.initFromSettings = function( settings, callback ) {
			test.strictEqual( settings, providedSettings, "Should pass settings." );

			process.nextTick(function() {
				callback( new Error( "init error" ) );
			});
		};

		var instance = new this.Test( this.app, 37 );
		instance.init(function( error ) {
			test.strictEqual( error.message, "init error", "Should pass the error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 5 );

		var providedSettings = {};

		this.app.test.get = function( id, callback ) {
			test.strictEqual( id, 37, "Should pass id to module." );

			process.nextTick(function() {
				callback( null, providedSettings );
			});
		};

		this.Test.prototype.initFromSettings = function( settings, callback ) {
			test.strictEqual( settings, providedSettings, "Should pass settings." );

			process.nextTick(function() {
				callback( null );
			});
		};

		var instance = new this.Test( this.app, 37 );
		test.strictEqual( instance.app, this.app, "Should save app." );
		test.strictEqual( instance.id, 37, "Should save id." );
		instance.init(function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.done();
		});
	}
};

exports.initFromSettings = {
	setUp: function( done ) {
		this.Test = Model.factory( "Test", {} );
		this.app = {
			test: {}
		};
		this.test = new this.Test( this.app, 37 );
		done();
	},

	"_initFromSettings error": function( test ) {
		test.expect( 2 );

		var providedSettings = {};

		this.test._initFromSettings = function( settings, callback ) {
			test.strictEqual( settings, providedSettings, "Should pass settings." );

			process.nextTick(function() {
				callback( new Error( "init error" ) );
			});
		};

		this.test.initFromSettings( providedSettings, function( error ) {
			test.strictEqual( error.message, "init error", "Should pass the error." );
			test.done();
		});
	},

	"_init error": function( test ) {
		test.expect( 3 );

		var providedSettings = {};

		this.test._initFromSettings = function( settings, callback ) {
			test.strictEqual( settings, providedSettings, "Should pass settings." );

			process.nextTick(function() {
				callback( null );
			});
		};

		this.test._init = function( callback ) {
			test.ok( true, "Should call _init()." );

			process.nextTick(function() {
				callback( new Error( "init error" ) );
			});
		};

		this.test.initFromSettings( providedSettings, function( error ) {
			test.strictEqual( error.message, "init error", "Should pass the error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 3 );

		var providedSettings = {};

		this.test._initFromSettings = function( settings, callback ) {
			test.strictEqual( settings, providedSettings, "Should pass settings." );

			process.nextTick(function() {
				callback( null );
			});
		};

		this.test._init = function( callback ) {
			test.ok( true, "Should call _init()." );

			process.nextTick(function() {
				callback( null );
			});
		};

		this.test.initFromSettings( providedSettings, function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.done();
		});
	}
};