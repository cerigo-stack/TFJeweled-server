class lobby 
{
    constructor(name,host)
    {
        this.name=name
        this.players = []
        this.addPlayer(host)
    }

    addPlayer = (player) =>
    {
        if (this.players.length>8) {return false}
        this.players.push(player)
        return true
    }

}

class player
{
    constructor(name,soc)
    {
        this.soc=soc
        this.name=name
        this.ready = false
    }
}

lobby_list = []
playersOnline = []

module.exports.generateLobbyList = () =>      //LBS|lobbyname?lobbyhost/lobbyname1?lobbyhost1/...
{
    msg="LBS|"
    for (const lob of lobby_list)
    {
        msg+=lob.name+"?"+lob.players[0].name+"/"
    }
    msg=msg.slice(0,-1) //removes last /
    return msg
}

module.exports.registerPlayer = (name,soc) =>
{
    playersOnline.push(new player(name,soc))
}

module.exports.getPlayer = (soc) => //for players not in a lobby
{
    return playersOnline.find((player) => player.soc==soc)
}

module.exports.joinLobby = (player,req_lobby_name) =>
{
    for (let lobby of lobby_list)
    {
        if (lobby.name == req_lobby_name)
        {
            return lobby.addPlayer(player)
        }
    }
    return false
}


module.exports.findLobbyAndPlayer = (ws) =>  //for players inside a lobby
{
    for (const _lobby in lobby_list)
    {
        for(const _player in lobby_list[_lobby].players)
        {
            if (lobby_list[_lobby].players[_player].soc == ws) return {_lobby,_player}
        }
    }
    return {"_lobby": -1}
}

module.exports.getLobbiesPlayers = (_lobby,_player) =>
{
    if (_player == undefined) {return lobby_list[_lobby]}
    return lobby_list[_lobby].players[_player]
}

module.exports.registerLobby = (name,host) =>
{
    lobby_list.push(new lobby(name,host))
}

module.exports.sendULP = (lobby) =>                                                                                      // update lobby participants
{   
    let pl = lobby.players.map(function(a) {return a.name+"?"+a.ready;})
    let msg=pl.join("/")+"/"
    for (const player of lobby.players)
    {
        let edited_message = msg.replace(player.name+"?"+player.ready+"/","")
        edited_message = "ULP|"+edited_message                                     ///ULP|name1?ready1/name2?ready2/name3?ready3 name1 is always host , the host ignores this on gml var global.IAMHOST
        edited_message=edited_message.slice(0,-1)
        player.soc.send(edited_message) 
    }
}

module.exports.unregisterLobby = (lobby_index) =>
{
    lobby_list.splice(lobby_index,1)
}

module.exports.unregisterPlayer = (soc) =>
{
    let player_index=playersOnline.findIndex( (iterated) => iterated.soc == soc)
    playersOnline.splice(player_index,1)
}

module.exports.disconnectPlayer = (ws) =>
{
    let {_lobby,_player} = module.exports.findLobbyAndPlayer(ws)
    if (_lobby == -1) return //above found nothing
    module.exports.getLobbiesPlayers(_lobby,_player).ready = false
    module.exports.getLobbiesPlayers(_lobby).players.splice(_player,1)
    if (_player==0) //was host
    { 
        for (player of module.exports.getLobbiesPlayers(_lobby).players)
        {
            player.ready=false
            player.soc.send("LDH")
        } 
        module.exports.unregisterLobby(_lobby)
        return
    }
    module.exports.sendULP(module.exports.getLobbiesPlayers(_lobby))
}