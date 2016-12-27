function isEmpty(str) {
    return (!str || !str.length);
}

function getCharacter(graphicId) {
    var graphic = getObj("graphic", graphicId)
    var characterId = graphic.get("represents")

    if (!isEmpty(characterId)) {
        var character = getObj("character", characterId)
        return character
    }
        
    return null;
}

function getInit(character, init, graphicid, manual) {
    var init = String(init)
    var dice = "1d20"
    
    if (manual) {
        dice = "1d0 +" + manual + "[manual_roll]"
    }
    
    var roll = "{{check=[[(" + dice + " + " + init + "[init] + \
    [[{(0.01 * " + init + "),0}kh1]][tie-breaker])]]}}"
    var template = "&{template:pf_generic} \
    {{character_name=" + character.get("name") + "}} \
    {{character_id=" + character.id + "}} \
    {graphic_id=" + graphicid + "} \
    {{subtitle}} {{name=Initiative}} "
    
    return template + roll
}

function getTurnOrder() {
    var turnorder = Campaign().get("turnorder")
    
    if(turnorder == "") {
        return []
    }
    
    return JSON.parse(turnorder)
}

function createTurn(graphicid, pr) {
    return {
        id: graphicid,
        pr: pr,
        custom: ""
    }
}

function addTurn(turnorder, turn) {
    var foundturn = turnorder.find(function (turnentry) {
        return turnentry.id === turn.id
    })
    
    if(!foundturn) {
        turnorder.push(turn)
        turnorder.sort(function(a, b){
            return b.pr - a.pr;
        })

        turnorder = JSON.stringify(turnorder)
        Campaign().set("turnorder", turnorder);
    }
}

function updateTracker(msg) {
    if(msg.type == "general" && msg.content.indexOf("{{name=Initiative}}") !== -1 && msg.playerid === "API") {
        var content = msg.content
        var graphicid = content.match(/{graphic_id=(.*?)}/)[1]
        var rolltotal = msg.inlinerolls[1].results.total
        var turnorder = getTurnOrder()
        var turn = createTurn(graphicid, rolltotal)
        addTurn(turnorder, turn)
    }
}

function rollInit(msg) {
    var msgmatch = msg.content.match(/^!init(?:(?:\s)([.0-9]+))?$/)
    
    if(msg.type == "api" && msgmatch) {
        var objects = msg.selected
        for (index in objects) {
            var object = objects[index]
            
            if (object._type === "graphic") {
                graphicid = object._id
                var character = getCharacter(graphicid)
                var manual = msgmatch[1]
                
                if (character) {
                    var init = getAttrByName(character.id, "init")
                    sendChat(msg.who, getInit(character, init, graphicid, manual));
                }
            }
        }
    }
}

on("chat:message", rollInit);
on("chat:message", updateTracker);