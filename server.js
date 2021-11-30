
const net = require('net')
const lobbies = require('./lobbies')

/*
Protocol: [message type][message body]
where message type is a single character

types:
	server to socket:
		y - success message
		n - fail message
		c - player connected to lobby
	socket to server:
		h - 'host' lobby (really means create new lobby)
		j - join lobby
	socket to sockets in same lobby:
		r - ready to start game
		s - start game ('host' only)
		m - chat message
		a - player taking a game action
		b - player making a game purchase
*/

const server = net.createServer(socket => {
	socket.write('yConnected')
	// socket.pipe(socket) // send all output from socket to socket
	console.log('client connected')

	socket.on('error', function(err) {
		console.log(err)
	})

	socket.on('close', function() {
		console.log('client disconnected')
		// for now, just close the lobby when any player disconnects
        lobbies.closeLobbyByConnection(socket)
	})

	socket.on('data', function(message){ 
		// console.log(data);
		// var textChunk = data.toString('utf8');
		// console.log(textChunk);
		// socket.write('message recieved: ' + textChunk)


		console.log('recieved ' + message.toString())
		try {
			const messageString = message.toString()
			const messageType = messageString.charAt(0)

			console.log('processing ' + messageType + ' message')
			switch(messageType) {
			case 'h': // new lobby
				const l_messageBody = JSON.parse(messageString.substring(1))
				if (lobbies.getLobbyByConnection(socket)) {
					socket.write('nAlready in another lobby') // fail message
					break
				}
				if (lobbies.lobbyNameTaken(l_messageBody.name)) {
					socket.write('nName taken') // fail message
					break
				}
				lobbies.addLobby(l_messageBody.name, socket, l_messageBody.trial, l_messageBody.mods.sort().join(','))
				console.log('sending success message')
				socket.write('yLobby Created') // success message
				break
			case 'j': // connect to lobby
				const c_messageBody = JSON.parse(messageString.substring(1))
				const lobby = lobbies.getLobbyByName(c_messageBody.name)
				if (!lobby) {
					socket.write('nNo lobby with name') // fail message
					break
				}
				if (lobbies.getLobbyByConnection(socket)) {
					socket.write('nAlready in another lobby') // fail message
					break
				}
				if (lobby.playerConnections.length >= 2) {
					socket.write('nLobby full') // fail message
					break
				}
				if (lobby.mods !== c_messageBody.mods.sort().join(',')) {
					socket.write('nMismatching modlist') // fail message
					break
				}

				lobbies.addPlayerToLobby(lobby, socket) // sends success message
				lobbies.sendMessageToLobbyFromConnection(socket, 'c') // 'player connected'
				break

			case 'r': // game ready to start
				// host is expected to send something like:
				// s{"seed": 12345, "char_selected": 3, "turn_mode": 2, "sp_strat": 1}

				// client:
				// s{"char_selected": 3}
			case 's':
				// game start
			case 'm':
				// chat message
			case 'b':
				// in-game purchase action
			case 'a': // game action
				lobbies.sendMessageToLobbyFromConnection(socket, messageString)
				break
			}

		} catch (e) {
			console.error(e)

			try {
				socket.write('nServer Error')
			} catch (e2) {
				console.error(e2)
			}
		}
	})
})

const port = process.env.PORT || 3000
// const host = process.env.HOST || '0.0.0.0'
console.log('Server listening on port ' + port)
server.listen(port)


const express = require('express');
// const app = express();
// const http = require('http');
// const httpserver = http.createServer(app);

// const httpport = process.env.PORT || 3000
// httpserver.listen(httpport, () => {
// 	console.log('listening on *:'+httpport);
// });


const expressapp = express()
const httpserver = expressapp.listen(port)
httpserver.on('upgrade', (request, socket, head) => {
    // wsServer.handleUpgrade(request, socket, head, socket => {
    //     wsServer.emit('connection', socket, request)
    // })
	console.log('socket upgrade')
})