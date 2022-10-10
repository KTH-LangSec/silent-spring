var async = require( "async" );
var debt = require( ".." );

var app;
var userId;
var ticketId;

debt({
	database: {
		host: "localhost",
		port: 8889,
		user: "bug-tracker",
		password: "tracker",
		database: "bug-tracker"
	},
	app: {
		title: "Test Tracker"
	}
}, function( error, _app ) {
	if ( error ) {
		console.log( error );
		process.exit( 1 );
		return;
	}

	app = _app;

	app.listen( 3000 );
	console.log( "app connected" );

	populate( app );
});

function populate( app ) {
	async.series([
		dropTables,
		app.install.bind( app ),
		createUser,
		createTicket
	], function( error ) {
		if ( error ) {
			console.error( error );
			process.exit( 1 );
		}

		console.log( "DONE!" );
	});
}

function dropTable( table ) {
	return function( callback ) {
		app.database.query( "DROP TABLE IF EXISTS `" + table + "`", callback );
	};
}

function dropTables( callback ) {
	async.series([
		dropTable( "comments" ),
		dropTable( "ticketFields" ),
		dropTable( "fields" ),
		dropTable( "tickets" ),
		dropTable( "users" )
	], callback );
}

function createUser( callback ) {
	app.user.create({
		username: "scottgonzalez",
		email: "scott.gonzalez@gmail.com",
		name: "Scott González"
	}, function( error, _userId ) {
		if ( error ) {
			return callback( error );
		}

		userId = _userId;
		callback( null );
	});
}

function createTicket( callback ) {
	app.ticket.create({
		title: "My First Ticket",
		body: "Oh my! This is *so* exciting!",
		userId: userId
	}, function( error, _ticketId ) {
		if ( error ) {
			return callback( error );
		}

		ticketId = _ticketId;
		callback( null );
	});
}
