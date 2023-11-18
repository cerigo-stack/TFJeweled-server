class game_participant
{
    constructor (lobby_participant)
    {
        this.gold = 0
        this.board = ""
        this.cards = []
        this.score = 0
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
        this.special_round = 'GOS'
        this.round=0
        for (const lobby_participant of lobby.players) {this.participants.push(new game_participant(lobby_participant))}
    }

    nextRound = () => //changes round and returns the round type
    {
        this.round=++this.round%4
        switch (this.round)
        {
            case 0:  //special round and set next special round
                return this.special_round=Math.random()>0.66? "GOS|C": "GOS|S"
            default:
                return 'GOC' //combat round
        }
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

sendTimedMessage = (participant,seconds,message) =>
{
    return new Promise ((resolve) =>
    {
        let intID = setInterval(() => 
        {
            if (seconds == 0)
            {  
                clearInterval(intID)
                participant.soc.send(message)
                resolve()
                return
            } 
            participant.soc.send("TMM|"+seconds)
            seconds--
        }, 1000)
    })
    
}

module.exports.eorState = async (_game) => //eor = end of round (THIS IS REALLY UGLY AND WILL NEED TO BE REWRITTEN)
{
    let msg = "EOR|"
    for (const part of games[_game].participants)
    {
        msg+=part.board+"?"+part.gold+"?"+part.hp+"/"
        part.board=undefined
    }
    msg=msg.slice(0,-1)
    let round_after_msg = games[_game].nextRound()
    for (const part of games[_game].participants)
    {
        part.soc.send(msg)
        sendTimedMessage (part,10,round_after_msg).then(() =>
        {
            sendTimedMessage(part,30,"STP")        
        })
    }
}


