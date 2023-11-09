class lobby 
{
    constructor(name,host)
    {
        this.name=name
        this.host=host
    }

}
var lobby_list = []

module.exports.registerLobby = (name,host) =>
{
    lobby_list.push(new lobby(name,host))
}

module.exports.generate_lobby_message = () =>
{
    msg="LBS:"
    for (const lob of lobby_list)
    {
        msg+=lob.name+"?"+lob.host+"/"
    }
    msg=msg.slice(0,-1) //removes last /
    return msg
}

