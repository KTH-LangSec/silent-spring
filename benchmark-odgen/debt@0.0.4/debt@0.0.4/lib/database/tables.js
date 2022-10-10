var async = require( "async" );
var util = require( "../util" );

module.exports = function( Database ) {

util.extend( Database.prototype, {
	createTables: function( callback ) {
		async.parallel([
			this.createUsersTable.bind( this ),
			this.createTicketsTable.bind( this ),
			this.createFieldsTable.bind( this ),
			this.createTicketFieldsTable.bind( this ),
			this.createCommentsTable.bind( this ),
			this.createGroupsTable.bind( this ),
			this.createUserGroupsTable.bind( this ),
			this.createUserPermissionsTable.bind( this ),
			this.createGroupPermissionsTable.bind( this )
		], callback );
	},

	createTicketsTable: function( callback ) {
		this.query(
			"CREATE TABLE `tickets` (" +
				"`id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY," +
				"`title` VARCHAR(255) NOT NULL," +
				"`body` TEXT," +
				"`userId` INT UNSIGNED NOT NULL," +
				"`created` TIMESTAMP NOT NULL DEFAULT NOW()," +
				"`edited` TIMESTAMP NOT NULL," +

				"FOREIGN KEY (userId) " +
					"REFERENCES users(id)" +
			") ENGINE=InnoDB DEFAULT CHARSET=utf8", callback );
	},

	createFieldsTable: function( callback ) {
		this.query(
			"CREATE TABLE `fields` (" +
				"`id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY," +
				"`type` VARCHAR(63) NULL," +
				"`label` VARCHAR(63) UNIQUE NOT NULL," +
				"`config` TEXT" +
			") ENGINE=InnoDB DEFAULT CHARSET=utf8", callback );
	},

	createTicketFieldsTable: function( callback ) {
		this.query(
			"CREATE TABLE `ticketFields` (" +
				"`ticketId` INT UNSIGNED NOT NULL," +
				"`fieldId` INT UNSIGNED NOT NULL," +
				"`value` VARCHAR(255) NOT NULL," +

				"INDEX `ticket` (`ticketId`)," +
				"INDEX `field_value` (`fieldId`, `value`)," +

				"FOREIGN KEY (ticketId) " +
					"REFERENCES tickets(id) " +
					"ON DELETE CASCADE," +

				"FOREIGN KEY (fieldId) " +
					"REFERENCES fields(id)" +
			") ENGINE=InnoDB DEFAULT CHARSET=utf8", callback );
	},

	createCommentsTable: function( callback ) {
		this.query(
			"CREATE TABLE `comments` (" +
				"`id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY," +
				"`body` TEXT NOT NULL," +
				"`ticketId` INT UNSIGNED NOT NULL," +
				"`userId` INT UNSIGNED NOT NULL," +
				"`created` TIMESTAMP NOT NULL DEFAULT NOW()," +

				"INDEX `ticket` (`ticketId`)," +

				"FOREIGN KEY (ticketId) " +
					"REFERENCES tickets(id) " +
					"ON DELETE CASCADE," +

				"FOREIGN KEY (userId) " +
					"REFERENCES users(id)" +
			") ENGINE=InnoDB DEFAULT CHARSET=utf8", callback );
	},

	createUsersTable: function( callback ) {
		this.query(
			"CREATE TABLE `users` (" +
				"`id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY," +
				"`username` VARCHAR(63) UNIQUE NOT NULL," +
				"`email` VARCHAR(255) NOT NULL," +
				"`name` VARCHAR(255)," +
				"`apiKey` CHAR(40)" +
			") ENGINE=InnoDB DEFAULT CHARSET=utf8", callback );
	},

	createGroupsTable: function( callback ) {
		this.query(
			"CREATE TABLE `groups` (" +
				"`id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY," +
				"`name` VARCHAR(63) UNIQUE NOT NULL," +
				"`description` VARCHAR(255)" +
			") ENGINE=InnoDB DEFAULT CHARSET=utf8", callback );
	},

	createUserGroupsTable: function( callback ) {
		this.query(
			"CREATE TABLE `userGroups` (" +
				"`userId` INT UNSIGNED NOT NULL," +
				"`groupId` INT UNSIGNED NOT NULL," +

				"FOREIGN KEY (userId) " +
					"REFERENCES users(id) " +
					"ON DELETE CASCADE," +

				"FOREIGN KEY (groupId) " +
					"REFERENCES groups(id) " +
					"ON DELETE CASCADE" +
			") ENGINE=InnoDB DEFAULT CHARSET=utf8", callback );
	},

	createUserPermissionsTable: function( callback ) {
		this.query(
			"CREATE TABLE `userPermissions` (" +
				"`userId` INT UNSIGNED NOT NULL," +
				"`permission` VARCHAR(63) NOT NULL," +

				"FOREIGN KEY (userId) " +
					"REFERENCES users(id) " +
					"ON DELETE CASCADE" +
			") ENGINE=InnoDB DEFAULT CHARSET=utf8", callback );
	},

	createGroupPermissionsTable: function( callback ) {
		this.query(
			"CREATE TABLE `groupPermissions` (" +
				"`groupId` INT UNSIGNED NOT NULL," +
				"`permission` VARCHAR(63) NOT NULL," +

				"FOREIGN KEY (groupId) " +
					"REFERENCES groups(id) " +
					"ON DELETE CASCADE" +
			") ENGINE=InnoDB DEFAULT CHARSET=utf8", callback );
	}
});

};
