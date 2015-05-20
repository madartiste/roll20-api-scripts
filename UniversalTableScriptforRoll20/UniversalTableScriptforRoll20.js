// Rolls should be structured as "!ut <rankname> <column shift>"
// Make sure there are no spaces in the rankname.  Ex: Shift 0 becomes Shift0 or Shift-0
// Do not use a + sign in front of positive column shifts.  Ex +3 column shift should just be 3
// Roll example: !ut Incredible 1
// Would be a +1 column shift roll for an Incredible rank (thus rolling on the Amazing column)
// Roll example: !ut Remarkable
// Would be a no column shift roll for a Remarkable rank (thus rolling on the Remarkable column)
// Roll example: !ut Unearthly -3
// Would be a -3 column shift roll for Unearthly rank (thus rolling on the Incredible column)
// Roll example: !ut Incredible CA
// Would be a no column shift roll for an Incredible rank Catching attempt
// Roll example !ut Excellent 1 SH
// would be a +1 column shift roll for an Excellent rank Shooting attempt

//Use !help for reminders on how to use the script

//Use !example for examples of how to use the script

// Use !attack to print out the list of abbreviations for attack types

on("chat:message", function(msg) {
/* PRINT ATTACK TYPE ABBREVIATIONS TO CHAT WINDOW */
    if(msg.type == "api" && msg.content.indexOf("!attack") !== -1) {
        sendChat(msg.who, "Abbreviations for types of attcks:\nBA: Blunt Attacks, EA: Edged Attacks, SH: Shooting\nTE: Throwing Edged,TB: Throwing Blunt,EN: Energy\nFO: Force, GP: Grappling, GB: Grabbing\nES: Escaping, CH: Charging, DO: Dodging\nEV: Evading, BL: Blocking, CA: Catching\nStun: Stun?, Slam: Slam?, Kill: Kill?");
    }
    
/* PRINT REMINDERS TO CHAT WINDOW */
    if(msg.type == "api" && msg.content.indexOf("!help") !== -1) {
        sendChat(msg.who, "Use the format <b>!ut [rank name] [column shift] [attack type]<b>\nDo not use a + in front of positive column shifts, if there is no column shift you can either use a 0 or leave it out\nUse <b>!example</b> to get examples on how to use the script\nUse <b>!attack</b> for a listing of attack type abbreviation.");        
    }
    
/* PRINT EXAMPLES TO CHAT WINDOW */
    if(msg.type == "api" && msg.content.indexOf("!example") !== -1) {
        sendChat(msg.who, "<b>!ut Monstrous</b> (Monstrous rank roll)\n<b>!ut Incredible 2 CA</b> (Incredible rank with +2 column shift on a Catching attempt)\n<b>!ut Remarkable -2</b> (Remarkable rank with -2 column shift)\n<b>!ut Excellent BA</b> (Excellent rank Blunt Attack)");
    }
    
/*UNIVERSAL TABLE SCRIPT*/
    if(msg.type == "api" && msg.content.indexOf("!ut ") !== -1) {
    
    /* OBJECTS AND LISTS */
        var rankColumnsObjects = [/*Shift 0*/{startgreen: 66, startyellow: 95, startred: 100}, /*Feeble*/{startgreen: 61, startyellow: 91, startred: 100}, /*Poor*/{startgreen: 56, startyellow: 86, startred: 100}, /*Typical*/{startgreen: 51, startyellow: 81, startred: 98}, /*Good*/{startgreen: 46, startyellow: 76, startred: 98}, /*Excellent*/{startgreen: 41, startyellow: 71, startred: 95}, /*Remarkable*/{startgreen: 36, startyellow: 66, startred: 95}, /*Incredible*/{startgreen: 31, startyellow: 61, startred: 91}, /*Amazing*/{startgreen: 26, startyellow: 56, startred: 91}, /*Monstrous*/{startgreen: 21, startyellow: 51, startred: 86}, /*Unearthly*/{startgreen: 16, startyellow: 46, startred: 86}, /*Shift X*/{startgreen: 11, startyellow: 41, startred: 81}, /*Shift Y*/{startgreen: 7, startyellow: 41, startred: 81}, /*Shift Z*/{startgreen: 4, startyellow: 36, startred: 76}, /*Class 1000*/{startgreen: 2, startyellow: 36, startred: 76}, /*Class 3000*/{startgreen: 2, startyellow: 31, startred: 71}, /*Class 5000*/{startgreen: 2, startyellow: 26, startred: 66}, /*Beyond*/{startgreen: 2, startyellow: 21, startred: 61}];

        var rankColumns = ["shift-0", "feeble", "poor", "typical", "good", "excellent", "remarkable", "incredible", "amazing", "monstrous", "unearthly", "shift-x", "shift-y", "shift-z", "class1000", "class3000", "class5000", "beyond"]

        var attackTypeResults = [/*White*/{ba: "Miss", ea: "Miss", sh: "Miss", te: "Miss", tb: "Miss", en: "Miss", fo: "Miss", gp: "Miss", gb: "Miss", es: "Miss", ch: "Miss", do: "None", ev: "Autohit", bl:  "-6 CS", ca: "Autohit", stun: "1-10", slam: "Gr. Slam", kill: "En. Loss"}, /*Green*/{ba: "Hit", ea: "Hit", sh: "Hit", te: "Hit", tb: "Hit", en: "Hit", fo: "Hit", gp: "Miss", gb: "Take", es: "Miss", ch: "Hit", do: "-2 CS", ev: "Evasion", bl: "-4 CS", ca: "Miss", stun: "1", slam: "1 area", kill: "E/S"}, /*Yellow*/{ba: "Slam", ea: "Stun", sh: "Bullseye", te: "Stun", tb: "Hit", en: "Bullseye", fo: "Bullseye", gp: "partial", gb: "Grab", es: "Escape", ch: "Slam", do: "-4 CS", ev: "+1 CS", bl: "-2 CS", ca: "Damage", stun: "No", slam: "Stagger", kill: "No"}, /*Red*/{ba: "Stun", ea: "Kill", sh: "Kill", te: "Kill", tb: "Stun", en: "Kill", fo: "Stun", gp: "Hold", gb: "Break", es: "Reverse", ch: "Stun", do: "-6 CS", ev: "+2 CS", bl: "+1 CS", ca: "Catch", stun: "No", slam: "No", kill: "No"}];
        var attackTypes = {ba:"Blunt Attack",ea:"Edged Attack",sh:"Shooting",te:"Throwing Edged",tb:"Throwing Blunt",en:"Energy",fo:"Force",gp:"Grappling",gb:"Grabbing",es:"Escaping",ch:"Charging",do:"Dodging",ev:"Evading",bl:"blocking",ca:"Catching",stun:"Stun?",slam:"Slam?",kill:"Kill?"};
        
    /* SETUP DICE ROLL AND GET MESSAGE CONTENT */
        var rollResult = randomInteger(100);
        var msgContent = msg.content;
        var inputOrig = msg.content.split(" ");
        var input = msgContent.toLowerCase().split(" ");
    
    /* GET INITIAL RANK COLUMN */
         var rankCol;
    /* ALLOW FOR VARIATION IN RANK NAME INPUT */
        switch (input[1]) {
            case "shift0":
                rankCol = "shift-0";
                break;
            case "0":
                rankCol = "shift-0";
                break;
            case "fe":
                rankCol = "feeble";
                break;
            case "pr":
                rankCol = "poor";
                break;
            case "ty":
                rankCol = "typical";
                break;
            case "gd":
                rankCol = "good";
                break;
            case "ex":
                rankCol = "excellent";
                break;
            case "rm":
                rankCol = "remarkable";
                break;
            case "in":
                rankCol = "incredible";
                break;    
            case "am":
                rankCol = "amazing";
                break;    
            case "mn":
                rankCol = "monstrous";
                break;    
            case "un":
                rankCol = "unearthly";
                break;               
            case "shiftx":
            case "x":
                rankCol = "shift-x";
                break;
            case "shifty":
            case "y":
                rankCol = "shift-y";
                break;
            case "shiftz":
            case "z":
                rankCol = "shift-z";
                break;
            case "cl1000":
            case "1000":
                rankCol = "class1000";
                break;
            case "cl3000":
            case "3000":
                rankCol = "class3000";
                break;
            case "cl5000":
            case "5000":
                rankCol = "class5000";
                break;
            case "b":
                rankCol = "beyond";
                break;
            default:
                rankCol = input[1];            
        }
    
    /* GET INDEX OF INITIAL RANK */ 
        var rankIndex = rankColumns.indexOf(rankCol);
        
    /* CHECK THAT RANK NAME IS CORRECT */
        if (rankIndex < 0) {
            sendChat(msg.who, "Rank not found. Please try again.");   
        } else {
        /* GET COLUMN SHIFT AND SET ROLL COLUMN */    
            var colShift = parseInt(input[2]);
            var rollColumnIndex;
        
            if(_.isNaN(colShift)) {
                rollColumnIndex = rankIndex;
            } else {
                if (rankIndex + colShift < 0) {
                    rollColumnIndex = 0;            
                } else if (rankIndex + colShift > 17) {
                    rollColumnIndex = 17;
                }
                else {
                    rollColumnIndex = rankIndex + colShift;
                }
            };
        
            var rollColumn = rankColumnsObjects[rollColumnIndex];
        
        /* DETERMINE IF THERE IS AN ATTACK TYPE AND RESULT IF THERE IS */   
            var attackTypeResult;
            var attackTypeString;
            var attackTypeRoll;
            var attackTypeDefault;
            var attackTypeMarvel;
        
            var attack = function(index) {            
                if (_.isNaN(colShift)) {
                    attackTypeResult = attackTypeResults[index][input[2]] || "";
                    attackTypeRoll = attackTypes[input[2]] || "";
                } else {
                    attackTypeResult = attackTypeResults[index][input[3]] || "";
                    attackTypeRoll = attackTypes[input[3]] || "";
                }
                
                if (attackTypeRoll) {
                    attackTypeDefault = "{{Type=" + attackTypeRoll + "}}";
                    attackTypeMarvel = "{{attacktype=" + attackTypeRoll + "}}";
                }
                
                if (attackTypeResult == "") {
                    attackTypeString = ".";
                } else {attackTypeString = " for a " + attackTypeResult + "."};
            };
        
        /* SEARCH FOR OPTIONAL ROLL TYPE AND ID AND ASSIGN TO VARIABLES */
            var rollOptionSplit = msgContent.split(/\s+--/);
            var rollType;            
            var cid;
        
            if (rollOptionSplit.length > 1) {
                _.each(rollOptionSplit,function(string){
                    if (string.toLowerCase().indexOf("roll:") > -1) {
                        rollType = string.replace(/roll:/i,"");
                    }
                    if (string.toLowerCase().indexOf("id:") > -1) {
                        cid = string.replace(/id:/i,"");
                    }
                });
            }
            
            var rollTypeMarvel;
            var rollTypeDefault;
        
            if (rollType !== undefined) {
                rollTypeMarvel = "{{rolltype=" + rollType + "}}";
                rollTypeDefault = "<br />" + rollType;
            }
            
            /* DETERMINE IF THERE IS A SPECIFIC CHARACTER TIED TO ROLL AND GET NAME FROM ID */
            var who;
            var character;
            var charArray;
            var charName;
            
            if (cid !== undefined) {
                character = getObj("character", cid);
                if (character !== undefined) {
                    charName = character.get("name");
                }
            }
        
            if (charName == undefined) {
                who = msg.who;
            } else {
                who = charName;
            } 
    /* GATHER RESULTS, FORMAT, AND SEND TO CHAT */    
            if (rollResult < rollColumn.startgreen) {
                attack(0);
            /****USE DEFAULT ROLL TEMPLATE****/
                sendChat (msg.who, "&{template:default} {{name=" +  who + rollTypeDefault + "}} " + attackTypeDefault + " {{Column=" + rankColumns[rollColumnIndex].toUpperCase() + "}} {{Roll=" + rollResult + "}}{{Result=<span style=\"padding:2px 5px; background-color:white;font-weight:bold;\">WHITE</span>" + attackTypeString + "}}");
            /****USE NO ROLL TEMPLATE****/
                //sendChat(msg.who, rankColumns[rollColumnIndex].toUpperCase() + " column: " + rollResult + " is a <span style=\"padding:2px 5px; background-color:white;font-weight:bold;\">WHITE</span> result" + attackTypeString);
            /****USE MARVEL THEMED ROLL TEMPATE FROM CHARACTER SHEET****/
                //sendChat (msg.who, "&{template:marvel} {{rollname=" + who + "}} " + attackTypeMarvel + " " + rollTypeMarvel + " {{rollcolumn=" + rankColumns[rollColumnIndex].toUpperCase() + "}} {{rollresult=" + rollResult + "}}{{colorresult=<span style=\"padding:2px 5px; background-color:white;font-weight:bold;\">WHITE</span>" + attackTypeString + "}}");   
             
            } else if (rollResult >= rollColumn.startgreen && rollResult < rollColumn.startyellow) {
                attack(1);
            /****USE DEFAULT ROLL TEMPLATE****/
                sendChat (msg.who, "&{template:default} {{name=" + who + rollTypeDefault +  "}} " + attackTypeDefault + " {{Column=" + rankColumns[rollColumnIndex].toUpperCase() + "}} {{Roll=" + rollResult + "}}{{Result=<span style=\"padding:2px 5px; color: white;background-color:green;font-weight:bold;\">GREEN</span>" + attackTypeString + "}}");
            /****USE NO ROLL TEMPLATE****/
                //sendChat(msg.who, rankColumns[rollColumnIndex].toUpperCase() + " column: " + rollResult + " is a <span style=\"padding:2px 5px; color: white;background-color:green;font-weight:bold;\">GREEN</span> result" + attackTypeString);
            /****USE MARVEL THEMED ROLL TEMPATE FROM CHARACTER SHEET****/
                //sendChat (msg.who, "&{template:marvel} {{rollname=" + who + "}} " + attackTypeMarvel + " " + rollTypeMarvel + " {{rollcolumn=" + rankColumns[rollColumnIndex].toUpperCase() + "}} {{rollresult=" + rollResult + "}}{{colorresult=<span style=\"padding:2px 5px; color: white;background-color:green;font-weight:bold;\">GREEN</span>" + attackTypeString + "}}");            
         
            } else if (rollResult >= rollColumn.startyellow && rollResult < rollColumn.startred) {
                attack(2);
            /****USE DEFAULT ROLL TEMPLATE****/
                sendChat (msg.who, "&{template:default} {{name=" + who + rollTypeDefault + "}} " + attackTypeDefault + " {{Column=" + rankColumns[rollColumnIndex].toUpperCase() + "}} {{Roll=" + rollResult + "}}{{Result=<span style=\"padding:2px 5px; background-color:yellow;font-weight:bold;\">YELLOW</span>" + attackTypeString + "}}");
            /****USE NO ROLL TEMPLATE****/
                //sendChat(msg.who, rankColumns[rollColumnIndex].toUpperCase() + " column: " + rollResult + " is a <span style=\"padding:2px 5px; background-color:yellow;font-weight:bold;\">YELLOW</span> result" + attackTypeString);
            /****USE MARVEL THEMED ROLL TEMPATE FROM CHARACTER SHEET****/
                //sendChat (msg.who, "&{template:marvel} {{rollname=" + who + "}} " + attackTypeMarvel + " " + rollTypeMarvel + " {{rollcolumn=" + rankColumns[rollColumnIndex].toUpperCase() + "}} {{rollresult=" + rollResult + "}}{{colorresult=<span style=\"padding:2px 5px; background-color:yellow;font-weight:bold;\">YELLOW</span>" + attackTypeString + "}}");
            
            } else if (rollResult >= rollColumn.startred) {
                attack(3);
            /****USE DEFAULT ROLL TEMPLATE****/
                sendChat (msg.who, "&{template:default} {{name=" + who + rollTypeDefault +  "}} " + attackTypeDefault + " {{Column=" + rankColumns[rollColumnIndex].toUpperCase() + "}} {{Roll=" + rollResult + "}}{{Result=<span style=\"padding:2px 5px; color: white;background-color:red;font-weight:bold;\">RED</span>" + attackTypeString + "}}");
            /****USE NO ROLL TEMPLATE****/
                //sendChat(msg.who, rankColumns[rollColumnIndex].toUpperCase() + " column: " + rollResult + " is a <span style=\"padding:2px 5px; color: white;background-color:red;font-weight:bold;\">RED</span> result" + attackTypeString);
            /****USE MARVEL THEMED ROLL TEMPATE FROM CHARACTER SHEET****/
                //sendChat (msg.who, "&{template:marvel} {{rollname=" + who + "}} " + attackTypeMarvel + " " + rollTypeMarvel + " {{rollcolumn=" + rankColumns[rollColumnIndex].toUpperCase() + "}} {{rollresult=" + rollResult + "}}{{colorresult=<span style=\"padding:2px 5px; color: white;background-color:red;font-weight:bold;\">RED</span>" + attackTypeString + "}}");            
            };  
        };
    }
});
