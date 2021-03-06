// UNIVERAL TABLE DICE ROLLER FOR MARVEL SUPER HEROES RPG
// Last Update: May, 2015
// Version: 1.0

// Rolls should be structured as "!ut <rank name> <column shift> <attack type> --roll:<roll name> --id:<character id>"
// <rank name> must come first after the "!ut" API declaration
// <column shift> and <attack type> can come in any order, but must be after the <rank name> and before the options for <roll name> and <character id>
// Make sure there are no spaces in the <rank name>.  Ex: Shift 0 becomes Shift0 or Shift-0
// --roll:<roll name> can be used to add a title to your roll when using Roll Templates; optional but must come after <rank name>, <column shift>, and <attack type>
// --id:<character id> can be used to put the character's name into the Roll Template; optional but must come after <rank name>, <column shift>, and <attack type>

//Use !help for reminders on how to use the script

//Use !example for examples of how to use the script

// Use !attack to print out the list of abbreviations for attack types

// TO CHANGE ROLL TEMPLATE:
    // Scroll down to the bottom of the script
    // Find the section that says CHOOSE YOUR TEMPLATE HERE!
    // There are three options each with a header that states what that option is
    // Each option starts with 'template ='
    // Remove the // in front of the option you wish to use, the text should turn white
    // MAKE SURE TO PUT // in front of any options you DO NOT want to use, the text should turn gray
    // Hit the 'Save Script' button
    
"use strict";
            
