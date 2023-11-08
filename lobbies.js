class lobby 
{
    constructor(name,host)
    {
        this.name=name
        this.host=host
    }

}
var lobby_list = []
module.exports.lobby_list = lobby_list


module.exports.registerLobby = (name,host) =>
{
    lobby_list.push(new lobby(name,host))
}

