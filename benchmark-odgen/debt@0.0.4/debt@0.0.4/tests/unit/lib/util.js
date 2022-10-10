var util = require( "../../../lib/util" );

exports.delay = {
	"no parameters": function( test ) {
		test.expect( 2 );

		var async = false;
		util.delay(function() {
			test.strictEqual( arguments.length, 0, "No arguments should be passed." );
			test.ok( async, "Should be async." );
			test.done();
		});
		async = true;
	},

	"with parameters": function( test ) {
		test.expect( 3 );

		var providedParams = [ {}, {} ];
		var async = false;
		util.delay(function( a, b ) {
			test.strictEqual( arguments.length, 2, "Should pass argumenets." );
			test.strictEqual( a, providedParams[ 0 ], "Should pass first parameter." );
			test.strictEqual( b, providedParams[ 1 ], "Should pass second parameter." );
			test.done();
		}, providedParams[ 0 ], providedParams[ 1 ] );
		async = true;
	}
};

exports.extend = {
	"empty objects": function( test ) {
		test.expect( 3 );

		var a = {};
		var b = {};
		var result = util.extend( a, b );

		test.strictEqual( result, a, "A should be returned." );
		test.deepEqual( a, {}, "A should be empty." );
		test.deepEqual( b, {}, "B should be empty." );
		test.done();
	},

	"varying values": function( test ) {
		test.expect( 3 );

		function one() {}
		function two() {}

		var a = {
			string: "s",
			number: 1,
			array: [ "a", "b", "c" ],
			object: {
				first: 1,
				second: "two"
			},
			fn: one
		};
		var b = {
			string: "string",
			number: 20,
			array: [ "apple", "banana" ],
			object: {
				first: 100,
				last: 999
			},
			fn2: two
		};
		var result = util.extend( a, b );

		test.strictEqual( result, a, "A should be returned." );
		test.deepEqual( a, {
			string: "string",
			number: 20,
			array: [ "apple", "banana" ],
			object: {
				first: 100,
				last: 999
			},
			fn: one,
			fn2: two
		}, "Objects should be merged." );
		test.deepEqual( b, {
			string: "string",
			number: 20,
			array: [ "apple", "banana" ],
			object: {
				first: 100,
				last: 999
			},
			fn2: two
		}, "B should not change." );
		test.done();
	}
};

exports.deepExtend = {
	"empty objects": function( test ) {
		test.expect( 3 );

		var a = {};
		var b = {};
		var result = util.deepExtend( a, b );

		test.strictEqual( result, a, "A should be returned." );
		test.deepEqual( a, {}, "A should be empty." );
		test.deepEqual( b, {}, "B should be empty." );
		test.done();
	},

	"varying values": function( test ) {
		test.expect( 3 );

		function one() {}
		function two() {}

		var a = {
			string: "s",
			number: 1,
			array: [ "a", "b", "c" ],
			object: {
				first: 1,
				second: "two"
			},
			fn: one
		};
		var b = {
			string: "string",
			number: 20,
			array: [ "apple", "banana" ],
			object: {
				first: 100,
				last: 999
			},
			fn2: two
		};
		var result = util.deepExtend( a, b );

		test.strictEqual( result, a, "A should be returned." );
		test.deepEqual( a, {
			string: "string",
			number: 20,
			array: [ "apple", "banana" ],
			object: {
				first: 100,
				second: "two",
				last: 999
			},
			fn: one,
			fn2: two
		}, "Objects should be merged." );
		test.deepEqual( b, {
			string: "string",
			number: 20,
			array: [ "apple", "banana" ],
			object: {
				first: 100,
				last: 999
			},
			fn2: two
		}, "B should not change." );
		test.done();
	}
};

exports.escapeHtml = {
	"no replacement": function( test ) {
		test.expect( 1 );

		var escaped = util.escapeHtml( "Hello, world!" );
		test.strictEqual( escaped, "Hello, world!", "No characters should be escaped." );
		test.done();
	},

	"escape all bad characters": function( test ) {
		test.expect( 1 );

		var escaped = util.escapeHtml( "<name> says, \"Hello & goodbye, y'all!\"" );
		test.strictEqual( escaped,
			"&lt;name&gt; says, &quot;Hello &amp; goodbye, y&#039;all!&quot;",
			"All bad characters should be replaced." );
		test.done();
	}
};

