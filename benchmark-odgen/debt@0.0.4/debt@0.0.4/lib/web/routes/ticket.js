module.exports = function( web ) {

var app = web.get( "debt" );

// Redirect all /ticket/ URLs to /tickets/
web.get( /^\/ticket\/(.+)/, function( request, response ) {
	response.redirect( 301, "/tickets/" + request.params[ 0 ] );
});

web.get( "/tickets/new", web.authorize, function( request, response, next ) {
	if ( !request.user || !request.user.hasPermission( "TICKET:CREATE" ) ) {
		return next( util.createError({
			code: "E_UNAUTHORIZED",
			message: "Insufficient privileges for creating tickets.",
			permission: "TICKET:CREATE"
		}));
	}

	response.render( "ticket-new" );
});

web.post( "/tickets", web.authorize, function( request, response, next ) {
	if ( !request.user || !request.user.hasPermission( "TICKET:CREATE" ) ) {
		return next( util.createError({
			code: "E_UNAUTHORIZED",
			message: "Insufficient privileges for creating tickets.",
			permission: "TICKET:CREATE"
		}));
	}

	// TODO: validation

	app.ticket.create({
		title: request.body.title,
		body: request.body.body,
		userId: request.user.id
	}, function( error, ticketId ) {
		if ( error ) {
			return response.send( 500 );
		}

		response.redirect( "/tickets/" + ticketId );
	});
});

web.get( "/tickets/:id", function( request, response, next ) {
	app.ticket.getInstance( request.params.id, function( error, ticket ) {
		if ( error ) {
			return next( error );
		}

		ticket.getComments(function( error, comments ) {
			if ( error ) {
				return next( error );
			}

			ticket.comments = comments;
			response.render( "ticket-view", ticket );
		});
	});
});

web.post( "/tickets/:ticketId/comments", function( request, response, next ) {
	if ( !request.user || !request.user.hasPermission( "TICKET:CREATE" ) ) {
		return next( util.createError({
			code: "E_UNAUTHORIZED",
			message: "Insufficient privileges for creating tickets.",
			permission: "TICKET:CREATE"
		}));
	}

	// TODO: validation

	var ticketId = request.params.ticketId;
	app.ticket.getInstance( ticketId, function( error, ticket ) {
		if ( error ) {
			return next( error );
		}

		ticket.addComment({
			body: request.body.body,
			userId: request.user.id
		}, function( error, commentId ) {
			if ( error ) {
				return next( error );
			}

			response.redirect( "/tickets/" + ticketId + "#comment-" + commentId );
		});
	});
});

};
