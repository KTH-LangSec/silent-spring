var Field = require( "../../../model/field" ).Field;

exports._initFromSettings = {
	setUp: function( done ) {
		this.app = {};
		this.field = new Field( this.app, 37 );
		done();
	},

	"valid": function( test ) {
		test.expect( 4 );

		this.field._initFromSettings({
			id: 37,
			type: "fake",
			label: "my field",
			config: "custom config"
		}, function( error ) {
			test.strictEqual( error, null, "Should not pass an error." );
			test.strictEqual( this.field.label, "my field",
				"Should save label." );
			test.strictEqual( this.field.config, "custom config",
				"Should save config." );
			test.strictEqual( this.field.inputName, "field_myfield",
				"Should generate inputName." );
			test.done();
		}.bind( this ));
	}
};

// TODO: abstract methods
