const express = require('express')
const ws = require('ws')
const lobbies = require('./lobbies')



const app = express()



/*
Protocol: [message type][message body]
where message type is a single character

types:
	server to socket:
		y - success message
		n - fail message
		c - player connected to lobby
        ♡ - (space) heartbeat, keep connection open
	socket to server:
		h - 'host' lobby (really means create new lobby)
		j - join lobby
        l - 'host' or join lobby, depending on whether it's already created or not
        L - list existing lobbies
	socket to sockets in same lobby:
		r - ready to start game
		s - start game ('host' only)
		m - chat message
		a - player taking a game action
		b - player making a game purchase
        t - timer trigger
        e - settings change
*/




// example lobby host:
// l{"name":"my lobby", "trial": 2, "mods":["API_Multiplayer", "Troubler Slimes", "ATGMChargePack"]}
//
// example lobby connect:
// c{"name":"my lobby", "mods":["API_Multiplayer", "Troubler Slimes", "ATGMChargePack"]}
// c{"name":"my lobby", "mods":["API_Multiplayer", "Wrong Mods"]}


// Set up a headless websocket server that prints any
// events that come in.
const wsServer = new ws.Server({ noServer: true })
wsServer.on('connection', (socket) => {
    console.log('new connection!')

    socket.on('close', function(reasonCode, description) {
        // close the lobby
        lobbies.closeLobbyByConnection(socket)

        return
    })

    socket.on('message', message => {
        console.log('recieved ' + message.toString())
        const messageString = message.toString()
        const messageType = messageString.charAt(0)

        const h_message = () => {
            const l_messageBody = JSON.parse(messageString.substring(1))
            if (lobbies.getLobbyByConnection(socket)) {
                socket.send('nAlready in another lobby') // fail message
                break
            }
            if (lobbies.lobbyNameTaken(l_messageBody.name)) {
                socket.send('nName taken') // fail message
                break
            }
            lobbies.addLobby(l_messageBody.name, socket, l_messageBody.trial, l_messageBody.mods.sort().join(','))
            console.log('sending success message')
            socket.send('y') // success message
        }
        const j_message  = () => {
            const c_messageBody = JSON.parse(messageString.substring(1))
            const lobby = lobbies.getLobbyByName(c_messageBody.name)
            if (lobbies.getLobbyByConnection(socket)) {
                socket.send('nAlready in another lobby') // fail message
                break
            }
            if (!lobby) {
                socket.send('nNo lobby with name') // fail message
                break
            }
            if (lobby.playerConnections.length >= 2) {
                socket.send('nLobby full') // fail message
                break
            }
            if (lobby.mods !== c_messageBody.mods.sort().join(',')) {
                socket.send('nMismatching modlist') // fail message
                break
            }

            lobbies.addPlayerToLobby(lobby, socket)
            lobbies.sendMessageToLobbyFromConnection(socket, 'c') // sends success or fail message
        }

        switch(messageType) {
        // LOBBY STUFF

        case 'h': // new lobby
            h_message()
            break
        case 'j': // connect to lobby
            j_message()
            break

        case 'l': // connect to/create lobby
            const l_messageBody = JSON.parse(messageString.substring(1))
            const lobby = lobbies.getLobbyByName(c_messageBody.name)
            if (lobby) {
                j_message()
                break
            } else {
                h_message()
                break
            }
            break
        case 'L': // list lobbies
            socket.send('y'+JSON.toString(lobbies.listAllLobbies()))
            break

        case 'd': // soft disconnect
            lobbies.sendMessageToLobbyFromConnection(socket, messageString)
            lobbies.closeLobbyByConnection(socket)
            break

        // GAME STUFF

        case 'r': // game ready to start
            // host is expected to send something like:
            // s{"seed": 12345, "char_selected": 3, "turn_mode": 2, "sp_strat": 1}

            // client:
            // s{"char_selected": 3}
        case 's':
            // game start
        case 'e':
            // settings change
        case 'm':
            // chat message
        case 't':
            // timer trigger
        case 'b':
            // in-game purchase action
        case 'a': // game action
            lobbies.sendMessageToLobbyFromConnection(socket, messageString)
            break
        }
    })
})

const heartbeatFrequency_milliseconds = 5000 
setInterval(lobbies.heartbeatAllLobbies, heartbeatFrequency_milliseconds)

// `server` is a vanilla Node.js HTTP server, so use
// the same ws upgrade process described here:
// https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
const port = process.env.PORT || 3000
const server = app.listen(port, function() {
    console.log('Listening on port %d', port);
})
server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request)
    })
})