var util = require( "./util" );

exports = module.exports = permission;
exports.Permission = Permission;

function permission( app ) {
	return new Permission( app );
}

function Permission( app ) {
	this.app = app;
	this.database = this.app.database;

	this.permissions = {
		DEBT: [ "ADMIN" ]
	};

	Permission.nativePermissions.forEach(function( permission ) {
		this.register.apply( this, permission.split( ":" ) );
	}.bind( this ));
}

util.extend( Permission.prototype, {
	register: function( component, action ) {
		if ( !component ) {
			throw util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `component`.",
				field: "component"
			});
		}

		if ( !util.isLabel( component ) ) {
			throw util.createError({
				code: "E_INVALID_DATA",
				message: "Invalid `component` (" + component + ").",
				field: "component",
				component: component
			});
		}

		if ( !action ) {
			throw util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `action`.",
				field: "action"
			});
		}

		if ( !util.isLabel( action ) ) {
			throw util.createError({
				code: "E_INVALID_DATA",
				message: "Invalid `action` (" + action + ").",
				field: "action",
				action: action
			});
		}

		component = component.toUpperCase();
		action = action.toUpperCase();

		if ( !this.permissions.hasOwnProperty( component ) ) {
			this.permissions[ component ] = [ "ADMIN" ];
		}

		this.permissions[ component ].push( action );
	},

	grantToUser: function( userId, permission, callback ) {
		if ( !userId ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `userId`.",
				field: "userId"
			}));
		}

		if ( !permission ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `permission`.",
				field: "permission"
			}));
		}

		if ( typeof permission === "string" ) {
			permission = [ permission ];
		}

		this._grant( "user", userId, permission, callback );
	},

	grantToGroup: function( groupId, permission, callback ) {
		if ( !groupId ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `groupId`.",
				field: "groupId"
			}));
		}

		if ( !permission ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `permission`.",
				field: "permission"
			}));
		}

		if ( typeof permission === "string" ) {
			permission = [ permission ];
		}

		this._grant( "group", groupId, permission, callback );
	},

	getUserPermissions: function( userId, callback ) {
		if ( !userId ) {
			return util.delay( callback, util.createError({
				code: "E_MISSING_DATA",
				message: "Missing required parameter `userId`.",
				field: "userId"
			}));
		}

		var connection = callback.connection || this.database;
		connection.query(
			"SELECT `permission` FROM `userPermissions` WHERE `userId` = ?",
			[ userId ],
		function( error, rows ) {
			if ( error ) {
				return callback( error );
			}

			callback( null, this._rawToObject( rows ) );
		}.bind( this ));
	},

	satisfies: function( permissions, permission ) {
		var parts = permission.split( ":" );
		var component = parts[ 0 ];
		var action = parts[ 1 ];

		if ( permissions.DEBT && permissions.DEBT.ADMIN ) {
			return true;
		}

		if ( !permissions[ component ] ) {
			return false;
		}

		return !!permissions[ component ].ADMIN || !!permissions[ component ][ action ];
	},

	_rawToObject: function( rows ) {
		var permissions = {};

		rows.forEach(function( row ) {
			var parts = row.permission.split( ":" );
			var component = parts[ 0 ];
			var action = parts[ 1 ];

			if ( !permissions.hasOwnProperty( component ) ) {
				permissions[ component ] = {};
			}

			permissions[ component ][ action ] = true;
		});

		return permissions;
	},

	_validPermission: function( permission ) {
		var parts = permission.split( ":" );
		var component = parts[ 0 ];
		var action = parts[ 1 ];

		if ( !component || !action || !this.permissions.hasOwnProperty( component ) ||
				this.permissions[ component ].indexOf( action ) === -1 ) {
			return false;
		}

		return true;
	},

	_grant: function( type, id, permissions, callback ) {
		var invalidPermission;
		permissions.some(function( permission, index ) {

			// Normalize permission
			permissions[ index ] = permission = permission.toUpperCase();

			// Validate permission
			if ( !this._validPermission( permission ) ) {
				invalidPermission = permission;
				return true;
			}
		}.bind( this ));

		if ( invalidPermission ) {
			return util.delay( callback, util.createError({
				code: "E_INVALID_DATA",
				message: "Invalid permission (" + invalidPermission + ").",
				field: "permission",
				permission: invalidPermission
			}));
		}

		var tableName = type + "Permissions";
		var idName = type + "Id";

		var valueQueries = permissions.map(function() {
			return "(?, ?)";
		}).join( "," );

		var values = [];
		permissions.forEach(function( permission ) {
			values.push( id, permission );
		});

		var connection = callback.connection || this.database;
		connection.query(
			"INSERT INTO `" + tableName + "` (`" + idName + "`, `permission`) VALUES " +
				valueQueries,
			values,
		function( error ) {
			if ( error ) {
				return callback( error );
			}

			callback( null );
		});
	}
});

Permission.nativePermissions = [
	"TICKET:CREATE",
	"TICKET:EDIT",
	"TICKET:DELETE",

	"GROUP:CREATE",
	"GROUP:DELETE",

	"PERMISSION:GRANT",
	"PERMISSION:REVOKE"
];
