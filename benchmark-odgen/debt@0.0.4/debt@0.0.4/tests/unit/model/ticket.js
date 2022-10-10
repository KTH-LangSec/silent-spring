var Ticket = require( "../../../model/ticket" ).Ticket;
var markdown = require( "../../../lib/markdown" );

exports._initFromSettings = {
	setUp: function( done ) {
		this._parse = markdown.parse;

		this.app = {};
		this.ticket = new Ticket( this.app, 37 );
		done();
	},

	tearDown: function( done ) {
		markdown.parse = this._parse;
		done();
	},

	"valid": function( test ) {
		test.expect( 8 );

		var providedSettings = {
			id: 37,
			title: "Pay down your debt",
			body: "Your debt is *too* high!",
			userId: 99,
			created: new Date( "2012-01-12 21:00:00" ),
			edited: new Date( "2012-01-12 21:15:00" )
		};

		markdown.parse = function( body ) {
			test.strictEqual( body, "Your debt is *too* high!" );
			return "parsed body";
		};

		this.ticket._initFromSettings( providedSettings, function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( this.ticket.title, providedSettings.title,
				"Should save title." );
			test.strictEqual( this.ticket.rawBody, providedSettings.body,
				"Should save raw body." );
			test.strictEqual( this.ticket.body, "parsed body",
				"Should save parsed body." );
			test.strictEqual( this.ticket.userId, providedSettings.userId,
				"Should save userId." );
			test.strictEqual( this.ticket.created, providedSettings.created,
				"Should save created." );
			test.strictEqual( this.ticket.edited, providedSettings.edited,
				"Should save edited." );

			test.done();
		}.bind( this ));
	}
};

exports._init = {
	setUp: function( done ) {
		this.app = {};
		this.ticket = new Ticket( this.app, 37 );
		done();
	},

	"loadUser error": function( test ) {
		test.expect( 2 );

		this.ticket._loadUser = function( callback ) {
			test.ok( true, "_loadUser() should be called." );

			process.nextTick(function() {
				callback( new Error( "load error" ) );
			});
		};

		this.ticket._init(function( error ) {
			test.strictEqual( error.message, "load error", "Should pass the error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 2 );

		this.ticket._loadUser = function( callback ) {
			test.ok( true, "_loadUser() should be called." );

			process.nextTick(function() {
				callback( null );
			});
		};

		this.ticket._init(function( error ) {
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
		this.ticket = new Ticket( this.app, 37 );
		this.ticket.userId = 99;
		done();
	},

	"getInstance error": function( test ) {
		test.expect( 2 );

		this.app.user.getInstance = function( userId, callback ) {
			test.strictEqual( userId, 99, "Should pass id." );

			process.nextTick(function() {
				callback( new Error( "user error" ) );
			});
		};

		this.ticket._loadUser(function( error ) {
			test.strictEqual( error.message, "user error", "Should pass the error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 3 );

		var providedUser = {};

		this.app.user.getInstance = function( userId, callback ) {
			test.strictEqual( userId, 99, "Should pass id." );

			process.nextTick(function() {
				callback( null, providedUser );
			});
		};

		this.ticket._loadUser(function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( this.ticket.user, providedUser, "Should store user." );
			test.done();
		}.bind( this ));
	}
};

exports.getComments = {
	setUp: function( done ) {
		this.app = {
			comment: {}
		};
		this.ticket = new Ticket( this.app, 37 );
		done();
	},

	"getTicketCommentInstances error": function( test ) {
		test.expect( 2 );

		var providedError = new Error();

		this.app.comment.getTicketCommentInstances = function( ticketId, callback ) {
			test.strictEqual( ticketId, 37, "Should pass id" );

			process.nextTick(function() {
				callback( providedError );
			});
		};

		this.ticket.getComments(function( error ) {
			test.strictEqual( error, providedError, "Should pass the error." );
			test.done();
		});
	},

	"valid": function( test ) {
		test.expect( 3 );

		var providedComments = [];
		this.app.comment.getTicketCommentInstances = function( ticketId, callback ) {
			test.strictEqual( ticketId, 37, "Should pass id" );

			process.nextTick(function() {
				callback( null, providedComments );
			});
		};

		this.ticket.getComments(function( error, comments ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( comments, providedComments, "Should pass the comments." );
			test.done();
		});
	}
};

exports.addComment = {
	setUp: function( done ) {
		this.app = {
			comment: {},
			ticket: {},
			database: {}
		};
		this.ticket = new Ticket( this.app, 37 );
		done();
	},

	"valid": function( test ) {
		test.expect( 7 );

		this.app.comment.create = function( data, callback ) {
			var now = new Date();
			commentDate = data.created;

			test.deepEqual( data, {
				ticketId: 37,
				created: new Date( "2012-01-12 21:15:00" ),
				userId: 99,
				body: "a comment"
			}, "Should pass comment data." );

			process.nextTick(function() {
				callback( null, 123 );
			});
		};

		this.app.ticket.edit = function( id, data, callback ) {
			test.strictEqual( id, 37, "Should pass ticket id." );
			test.deepEqual( data, {
				edited: new Date( "2012-01-12 21:15:00" )
			}, "Should pass edited." );

			process.nextTick(function() {
				callback( null );
			});
		};

		this.app.database.transaction = function( actions, callback ) {
			function commentIdAction() {
				actions.commentId({
					wrap: function( callback ) {
						test.strictEqual( callback, updateTicketAction,
							"commentId should wrap callback." );
						return callback;
					}
				}, updateTicketAction );
			}

			function updateTicketAction() {
				actions.updateTicket({
					wrap: function( callback ) {
						test.strictEqual( callback, finish,
							"commentId should wrap callback." );
						return callback;
					}
				}, finish );
			}

			function finish() {
				callback( null, {
					commentId: 123
				});
			}

			commentIdAction();
		};

		this.ticket.addComment({
			userId: 99,
			body: "a comment",
			created: new Date( "2012-01-12 21:15:00" )
		}, function( error, commentId ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( commentId, 123, "Should pass comment id." );
			test.done();
		});
	}
};
