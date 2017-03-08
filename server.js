var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false,
    maxReceivedFrameSize: 4 * 1024 * 1024,
    maxReceivedMessageSize: 4 * 1024 * 1024
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var destConnection = null;

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    console.log(request.origin);
    //Appka sprawdza w DB czy dany origin jest i zapisuje informacje o połączeniu (że z tego origina).
    //Dzięki temu jak łączy się potem admin to dostaje dane z wszystkich WSów ze swojego origina.

    var proto = request.requestedProtocols[0];

    if (proto == "write-protocol") {
        var connection = request.accept('write-protocol', request.origin);

        console.log((new Date()) + ' Connection accepted.');

        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                //console.log('Received Message: ' + message.utf8Data);
                if (destConnection) {
                    destConnection.sendUTF(message.utf8Data);
                }
            }
            else if (message.type === 'binary') {
                //console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
                if (destConnection) {
                    destConnection.sendBytes(message.binaryData);
                }
            }
        });

        connection.on('close', function(reasonCode, description) {
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        });
    }

    if (proto == "read-protocol") {
        destConnection = request.accept('read-protocol', request.origin);

        console.log((new Date()) + ' Dest connection accepted.');

        destConnection.on('close', function(reasonCode, description) {
            console.log((new Date()) + ' Dest peer ' + destConnection.remoteAddress + ' disconnected.');
        });
    }
});
