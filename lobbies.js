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
lobby_list = []

module.exports.getLobbyList = () =>
{
    return lobby_list
}

module.exports.getLobbyPlayers = (lobby_index) =>
{
    return lobby_list[lobby_index].players.map(function(a) {return a.name;})
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
}

module.exports.registerLobby = (name,host) =>
{
    lobby_list.push(new lobby(name,host))
}

module.exports.generateLobbyList = () =>      //LBS|lobbyname?lobbyhost/lobbyname1?lobbyhost1/...
{
    msg="LBS|"
    for (const lob of lobby_list)
    {
        msg+=lob.name+"?"+lob.players[0]+"/"
    }
    msg=msg.slice(0,-1) //removes last /
    return msg
}

module.exports.disconnectPlayer = (player) =>
{
    let {lobby_index,player_index} = module.exports.findPlayerLobby(player)
    if (player_index==0) 
    {
        unregisterLobby(lobby_index)
        return
    }
    lobby_list[lobby_index].players.splice(player_index,1)
}

unregisterLobby = (lobby_index) =>
{
    lobby_list.splice(lobby_index,1)
}

module.exports.findPlayerLobby = (player_given) =>
{
    for ( let lobby_index in lobby_list)
    {
        for (let player_index in  lobby_list[lobby_index].players)
        {
            if (lobby_list[lobby_index].players[player_index] == player_given)
            {
                return {lobby_index,player_index}
            }
        }
    }
}
