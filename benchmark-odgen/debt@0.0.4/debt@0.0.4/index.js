var Database = require( "./lib/database" );
var web = require( "./lib/web" );
var util = require( "./lib/util" );
var webDefaults = require( "./lib/web/defaults" );
var githubAuthProvider = require( "./lib/auth/github" );

exports = module.exports = debt;
exports.Debt = Debt;

function debt( options, callback ) {
	var app = new Debt( options );
	app.init(function( error ) {
		if ( error ) {
			return callback( error );
		}

		callback( null, app );
	});
}

function Debt( options ) {

	// Just merge default options
	// Everything else waits until the app is initialized
	this.options = util.deepExtend({
		authProvider: githubAuthProvider,
		cookieSecret: "exceptional bug tracking",
		title: "DEBT",
		express: webDefaults( this ),
	}, options );
}

util.extend( Debt.prototype, {
	basePath: __dirname,

	init: function( callback ) {
		var error = this._checkRequiredOptions();
		if ( error ) {
			return util.delay( callback, error );
		}

		// Remove database options to prevent leaking information to templates
		var databaseOptions = this.options.database;
		delete this.options.database;

		// Connect to the database
		Database.createClient( databaseOptions, function( error, database ) {
			if ( error ) {
				return callback( error );
			}

			this.database = database;
			this._initModules();
			this._getState(function( error, state ) {
				if ( error ) {
					return callback( error );
				}

				this.state = state;
				callback( null );
			}.bind( this ));
		}.bind( this ));
	},

	_checkRequiredOptions: function() {
		if ( !this.options.database || !this.options.database.host || !this.options.database.user ||
				!this.options.database.database ) {
			return new Error( "Missing required database settings." );
		}
	},

	_initModules: function() {
		this.ticket = require( "./lib/ticket" )( this );
		this.comment = require( "./lib/comment" )( this );
		this.field = require( "./lib/field" )( this );
		this.user = require( "./lib/user" )( this );
		this.group = require( "./lib/group" )( this );
		this.permission = require( "./lib/permission" )( this );
		this.auth = require( "./lib/auth" )( this );
		this.handlebars = require( "./lib/handlebars" );

		// Create Express application
		this.web = web.createServer( this );

		// Initialize auth provider
		this.auth.init();
	},

	_getState: function( callback ) {
		this.database.query( "SELECT COUNT(*) AS `count` FROM `users`", function( error, rows ) {
			var state;

			if ( error ) {
				if ( error.code !== "ER_NO_SUCH_TABLE" ) {
					return callback( error );
				}

				state = "database-setup";
			}

			if ( !state ) {
				if ( !rows[ 0 ].count ) {
					state = "user-setup";
				} else {
					state = "installed";
				}
			}

			callback( null, state );
		});
	},

	install: function( callback ) {
		this.database.createTables( callback );
	},

	listen: function() {
		this.web.listen.apply( this.web, arguments );
	}
});
