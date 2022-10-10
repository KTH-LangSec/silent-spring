var inherits = require( "util" ).inherits;
var util = require( "../lib/util" );

exports.Model = Model;

function Model( app, id ) {
	Object.defineProperty( this, "app", {
		value: app
	});
	Object.defineProperty( this, "database", {
		value: app.database
	});
	this.id = id;
}

Model.factory = function( module, prototype ) {
	function ModuleModel() {
		Model.apply( this, arguments );
	}

	inherits( ModuleModel, Model );

	ModuleModel.prototype.module = module.toLowerCase();
	util.extend( ModuleModel.prototype, prototype );

	return ModuleModel;
};

util.extend( Model.prototype, {
	init: function( callback ) {
		this.app[ this.module ].get( this.id, function( error, settings ) {
			if ( error ) {
				return callback( error );
			}

			this.initFromSettings( settings, callback );
		}.bind( this ));
	},

	initFromSettings: function( settings, callback ) {
		this._initFromSettings( settings, function( error ) {
			if ( error ) {
				return callback( error );
			}

			this._init( callback );
		}.bind( this ));
	},

	_init: function( callback ) {
		process.nextTick(function() {
			callback( null );
		});
	}
});