on("chat:message", function(msg) {
    
/* HELPER MESSAGES */
    if(msg.type == "api" && (msg.content.indexOf("!attack") !== -1 || msg.content.indexOf("!help") !== -1 || msg.content.indexOf("!example") !== -1)) {
        var lines = [];
        var helpMessage = "";
    
        var helpTable = "<table width='100%' cellpadding='3px' style='border:1px gray solid;background-color:white;'>";
        helpTable += "<tr><th style='background-color:black;color:#fff;padding:5px;'>";
        var helpHeader;
        var helpHeaderClose = "</th></tr>";
        var helpTableRowEven = "<tr><td>";
        var helpTableRowOdd = "<tr style='background-color:#eee;'><td>";
        var helpTableRowClose = "</td></tr>";
        var helpTableClose = "</table>";         

        var makeHelpMessage = function (rows) {
            helpMessage += helpTable + helpHeader + helpHeaderClose;
            for (var i = 0; i < rows; i++) {
                if (i % 2 === 0) {
                    helpMessage += helpTableRowEven;
                } else {
                    helpMessage += helpTableRowOdd;
                }
                helpMessage += lines[i] + helpTableRowClose;
            }
            helpMessage += helpTableClose;
        }
    
        if (msg.content.indexOf("!attack") !== -1) {
            helpHeader = "Attack Type Abbreviations";
            lines.push("<b>BA:</b> Blunt Attacks, <b>EA:</b> Edged Attacks, <b>SH:</b> Shooting");
            lines.push("<b>TE:</b> Throwing Edged, <b>TB:</b> Throwing Blunt, <b>EN:</b> Energy");
            lines.push("<b>FO:</b> Force, <b>GP:</b> Grappling, <b>GB:</b> Grabbing");
            lines.push("<b>ES:</b> Escaping, <b>CH:</b> Charging, <b>DO:</b> Dodging");
            lines.push("<b>EV:</b> Evading, <b>BL:</b> Blocking, <b>CA:</b> Catching");
            lines.push("<b>Stun:</b> Stun?, <b>Slam:</b> Slam?, <b>Kill:</b> Kill?");
            
            makeHelpMessage(6);
        }
        
        if (msg.content.indexOf("!help") !== -1) {
            helpHeader = "Help";
            lines.push("Use the format <b>!ut [rank name] [column shift] [attack type] --roll:[roll name] --id:[character id]<b>");
            lines.push("Rank Name must come first, --roll: and --id: options must come at the end");
            lines.push("Use <b>!example</b> to get examples on how to use the script");
            lines.push("Use <b>!attack</b> for a listing of attack type abbreviation");
            
            makeHelpMessage(4);
        }
        
        if (msg.content.indexOf("!example") !== -1) {
            helpHeader = "Example";
            lines.push("<b>!ut Monstrous</b> (Monstrous rank roll)");
            lines.push("<b>!ut Incredible 2 CA</b> (Incredible rank with +2 column shift on a Catching attempt)");
            lines.push("<b>!ut Remarkable DO -2</b> (Remarkable rank with -2 column shift on a Dodging attempt)");
            lines.push("<b>!ut Excellent BA</b> (Excellent rank Blunt Attack)</td>");
            
            makeHelpMessage(4);
        }
            
        sendChat(msg.who, helpMessage);
    }
    
/*UNIVERSAL TABLE SCRIPT*/
    if(msg.type == "api" && msg.content.indexOf("!ut ") !== -1) {
    
    /* OBJECTS AND LISTS */
        var rankColumnsObjects = [/*Shift 0*/{startgreen: 66, startyellow: 95, startred: 100}, /*Feeble*/{startgreen: 61, startyellow: 91, startred: 100}, /*Poor*/{startgreen: 56, startyellow: 86, startred: 100}, /*Typical*/{startgreen: 51, startyellow: 81, startred: 98}, /*Good*/{startgreen: 46, startyellow: 76, startred: 98}, /*Excellent*/{startgreen: 41, startyellow: 71, startred: 95}, /*Remarkable*/{startgreen: 36, startyellow: 66, startred: 95}, /*Incredible*/{startgreen: 31, startyellow: 61, startred: 91}, /*Amazing*/{startgreen: 26, startyellow: 56, startred: 91}, /*Monstrous*/{startgreen: 21, startyellow: 51, startred: 86}, /*Unearthly*/{startgreen: 16, startyellow: 46, startred: 86}, /*Shift X*/{startgreen: 11, startyellow: 41, startred: 81}, /*Shift Y*/{startgreen: 7, startyellow: 41, startred: 81}, /*Shift Z*/{startgreen: 4, startyellow: 36, startred: 76}, /*Class 1000*/{startgreen: 2, startyellow: 36, startred: 76}, /*Class 3000*/{startgreen: 2, startyellow: 31, startred: 71}, /*Class 5000*/{startgreen: 2, startyellow: 26, startred: 66}, /*Beyond*/{startgreen: 2, startyellow: 21, startred: 61}];

        var rankColumns = ["shift-0", "feeble", "poor", "typical", "good", "excellent", "remarkable", "incredible", "amazing", "monstrous", "unearthly", "shift-x", "shift-y", "shift-z", "class1000", "class3000", "class5000", "beyond"]

        var attackTypeResults = [/*White*/{ba: "Miss", ea: "Miss", sh: "Miss", te: "Miss", tb: "Miss", en: "Miss", fo: "Miss", gp: "Miss", gb: "Miss", es: "Miss", ch: "Miss", do: "None", ev: "Autohit", bl:  "-6 CS", ca: "Autohit", stun: "1-10", slam: "Gr. Slam", kill: "En. Loss"}, /*Green*/{ba: "Hit", ea: "Hit", sh: "Hit", te: "Hit", tb: "Hit", en: "Hit", fo: "Hit", gp: "Miss", gb: "Take", es: "Miss", ch: "Hit", do: "-2 CS", ev: "Evasion", bl: "-4 CS", ca: "Miss", stun: "1", slam: "1 area", kill: "E/S"}, /*Yellow*/{ba: "Slam", ea: "Stun", sh: "Bullseye", te: "Stun", tb: "Hit", en: "Bullseye", fo: "Bullseye", gp: "partial", gb: "Grab", es: "Escape", ch: "Slam", do: "-4 CS", ev: "+1 CS", bl: "-2 CS", ca: "Damage", stun: "No", slam: "Stagger", kill: "No"}, /*Red*/{ba: "Stun", ea: "Kill", sh: "Kill", te: "Kill", tb: "Stun", en: "Kill", fo: "Stun", gp: "Hold", gb: "Break", es: "Reverse", ch: "Stun", do: "-6 CS", ev: "+2 CS", bl: "+1 CS", ca: "Catch", stun: "No", slam: "No", kill: "No"}];
        var attackTypes = {ba:"Blunt Attack",ea:"Edged Attack",sh:"Shooting",te:"Throwing Edged",tb:"Throwing Blunt",en:"Energy",fo:"Force",gp:"Grappling",gb:"Grabbing",es:"Escaping",ch:"Charging",do:"Dodging",ev:"Evading",bl:"Blocking",ca:"Catching",stun:"Stun?",slam:"Slam?",kill:"Kill?"};
        
    /* SETUP DICE ROLL AND GET MESSAGE CONTENT */
        var rollNum = randomInteger(100);       
        var msgContent = msg.content;
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
        
    /* CHECK THAT RANK NAME IS CORRECT, HALT IF INCORRECT */
        if (rankIndex < 0) {
            sendChat(msg.who, "<i>Rank not found. Please try again.</i>");   //, null, {noarchive: true}
        } else {
        /* GET COLUMN SHIFT AND SET ROLL COLUMN */    
            var colShift;
            var plus;
            var rollColumnIndex;
        
            _.each(input,function(i){
                if (!_.isNaN(parseInt(i))) {
                    colShift = parseInt(i);                    
                } else if (i.indexOf("+") > -1) {
                    plus = parseInt(i.replace("+",""));
                    if (!_.isNaN(plus)) {
                        colshift = plus;
                    }
                }
            });
                
            if(!colShift) {
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
            var rollColName = rankColumns[rollColumnIndex].charAt(0).toUpperCase() + rankColumns[rollColumnIndex].slice(1);
        
        /* DETERMINE IF THERE IS AN ATTACK TYPE AND RESULT IF THERE IS */   
            var attackTypeResult;
            var attackTypeString;
            var attackTypeRoll;
            var attackTypeDefault;
            var attackTypeMarvel;
        
            var attack = function(index) {
                _.each(input,function(i){
                    if (_.has(attackTypes,i)){
                        attackTypeResult = attackTypeResults[index][i];
                        attackTypeRoll = attackTypes[i];                       
                    }                     
                });
                
                if (attackTypeRoll) {
                    attackTypeDefault = "{{Type=" + attackTypeRoll + "}}";
                    attackTypeMarvel = "{{attacktype=" + attackTypeRoll + "}}";
                    attackTypeString = " for a " + attackTypeResult;
                } else {
                    attackTypeString = "";
                }             
            };
        
        /* SEARCH FOR OPTIONAL ROLL TYPE/ID AND ASSIGN TO VARIABLES */
            var rollOptionSplit;
            
            var rollType;           
            var rollTypeMarvel = "";
            var rollTypeDefault = "";
            
            var cid;
            var character;
            var charName;
            var who;
        
            if (msgContent.indexOf("--") > -1) {
                rollOptionSplit = msgContent.split(/\s+--/);
                _.each(rollOptionSplit,function(string){
                    if (string.toLowerCase().indexOf("roll:") > -1) {
                        rollType = string.replace(/roll:/i,"");
                    } else if (string.toLowerCase().indexOf("id:") > -1) {
                        cid = string.replace(/id:/i,"");
                        character = getObj("character", cid);
                        if (character !== undefined) {
                            charName = character.get("name");
                            who = charName;
                        }
                    }
                });                
            /* ASSIGN ROLL TYPE FORMATTING */
                if (rollType) {
                    rollTypeMarvel = "{{rolltype=" + rollType + "}}";
                    rollTypeDefault = "<br />" + rollType;
                }                
            } else {
                who = msg.who;            
            }         
           
    /* GATHER RESULTS, FORMAT, AND SEND TO CHAT */
            var colorResult;
            var rollResult;
            var borderColor;
            
            if (rollNum < rollColumn.startgreen) {
                attack(0);
                colorResult = "white;\">WHITE";
                borderColor = '#FEF68E';
              
            } else if (rollNum >= rollColumn.startgreen && rollNum < rollColumn.startyellow) {
                attack(1);
                colorResult = "green;color: white;\">GREEN";
                borderColor = 'green';
            
            } else if (rollNum >= rollColumn.startyellow && rollNum < rollColumn.startred) {
                attack(2);
                colorResult = "yellow;\">YELLOW";
                borderColor = '#FFCC00';
            
            } else if (rollNum >= rollColumn.startred) {
                attack(3);
                colorResult = "red;color: white;\">RED";
                borderColor = 'red';
            };
            
            //Style number result of die roll according to result color
            rollResult = '<span style="background-color:#FEF68E;border:2px solid ' + borderColor + ';padding:0 3px 0 3px;font-weight:bold;font-size:1.1em;">' + rollNum + '</span>';
            
    /* CHANGE FORMAT OF CHAT RESULT */
        var template;        
        var defaultTemplate = "&{template:default} {{name=" +  who + rollTypeDefault + "}} " + attackTypeDefault + " {{Column=" + rollColName + "}} {{Roll=" + rollResult + "}}{{Result=<span style=\"padding:2px 5px;font-weight:bold;background-color:" + colorResult + "</span>" + attackTypeString + "}}";
        var noTemplate = rollColName + " column: " + rollResult + " is a <span style=\"padding:2px 5px;font-weight:bold; background-color:" + colorResult + "</span> result" + attackTypeString + ".";
        var marvelTemplate = "&{template:marvel} {{rollname=" + who + "}} " + attackTypeMarvel + " " + rollTypeMarvel + " {{rollcolumn=" + rollColName + "}} {{rollresult=" + rollResult + "}}{{colorresult=<span style=\"padding:2px 5px;font-weight:bold;background-color:" + colorResult + "</span>" + attackTypeString + "}}";
        
     
/*********** CHOOSE YOUR TEMPLATE BLOW HERE! ************/
        /**** DEFAULT ROLL TEMPLATE ****/            
            template = defaultTemplate;
        
        /**** NO ROLL TEMPLATE ****/            
            //template = noTemplate;
        
        /**** MARVEL THEMED ROLL TEMMPLATE ****/
            //template = marvelTemplate
            
/*********** CHOOSE YOUR TEMPLATE ABOVE HERE! ***********/   
 
    
        
        /*** SENDS FINAL MESSAGE TO CHAT WINDOW - DO NOT CHANGE ***/    
            sendChat(msg.who, template);        
        };
    }
});
