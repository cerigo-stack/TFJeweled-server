//debug shit
const ROUND_TIMER=10
const PAUSE_TIMER=5
const FORCE_CAROUSEL=false
const FORCE_SHOP=true

class game_participant
{
    constructor (lobby_participant)
    {
        this.gold = 0
        this.board = undefined
        this.cards = []
        this.sent_cards=[]
        this.score = 0
        this.hp = 100
        this.soc=lobby_participant.soc
        this.name=lobby_participant.name
        this.ended_special_round=false
        this.placement=undefined
    }
}

class game 
{
    initCards = () =>
    {
        const cards_json= require("./cards.json")
        for (let i=0;i<cards_json.length;i++)
        {
            for (let j=0;j<cards_json[i].in_pool;j++)
            {
                this.cards.push(cards_json[i].code+"?"+cards_json[i].price)
            }
        }
    }

    constructor (lobby)
    {
        this.damage_multiplier=1
        this.participants = []
        this.special_round = 'GOS'
        this.round=-1
        this.cards=[]
        this.initCards()
        for (const lobby_participant of lobby.players) {this.participants.push(new game_participant(lobby_participant))}
    }

    draw_cards = (_participant) =>
    {
        let msg=""
        for (let i=0;i<3;i++)
        {
            let card_chosen=Math.floor(Math.random() * this.cards.length)
            this.participants[_participant].sent_cards.push(this.cards[card_chosen])
            msg+=this.cards[card_chosen]+"/"
            this.cards.splice(card_chosen,1)
        }
        msg=msg.slice(0,-1)
        return msg 
    }
 
    discard_cards = (_participant) =>
    {
        for (let i=this.participants[_participant].sent_cards.length-1;i>-1;i--)
        {
            this.cards.push( this.participants[_participant].sent_cards[i])
            this.participants[_participant].sent_cards.pop()
        }
    }

    card_purchase = (_participant,card) =>
    {
        this.participants[_participant].cards.push(card)
        this.participants[_participant].gold-=card.split('?')[1]
        this.participants[_participant].sent_cards.splice( this.participants[_participant].sent_cards.indexOf(card) ,1)
    }

    card_sale = (_participant,card) =>
    {
        this.participants[_participant].cards.splice(  this.participants[_participant].cards.indexOf(card),1)
        this.cards.push(card)
    }
    
    nextRound = () => //changes round and returns the round type
    {
        this.round=++this.round%4
        switch (this.round)
        {
            case 3:  //special round and set next special round
            this.damage_multiplier++
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

module.exports.getGamesParticipants = (_game,_participant) => //returns game or participant,depends on if _participant is provided
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

const customQuickSort = (arr) => {
    if (arr.length <= 1) {
      return arr;
    }
  
    let pivot = arr[0];
    let leftArr = [];
    let rightArr = [];
  
    for (let i = 1; i < arr.length; i++) {
      if (arr[i][1] < pivot[1]) {
        leftArr.push(arr[i]);
      } else {
        rightArr.push(arr[i]);
      }
    }
  
    return [...customQuickSort(leftArr), pivot, ...customQuickSort(rightArr)];
};
  
handleCombatRound = (game) => //can probably be optimized a lot - handles placements, hp loss and income
{
    let score_array = []
    for (const _part in  game.participants)
    {
        game.participants[_part].gold+=Math.floor(game.participants[_part].gold*0.1) //interest
        game.participants[_part].gold+=6 * (game.round>=0) //every round income = 5 + 1 if not taking damage (here 6 -1 for taking damage)
        score_array.push([_part,game.participants[_part].score])
    }
    score_array = customQuickSort(score_array)
    score_array.reverse()
    game.participants[score_array[0][0]].placement=1
    let last_damage=0
    for (let i=1;i<score_array.length;i++)
    {
        if(game.participants[score_array[i][0]].score == game.participants[score_array[i-1][0]].score)
        {
            game.participants[score_array[i][0]].placement = game.participants[score_array[i-1][0]].placement
            game.participants[score_array[i][0]].hp-=last_damage
            continue
        }
        game.participants[score_array[i][0]].placement=i+1
        if (game.participants[score_array[i][0]].placement > score_array.length>>1)
        {
            game.participants[score_array[i][0]].hp-=last_damage+game.damage_multiplier
            game.participants[score_array[i][0]].gold-=1
        }
    }

}

module.exports.eorState = async (_game,nxr) => //eor = end of round (THIS IS REALLY UGLY AND WILL NEED TO BE REWRITTEN)
{
    let msg=""
    if (nxr) //AFTER SPECIAL ROUND
    {
        msg+="NXR|"
        for (const _participant in games[_game].participants)
        {
            games[_game].discard_cards(_participant)
            msg+= games[_game].participants[_participant].gold+"?"
            for (card of games[_game].participants[_participant].cards)
            {
                msg+=card.split("?")[0]+"?"
            }
            msg=msg.slice(0,-1)
            msg+="/"
            games[_game].participants[_participant].ended_special_round=false
        }
    }
    else //AFTER NORMAL ROUND
    {
        msg+="EOR|"
        handleCombatRound(games[_game])
        for (const part of games[_game].participants)
        {
            msg+=part.board+"?"+part.gold+"?"+part.hp+"?"+part.placement+"?"+part.score+"/"
            part.board=undefined
        }
    }
    msg=msg.slice(0,-1)
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

module.exports.sendCards = (_game,_participant) =>
{
    let cards_message=games[_game].draw_cards(_participant)
    games[_game].participants[_participant].soc.send("CRD|"+cards_message)
}
