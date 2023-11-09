const WebSocketServer = require('ws')
const Lobbies = require('./lobbies')
Lobbies.registerLobby("sexking's lobby","sexking")
Lobbies.registerLobby("deadman's lobby","deadman")
Lobbies.registerLobby("sexking's lobby","sexking")
Lobbies.registerLobby("deadman's lobby","deadman")
Lobbies.registerLobby("sexking's lobby","sexking")
Lobbies.registerLobby("deadman's lobby","deadman")

const wss = new WebSocketServer.Server({ port: 6336}, () =>
{
    console.log("Server listening in on port 6336")
})


wss.on('connection', (ws) => 
{
    ws.on('error', console.error);
    ws.on('message', (data) => 
    {
        switch (data.toString())
        {
            case 'REQ_LOBBIES':
                ws.send(Lobbies.generate_lobby_message())
        }
    })
})