const WebSocketServer = require('ws')
const Lobbies = require('./lobbies')
const Game = require("./game")

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
            //LOBBY RELATED REQUESTS

            case 'LBS': // get lobbies - request == "LBS"
                ws.send(Lobbies.generateLobbyList()) //LBS|lobbyname?lobbyhost/lobbyname1?lobbyhost1/...
            break
            
            case 'REG': //register player - request == "REG|playername"
                Lobbies.registerPlayer(request[1],ws)
            break

            case 'LBJ': // lobbies join - request == "LBJ|servername"
                ws.send("LBJ|"+Lobbies.joinLobby(  Lobbies.getPlayer(ws)  ,request[1])) //LBJ|TRUE or LBJ|FALSE
            break

            case 'LBH': // lobbies host - request == "LBH"
                {
                    let player = Lobbies.getPlayer(ws)
                    Lobbies.registerLobby(player.name+"'s lobby",player)
                }
            break

            case 'LBD': // lobbies disconnect - request == "LBD"
                Lobbies.disconnectPlayer(ws)
            break

            case 'ULP': // update lobby participants - request == "ULP"
            {
                let {_lobby,_player} = Lobbies.findLobbyAndPlayer(ws)
                Lobbies.sendULP(Lobbies.getLobbiesPlayers(_lobby))
            }
            break

            case 'RDY': //ready (player is ready) - request == "RDY"
            {
                let {_lobby,_player} = Lobbies.findLobbyAndPlayer(ws)
                Lobbies.getLobbiesPlayers(_lobby,_player).ready = !Lobbies.getLobbiesPlayers(_lobby,_player).ready
                Lobbies.sendULP(Lobbies.getLobbiesPlayers(_lobby))
            }
            break

            case 'SRT': //start (the game) - request == "SRT"
            {
                let {_lobby,_player} = Lobbies.findLobbyAndPlayer(ws)
                for (player of Lobbies.getLobbiesPlayers(_lobby).players)
                {
                    if (player.soc == ws ) {continue;} // for the host
                    if (player.ready == false ) {return;} 
                }
                Game.createGame(Lobbies.getLobbiesPlayers(_lobby))
                for (player of Lobbies.getLobbiesPlayers(_lobby).players) player.soc.send("SRT")   //SRT (moves to game room)
                Lobbies.unregisterLobby(_lobby)     
            }   
            break

            //IN-GAME REQUESTS

            case "FPO": //final participant order
                {
                    let  {_game,_participant} = Game.findGameAndParticipant(ws)
                    Game.getGamesParticipants(_game,_participant).board=request[1]
                    let msg="FPO|"+_participant+"/"
                    for (const participant of Game.getGamesParticipants(_game).participants)
                    {
                        msg+=participant.name+"/"
                    }
                    msg=msg.slice(0,-1)
                    ws.send(msg)  // FPO|INDX/participant0name/participant1name where INDX = who the soc is
                }
            break

            case "CBS":  //current board state - request == "CBS|board?score" - only after combat rounds
                {
                    let  {_game,_participant} = Game.findGameAndParticipant(ws)
                    const req_params = request[1].split('?')
                    Game.getGamesParticipants(_game,_participant).board=req_params[0]
                    Game.getGamesParticipants(_game,_participant).score=req_params[1]
                    for (const participant of Game.getGamesParticipants(_game).participants)
                    {
                        if(participant.board==undefined) return
                    }
                    Game.eorState(_game,false)
                }
            break

            case "NXR": //debug continue without board update - placeholder for shop and carousel
                {
                    let  {_game,_participant} = Game.findGameAndParticipant(ws)
                    Game.getGamesParticipants(_game,_participant).ended_special_round=true
                    for (const participant of Game.getGamesParticipants(_game).participants)
                    {
                        if(!participant.ended_special_round) return
                    }
                    Game.eorState(_game,true)
                }
            break

            case "CRD": //cards
                {
                    let  {_game,_participant} = Game.findGameAndParticipant(ws)
                    Game.sendCards(_game,_participant)
                }
            break

            case "BUY": //player buys a card - request == BUY|cardcode
                {
                    let  {_game,_participant} = Game.findGameAndParticipant(ws)
                    Game.getGamesParticipants(_game).card_purchase(_participant,request[1])
                }
            break

            case "RRL": //reroll, costs 2 gold
                {
                    let  {_game,_participant} = Game.findGameAndParticipant(ws)
                    Game.getGamesParticipants(_game,_participant).gold-=2
                    Game.getGamesParticipants(_game).discard_cards(_participant)
                    Game.sendCards(_game,_participant)
                }
            break
        }
    })
    ws.on('close', () => 
    {
        Lobbies.disconnectPlayer(ws)
        Lobbies.unregisterPlayer(ws)
    })
})