exports.htmlTag = {
	"no attributes": function( test ) {
		test.expect( 1 );

		var html = util.htmlTag( "blink" );
		test.strictEqual( html, "<blink>", "Should produce just the tag with no attributes." );
		test.done();
	},

	"empty attributes": function( test ) {
		test.expect( 1 );

		var html = util.htmlTag( "blink", {} );
		test.strictEqual( html, "<blink>", "Should produce just the tag with no attributes." );
		test.done();
	},

	"with attributes": function( test ) {
		test.expect( 1 );

		var html = util.htmlTag( "a", {
			href: "/",
			title: "5 > 2"
		});
		test.strictEqual( html, "<a href='/' title='5 &gt; 2'>",
			"Should contain escaped attributes." );
		test.done();
	},

	"boolean attributes": function( test ) {
		test.expect( 1 );

		var html = util.htmlTag( "input", {
			type: "checkbox",
			checked: true,
			disabled: false
		});
		test.strictEqual( html, "<input type='checkbox' checked='checked'>",
			"Should contain expanded checked and no disabled." );
		test.done();
	}
};

exports.isLabel = {
	"empty": function( test ) {
		test.expect( 1 );

		test.strictEqual( util.isLabel( "" ), false, "Should not accept empty label." );
		test.done();
	},

	"invalid": function( test ) {
		test.expect( 4 );

		test.strictEqual( util.isLabel( "-" ), false,
			"Cannot start with a dash" );
		test.strictEqual( util.isLabel( "_" ), false,
			"Cannot start with an underscore" );
		test.strictEqual( util.isLabel( "a@b" ), false,
			"Cannot contain special characters." );
		test.strictEqual( util.isLabel( new Array( 65 ).join( "a" ) ), false,
			"Cannot be >63 characters" );
		test.done();
	},

	"valid": function( test ) {
		test.expect( 3 );

		test.ok( util.isLabel( "a" ), "Minimal label" );
		test.ok( util.isLabel( "A-_bC",
			"Should accept Capitals, dashes, underscores." ) );
		test.ok( util.isLabel( new Array( 64 ).join( "a" ) ),
			"Should accept 63 characters." );
		test.done();
	}
};

exports.isEmail = {
	"empty": function( test ) {
		test.expect( 1 );

		test.strictEqual( util.isEmail( "" ), false, "Should not accept empty email." );
		test.done();
	},

	"invalid": function( test ) {
		test.expect( 7 );

		var longLabel = new Array( 65 ).join( "a" );

		test.strictEqual( util.isEmail( "debt" ), false,
			"Cannot be local only." );
		test.strictEqual( util.isEmail( "@example.com" ), false,
			"Cannot be domain only." );
		test.strictEqual( util.isEmail( "debt@example" ), false,
			"Cannot have a domain with only one label." );
		test.strictEqual( util.isEmail( "debt@-example.com" ), false,
			"Cannot start domain with a hyphen." );
		test.strictEqual( util.isEmail( "debt@example-.com" ), false,
			"Cannot end domain with a hyphen." );
		test.strictEqual( util.isEmail( "debt@example!com" ), false,
			"Cannot contain special characters in domain." );
		test.strictEqual( util.isEmail( "debt@" + longLabel + ".com" ), false,
			"Cannot contain domain label >63 characters." );
		test.done();
	},

	"valid": function( test ) {
		test.expect( 3 );

		var longLabel = new Array( 64 ).join( "a" );

		test.ok( util.isEmail( longLabel + longLabel + "@example.com" ),
			"Should accept very long local address." );
		test.ok( util.isEmail( "debt@" + longLabel + ".com" ),
			"Should accept 63 character domain labels." );
		test.ok( util.isEmail( ".!#$%&'*+/=?^_`{|}~-a9@example.com" ),
			"Should accept certain special characters in local address." );
		test.done();
	}
};

exports.createError = {
	"simple error": function( test ) {
		test.expect( 1 );

		var error = util.createError({
			message: "too much debt"
		});

		test.strictEqual( error.message, "too much debt", "Should preserve message." );
		test.done();
	},

	"complex error": function( test ) {
		test.expect( 3 );

		var error = util.createError({
			code: "E_TEST",
			message: "too much debt",
			debt: Number.MAX_VALUE
		});

		test.strictEqual( error.message, "E_TEST: too much debt",
			"Should prefix message with code." );
		test.strictEqual( error.code, "E_TEST", "Should preserve code." );
		test.strictEqual( error.debt, Number.MAX_VALUE, "Should preserve arbitrary values." );
		test.done();
	}
};
