const WebSocketServer = require('ws')
const Lobbies = require('./lobbies')
const Playermngr = require('./playermngr')

//Lobbies.registerLobby("sexking's lobby","sexking")
var forEveryoneInLobby = (lobby_index,action) =>
{
    for (const player of Lobbies.getLobbyList()[lobby_index].players)
    {
        action(player)
    }
}

var sendULP = (lobby_index) =>                                                                                      // update lobby participants
{
    let lobby_participants = Lobbies.getLobbyPlayersInfo(lobby_index)
    let msg=lobby_participants.join("/")+"/"
    forEveryoneInLobby(lobby_index, (player) => {
        let edited_message = msg.replace(player.name+"?"+player.ready+"/","")
        edited_message = "ULP|"+edited_message                                     ///ULP|name1?ready1/name2?ready2/name3?ready3 name1 is always host , the host ignores this on gml var global.IAMHOST
        edited_message=edited_message.slice(0,-1)
        player.soc.send(edited_message) 
    })
}

var disconnectPlayerByWS = (ws) =>
{
    let {lobby_index} = Lobbies.findPlayerLobby(  Playermngr.getPlayer(ws)  )
    if (lobby_index == -1) return //player was not in lobby
    let was_host = Lobbies.disconnectPlayer(Playermngr.getPlayer(ws))
    if(was_host)
    {
        forEveryoneInLobby(lobby_index, (player) => {
            player.soc.send("LDH")                                                  ///Lobby disconnect (due to) host
        })                                                                   
        Lobbies.unregisterLobby(lobby_index)
        return
    }
    sendULP(lobby_index)
}

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
            {
                disconnectPlayerByWS(ws)
            }
            break

            case 'ULP': // update lobby participants
            {
                let {lobby_index} = Lobbies.findPlayerLobby(  Playermngr.getPlayer(ws)  )
                sendULP(lobby_index)
            }
            break

            case 'RDY': //lobby ready
            {
                Playermngr.getPlayer(ws).ready = !Playermngr.getPlayer(ws).ready
                let {lobby_index} = Lobbies.findPlayerLobby(  Playermngr.getPlayer(ws)  )
                sendULP(lobby_index)
            }
            



        }
    })
    ws.on('close', () => 
    {
        disconnectPlayerByWS(ws)
        Playermngr.unregisterPlayer(ws)
    })
})


