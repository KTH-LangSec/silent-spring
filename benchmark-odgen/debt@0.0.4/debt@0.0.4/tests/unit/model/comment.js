var Comment = require( "../../../model/comment" ).Comment;
var markdown = require( "../../../lib/markdown" );

exports._initFromSettings = {
	setUp: function( done ) {
		this._parse = markdown.parse;

		this.app = {};
		this.comment = new Comment( this.app, 123 );
		done();
	},

	tearDown: function( done ) {
		markdown.parse = this._parse;
		done();
	},

	"valid": function( test ) {
		test.expect( 7 );

		var providedSettings = {
			id: 123,
			ticketId: 99,
			userId: 37,
			body: "pay down your debt",
			created: new Date( "Wed Nov 27 16:24:07 2013 -0500" )
		};

		markdown.parse = function( body ) {
			test.strictEqual( body, "pay down your debt" );
			return "parsed body";
		};

		this.comment._initFromSettings( providedSettings, function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( this.comment.rawBody, providedSettings.body,
				"Should save raw body." );
			test.strictEqual( this.comment.body, "parsed body",
				"Should save parsed body." );
			test.strictEqual( this.comment.ticketId, providedSettings.ticketId,
				"Should save ticketId." );
			test.strictEqual( this.comment.userId, providedSettings.userId,
				"Should save userId." );
			test.strictEqual( this.comment.created, providedSettings.created,
				"Should save created." );
			test.done();
		}.bind( this ));
	}
};

exports._init = {
	setUp: function( done ) {
		this.app = {};
		this.comment = new Comment( this.app, 123 );
		done();
	},

	"loadUser error": function( test ) {
		test.expect( 2 );

		this.comment._loadUser = function( callback ) {
			test.ok( true, "_loadUser() should be called." );

			process.nextTick(function() {
				callback( new Error( "load error" ) );
			});
		};

		this.comment._init(function( error ) {
			test.strictEqual( error.message, "load error", "Should pass the error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 2 );

		this.comment._loadUser = function( callback ) {
			test.ok( true, "_loadUser() should be called." );

			process.nextTick(function() {
				callback( null );
			});
		};

		this.comment._init(function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.done();
		});
	}
};

exports._loadUser = {
	setUp: function( done ) {
		this.app = {
			user: {}
		};
		this.comment = new Comment( this.app, 123 );
		this.comment.userId = 37;
		done();
	},

	"getInstance error": function( test ) {
		test.expect( 2 );

		this.app.user.getInstance = function( userId, callback ) {
			test.strictEqual( userId, 37, "Should pass id." );

			process.nextTick(function() {
				callback( new Error( "user error" ) );
			});
		};

		this.comment._loadUser(function( error ) {
			test.strictEqual( error.message, "user error", "Should pass the error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 3 );

		var providedUser = {};

		this.app.user.getInstance = function( userId, callback ) {
			test.strictEqual( userId, 37, "Should pass id." );

			process.nextTick(function() {
				callback( null, providedUser );
			});
		};

		this.comment._loadUser(function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( this.comment.user, providedUser, "Should store user." );
			test.done();
		}.bind( this ));
	}
};
