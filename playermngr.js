playersOnline = []

class player
{
    constructor(name,soc)
    {
        this.soc=soc
        this.name=name
        this.ready = false
    }
}

module.exports.registerPlayer = (name,soc) =>
{
    playersOnline.push(new player(name,soc))
}

module.exports.unregisterPlayer = (soc) =>
{
    let player_index=playersOnline.findIndex( (iterated) => iterated.soc == soc)
    playersOnline.splice(player_index,1)
}

module.exports.getPlayer = (soc) =>
{
    return playersOnline.find((player) => player.soc==soc)
}