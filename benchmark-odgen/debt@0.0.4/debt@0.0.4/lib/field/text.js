var util = require( "../util" );

module.exports = {
	render: function( value ) {
		return util.escapeHtml( value );
	},

	renderEditable: function( value ) {
		return util.htmlTag( "input", {
			value: value,
			id: this.inputName,
			name: this.inputName
		});
	},

	validate: function( value ) {
		return true;
	}
};
