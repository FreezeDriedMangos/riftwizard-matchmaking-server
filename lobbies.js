
/*
type Lobby = {
	name: string,
	playerConnections: [Socket]
	trialSelected: int (-1 - ~4)
	mods: [string]
}
*/

const lobbies = []
const lobbiesByConnection = new WeakMap()

module.exports.addLobby = (name, host, trial, mods) => {
	console.log('creating lobby ' + name)
	lobbies.push({
		name,
		playerConnections: [host],
		trialSelected: trial,
		mods
	})

	lobbiesByConnection.set(host, lobbies[lobbies.length-1])
}

module.exports.addPlayerToLobby = (lobby, playerConnection) => {
	console.log('adding player to lobby ' + lobby.name)
	lobby.playerConnections.push(playerConnection)
	lobbiesByConnection.set(playerConnection, lobby)
}




module.exports.getLobbyByConnection = (connection) => {
	return lobbiesByConnection.get(connection)
}

module.exports.getLobbyByName = (name) => {
	const candidates = lobbies.filter(lobby => lobby.name === name)
	candidates.push(null)
	return candidates[0]
}

module.exports.lobbyNameTaken = (name) => {
	return module.exports.getLobbyByName(name) !== null
}

module.exports.getOtherPlayersByConnection = (connection) => {
	const lobby = module.exports.getLobbyByConnection(connection)
	if (!lobby) {
		return null
	}

	return lobby.playerConnections.filter(otherConn => otherConn !== connection)
}








module.exports.removeConnection = (connection) => {
	try {
		connection.close()
	} catch (e) {} // errors if connection is already closed. in that case don't do anything
	lobbiesByConnection.delete(connection)
}

module.exports.closeLobby = (lobby) => {
	if (lobby) {
		console.log('Closing lobby ' + lobby.name)

		lobby.playerConnections.forEach(connection => {
			connection.send('d') // player disconnected message
			module.exports.removeConnection(connection)
		})

		// lobbies.remove(lobby)
		const index = lobbies.indexOf(lobby);
		if (index > -1) {
			lobbies.splice(index, 1);
		}
	}
}

exports.closeLobbyByConnection = (connection) => {
	module.exports.closeLobby(module.exports.getLobbyByConnection(connection))
}




module.exports.sendMessageToLobbyFromConnection = (socket, messageString) => {
	const connections = module.exports.getOtherPlayersByConnection(socket)
	if (connections == null) {
		console.log('sending fail not in lobby')
		socket.send('nNot in lobby') // fail message
		return
	}
	if (connections.length == 0) {
		console.log('sending fail empty lobby')
		socket.send('nEmpty lobby') // fail message
		return
	}

	console.log('forwarding to ' + connections.length + ' connections')
	connections.forEach(connection => {
		connection.send(messageString)
	})
	console.log('sending success message')
	socket.send('y') // success message
	return
}