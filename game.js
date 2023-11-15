class game_participant
{
    constructor (lobby_participant)
    {
        this.gold = 0
        this.board = ""
        this.cards = []
        this.hp = 100
        this.soc=lobby_participant.soc
        this.name=lobby_participant.name
    }
}

class game 
{
    constructor (lobby)
    {
        this.participants = []
        for (const lobby_participant of lobby.players) {this.participants.push(new game_participant(lobby_participant))}
    }
}

games = []

module.exports.createGame = (lobby) =>
{
    games.push(new game(lobby))
}

module.exports.findGameAndParticipant = (ws) =>
{
    for (const _game in games)
    {
        for(const _participant in games[_game].participants)
        {
            if (games[_game].participants[_participant].soc == ws) return {_game,_participant}
        }
    }
}

module.exports.getGamesParticipants = (_game,_participant) =>
{
    if (_participant == undefined) {return games[_game]}
    return games[_game].participants[_participant]
}

module.exports.eorState = (_game) => //eor = end of round
{
    let msg = "EOR|"
    for (const part of games[_game].participants)
    {
        msg+=part.board+"?"+part.gold+"?"+part.hp+"/"
    }
    msg=msg.slice(0,-1)
    return msg
}


