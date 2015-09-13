
// modules
var static = require( 'node-static' ),
    port = 5581,
    http = require( 'http' );

// config
var file = new static.Server( './', {
    cache: 600,
    gzip: true
} );

// serve
http.createServer( function ( request, response ) {
    request.addListener( 'end', function () {
        file.serve( request, response );
    } ).resume();
} ).listen( port );

