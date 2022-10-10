var fs = require( "fs" );

all([
	unitTests,
	checkDco
], function( errors ) {
	if ( errors.length ) {
		process.exit( 1 );
	}
});

function all( steps, callback ) {
	var errors = [];

	function next() {
		var step = steps.shift();
		step(function( error ) {
			if ( error ) {
				errors.push( error );
			}

			if ( !steps.length ) {
				return callback( errors );
			}

			next();
		});
	}

	next();
}

function unitTests( callback ) {
	var nodeunit = require( "nodeunit" );
	var reporter = nodeunit.reporters.default;
	var options = require( "nodeunit/bin/nodeunit.json" );

	reporter.run([ "tests/unit/lib", "tests/unit/model" ], options, callback );
}

function checkDco( callback ) {
	var dco = require( "../tools/dco" );

	console.log();
	console.log( "Checking commits for licensing..." );
	dco.getCommitErrors(function( error, errors ) {
		if ( error ) {
			return callback( error );
		}

		if ( errors.length ) {
			console.log( "The following errors exist:" );
			errors.forEach(function( error ) {
				console.log( "- " + error );
			});

			return callback( new Error( "Invalid commits." ) );
		}

		console.log( "All commits have appropriate licensing." );
		callback( null );
	});
}
