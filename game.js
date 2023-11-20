//debug shit
const ROUND_TIMER=10
const PAUSE_TIMER=5
const FORCE_CAROUSEL=true
const FORCE_SHOP=false

class game_participant
{
    constructor (lobby_participant)
    {
        this.gold = 0
        this.board = undefined
        this.cards = []
        this.score = 0
        this.hp = 100
        this.soc=lobby_participant.soc
        this.name=lobby_participant.name
        this.ended_special_round=false
    }
}

class game 
{
    constructor (lobby)
    {
        this.participants = []
        this.special_round = 'GOS'
        this.round=-1
        for (const lobby_participant of lobby.players) {this.participants.push(new game_participant(lobby_participant))}
    }

    nextRound = () => //changes round and returns the round type
    {
        this.round=++this.round%4
        switch (this.round)
        {
            case 3:  //special round and set next special round
            if (FORCE_CAROUSEL) return "GOS|C"
            if (FORCE_SHOP) return "GOS|S"
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

module.exports.eorState = async (_game,nxr) => //eor = end of round (THIS IS REALLY UGLY AND WILL NEED TO BE REWRITTEN)
{
    let msg=""
    if (nxr)
    {
        msg+="NXR"
        for (const part of games[_game].participants)
        {
            part.ended_special_round=false
        }
    }
    else
    {
        msg+="EOR|"
        for (const part of games[_game].participants)
        {
            msg+=part.board+"?"+part.gold+"?"+part.hp+"/"
            part.board=undefined
        }
        msg=msg.slice(0,-1)
    }
    let round_after_msg = games[_game].nextRound()
    for (const part of games[_game].participants)
    {
        part.soc.send(msg)
        sendTimedMessage (part,PAUSE_TIMER,round_after_msg).then(() =>
        {
            sendTimedMessage(part,ROUND_TIMER,"STP")        
        })
    }
}


