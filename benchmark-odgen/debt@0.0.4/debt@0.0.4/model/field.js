var Model = require( "./model" ).Model;
var util = require( "../lib/util" );

exports.Field = Model.factory( "Field", {
	_initFromSettings: function( settings, callback ) {
		this.label = settings.label;
		this.config = settings.config;
		this.inputName = "field_" +
			this.label.toLowerCase().replace( /[^a-z]/g, "" );
		callback( null );
	},

	// Abstract methods

	render: function( value ) {
		throw new Error( "Missing required method `render()` " +
			"for field type '" + this.type + "'." );
	},

	renderEditable: function( value ) {
		throw new Error( "Missing required method `renderEditable()` " +
			"for field type '" + this.type + "'." );
	},

	validate: function( value ) {
		throw new Error( "Missing required method `validate()` " +
			"for field type '" + this.type + "'." );
	}
});
