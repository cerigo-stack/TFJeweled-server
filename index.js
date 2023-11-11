const WebSocketServer = require('ws')
const Lobbies = require('./lobbies')
const Playermngr = require('./playermngr')

//Lobbies.registerLobby("sexking's lobby","sexking")


const wss = new WebSocketServer.Server({ port: 6336}, () =>
{
    console.log("Server listening in on port 6336")
})

wss.on('connection', (ws) => 
{
    ws.on('error', console.error);
    ws.on('message', (data) => 
    {
        const request = data.toString().split("|")
        switch (request[0])
        {
            case 'LBS': // get lobbies - request == "LBS|playername"
                ws.send(Lobbies.generateLobbyList()) //LBS|lobbyname?lobbyhost/lobbyname1?lobbyhost1/...
            break
            
            case 'REG': //register player - request == "REG|playername"
                Playermngr.registerPlayer(request[1],ws)
            break

            case 'LBJ': // lobbies join - request == "LBJ|servername"    we need to add them to the players array of the lobby and send to everyone on that lobby the player list
                ws.send("LBJ|"+Lobbies.joinLobby(  Playermngr.getPlayer(ws)  ,request[1])) //LBJ|TRUE or LBJ|FALSE
            break

            case 'LBH': // lobbies host - request == "LBH"
                Lobbies.registerLobby(Playermngr.getPlayer(ws).name+"'s lobby",Playermngr.getPlayer(ws))
            break

            case 'LBD': // lobbies disconnect - request == "LBD"
                Lobbies.disconnectPlayer(Playermngr.getPlayer(ws))
            break

            case 'ULP': // update lobby participants
                let {lobby_index} = Lobbies.findPlayerLobby(  Playermngr.getPlayer(ws)  )
                let lobby_participants = Lobbies.getLobbyPlayers(lobby_index)
                let msg=lobby_participants.join("/")+"/"
                for (const player of Lobbies.getLobbyList()[lobby_index].players)
                {
                    let edited_message = msg.replace(player.name+"/","")
                    edited_message = edited_message.substring(0,edited_message.length-1)
                    player.soc.send("ULP|"+edited_message)                                                                     ///ULP|name1/name2/name3 name1 is always host , the host ignores this on gml var global.IAMHOST
                }
            break
        }
    })
    ws.on('close', () => 
    {
        Lobbies.disconnectPlayer(Playermngr.getPlayer(ws))
        Playermngr.unregisterPlayer(ws)
    })
})
