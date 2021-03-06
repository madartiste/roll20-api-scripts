// Github:   https://github.com/shdwjk/Roll20API/blob/master/GroupInitiative/GroupInitiative.js
// By:       The Aaron, Arcane Scriptomancer
// Contact:  https://app.roll20.net/users/104025/the-aaron

var GroupInitiative = GroupInitiative || (function() {
    'use strict';

    var version = '0.8.8',
        lastUpdate = 1431382263,
        schemaVersion = 0.8,
        intBaseSize = 10000,
        bonusCache = {},
        sorters = {
            'None': function(to) {
                return to;
            },
            'Ascending': function(to){
                return _.sortBy(to,function(i){
                    return (i.pr);
                });
            },
            'Descending': function(to){
                return _.sortBy(to,function(i){
                    return (-i.pr);
                });
            }
        },
        esRE = function (s) {
          var escapeForRegexp = /(\\|\/|\[|\]|\(|\)|\{|\}|\?|\+|\*|\||\.|\^|\$)/g;
          return s.replace(escapeForRegexp,"\\$1");
        },

        HE = (function(){
          var entities={
                  //' ' : '&'+'nbsp'+';',
                  '<' : '&'+'lt'+';',
                  '>' : '&'+'gt'+';',
                  "'" : '&'+'#39'+';',
                  '@' : '&'+'#64'+';',
                  '{' : '&'+'#123'+';',
                  '|' : '&'+'#124'+';',
                  '}' : '&'+'#125'+';',
                  '[' : '&'+'#91'+';',
                  ']' : '&'+'#93'+';',
                  '"' : '&'+'quot'+';'
              },
              re=new RegExp('('+_.map(_.keys(entities),esRE).join('|')+')','g');
          return function(s){
            return s.replace(re, function(c){ return entities[c] || c; });
          };
        }()),
        formatDieRoll = function(die, bonus) {
            var highlight = ( 1 === die
                    ? '#B31515' 
                    : ( state.GroupInitiative.config.dieSize === die
                        ? '#3FB315'
                        : '#FEF68E'
                    )
                ),
                dielight=( 1 === die
                    ? '#ff0000' 
                    : ( state.GroupInitiative.config.dieSize === die
                        ? '#00ff00'
                        : 'white'
                    )
                );
            return '<span class="inlinerollresult showtip tipsy" style="min-width:1em;display: inline-block; border: 2px solid '+
                highlight+
                '; background-color: #FEF68E;color: #404040; font-weight:bold;padding: 0px 3px;cursor: help"'+
                ' title="'+
                HE(HE(
                    '<span style="color:white;">'+
                        '<span style="font-weight:bold;color:'+dielight+';">'+die+'</span> [init] '+
                        (bonus>=0 ? '+' :'-')+' <span style="font-weight:bold;">'+Math.abs(bonus)+'</span> [bonus]'+
                    '</span>'
                ))+'">'+
                    (((die*intBaseSize)+(bonus*intBaseSize))/intBaseSize)+
                '</span>';
        },
        buildAnnounceGroups = function(l) {
            var groupColors = {
                npc: '#eef',
                character: '#efe',
                gmlayer: '#aaa'
            };
            return _.reduce(l,function(m,s){
                var type= ('gmlayer' === s.token.get('layer') 
                    ? 'gmlayer' 
                    : ( (s.character && _.filter(s.character.get('controlledby').split(/,/),function(c){ 
                            return 'all' === c || ('' !== c && !playerIsGM(c) );
                        }).length>0) || false 
                        ? 'character'
                        : 'npc'
                    ));
                if('graphic'!==s.token.get('type') || 'token' !==s.token.get('subtype')) {
                    return m;
                }
                m[type].push('<div style="float: left;display: inline-block;border: 1px solid #888;border-radius:5px; padding: 1px 3px;background-color:'+groupColors[type]+';">'+
                    '<div style="font-weight:bold; font-size: 1.3em;">'+
                        '<img src="'+(s.token && s.token.get('imgsrc'))+'" style="height: 2.5em;float:left;margin-right:2px;">'+
                        ((s.token && s.token.get('name')) || (s.character && s.character.get('name')) || '(Creature)')+
                    '</div>'+
                    '<div>'+
                        formatDieRoll( (s.dieRoll || Math.round(s.init-s.bonus)),s.bonus)+
                    '</div>'+
                    '<div style="clear: both;"></div>'+
                '</div>');
                return m;
            },{npc:[],character:[],gmlayer:[]});
        },
        announcers = {
            'None': function() {
            },
            'Hidden': function(l) {
                var groups=buildAnnounceGroups(l);
                sendChat('GroupInit','/w gm '+
                    '<div>'+
                        groups.character.join('')+
                        groups.npc.join('')+
                        groups.gmlayer.join('')+
                        '<div style="clear:both;"></div>'+
                    '</div>');
            },
            'Partial': function(l) {
                var groups=buildAnnounceGroups(l);
                sendChat('GroupInit','/direct '+
                    '<div>'+
                        groups.character.join('')+
                        '<div style="clear:both;"></div>'+
                    '</div>');
                sendChat('GroupInit','/w gm '+
                    '<div>'+
                        groups.npc.join('')+
                        groups.gmlayer.join('')+
                        '<div style="clear:both;"></div>'+
                    '</div>');
            },
            'Visible': function(l) {
                var groups=buildAnnounceGroups(l);
                sendChat('GroupInit','/direct '+
                    '<div>'+
                        groups.character.join('')+
                        groups.npc.join('')+
                        '<div style="clear:both;"></div>'+
                    '</div>');
                sendChat('GroupInit','/w gm '+
                    '<div>'+
                        groups.gmlayer.join('')+
                        '<div style="clear:both;"></div>'+
                    '</div>');
            }
        },
        statAdjustments = {
            'Stat-DnD': {
                func: function(v) {
                    return Math.floor((v-10)/2);
                },
                desc: 'Calculates the bonus as if the value were a DnD Stat.'
            },
            'Bare': {
                func: function(v) {
                    return v;
                },
                desc: 'No Adjustment.'
            },
            'Floor': {
                func: function(v) {
                    return Math.floor(v);
                },
                desc: 'Rounds down to the nearest integer.'
            },
            'Ceiling': {
                func: function(v) {
                    return Math.ceil(v);
                },
                desc: 'Rounds up to the nearest integer.'
            },
            'Bounded': {
                func: function(v,l,h) {
                    l=parseFloat(l,10) || v;
                    h=parseFloat(h) || v;
                    return Math.min(h,Math.max(l,v));
                },
                desc: 'Restricts to a range.  Use Bounded:<lower bound>:<upper bound> for specifying bounds.  Leave a bound empty to be unrestricted in that direction.  Example: <b>Bounded::5</b> would specify a maximum of 5 with no minimum.'
            }
        },

        rollers = {
            'Least-All-Roll':{
                func: function(s,k,l){
                    if(!_.has(this,'init')) {
                        this.init=_.chain(l)
                        .pluck('bonus')
                        .map(function(d){
                            return ((randomInteger(state.GroupInitiative.config.dieSize)*intBaseSize)+(d*intBaseSize))/intBaseSize;
                        },{})
                        .min()
                        .value();
                    }
                    s.init=this.init;
                    return s;
                },
                desc: 'Sets the initiative to the lowest of all initiatives rolled for the group.'
            },
            'Mean-All-Roll':{
                func: function(s,k,l){
                    if(!_.has(this,'init')) {
                        this.init=_.chain(l)
                            .pluck('bonus')
                            .map(function(d){
                                return ((randomInteger(state.GroupInitiative.config.dieSize)*intBaseSize)+(d*intBaseSize))/intBaseSize;
                            },{})
                            .reduce(function(memo,r){
                                return memo+r;
                            },[0])
                            .map(function(v){
                                return Math.floor(v/l.length);
                            })
                            .value();
                    }
                    s.init=this.init;
                    return s;
                },
                desc: 'Sets the initiative to the mean (average) of all initiatives rolled for the group.'
            },
            'Individual-Roll': {
                func: function(s,k,l){
                    s.dieRoll=randomInteger(state.GroupInitiative.config.dieSize);
                    s.init=((s.dieRoll*intBaseSize)+(s.bonus*intBaseSize))/intBaseSize;
                    return s;
                },
                desc: 'Sets the initiative individually for each member of the group.'
            },
            'Constant-By-Stat': {
                func: function(s,k,l){
                    s.dieRoll=0;
                    s.init=s.bonus;
                    return s;
                },
                desc: 'Sets the initiative individually for each member of the group to their bonus with no roll.'
            }
        },

    checkInstall = function() {    
        log('-=> GroupInitiative v'+version+' <=-  ['+(new Date(lastUpdate*1000))+']');

        if( ! _.has(state,'GroupInitiative') || state.GroupInitiative.version !== schemaVersion) {
            log('  > Updating Schema to v'+schemaVersion+' <');
            switch(state.GroupInitiative && state.GroupInitiative.version) {
                case 0.7:
                    state.GroupInitiative.version = schemaVersion;
                    state.GroupInitiative.config.announcer = 'Partial';
                    break;

                case 0.6:
                    state.GroupInitiative.version = schemaVersion;
                    state.GroupInitiative.config = {
                        rollType: state.GroupInitiative.rollType,
                        replaceRoll: state.GroupInitiative.replaceRoll,
                        dieSize: 20,
                        autoOpenInit: true,
                        sortOption: 'Descending'
                    };
                    delete state.GroupInitiative.replaceRoll;
                    delete state.GroupInitiative.rollType;
                    break;
                    
                case 0.5:
                    state.GroupInitiative.version = schemaVersion;
                    state.GroupInitiative.replaceRoll = false;
                    break;

                default:
                    state.GroupInitiative = {
                        version: schemaVersion,
                        bonusStatGroups: [
                            [
                                {
                                    attribute: 'dexterity'
                                }
                            ]
                        ],
                        config: {
                            rollType: 'Individual-Roll',
                            replaceRoll: false,
                            dieSize: 20,
                            autoOpenInit: true,
                            sortOption: 'Descending',
                            announcer: 'Partial'
                        }
                    };
                    break;
            }
        }
    },

    ch = function (c) {
        var entities = {
            '<' : 'lt',
            '>' : 'gt',
            "'" : '#39',
            '@' : '#64',
            '{' : '#123',
            '|' : '#124',
            '}' : '#125',
            '[' : '#91',
            ']' : '#93',
            '"' : 'quot',
            '-' : 'mdash',
            ' ' : 'nbsp'
        };

        if(_.has(entities,c) ){
            return ('&'+entities[c]+';');
        }
        return '';
    },


    buildBonusStatGroupRows = function() {
        return _.reduce(state.GroupInitiative.bonusStatGroups, function(memo,bsg){
            return memo + '<li><span style="border: 1px solid #999;background-color:#eee;padding: 0px 3px;">'+_.chain(bsg)
            .map(function(s){
                var attr=s.attribute+'|'+( _.has(s,'type') ? s.type : 'current' );
                if(_.has(s,'adjustments')) {
                    attr=_.reduce(s.adjustments, function(memo2,a) {
                        return a+'( '+memo2+' )';
                    }, attr);
                }
                return attr;
            })
            .value()
            .join('</span> + <span style="border: 1px solid #999;background-color:#eee;padding: 0px 3px;">')
            +'</span></li>';
        },"");
    },

    buildStatAdjustmentRows = function() {
        return _.reduce(statAdjustments,function(memo,r,n){
            return memo+"<li><b>"+n+"</b> — "+r.desc+"</li>";
        },"");
    },

    getConfigOption_SortOptions = function() {
        var text = state.GroupInitiative.config.sortOption;
        return '<div>'+
            'Sort Options is currently <b>'+
                text+
            '</b>.'+
            '<div>'+
                _.map(_.keys(sorters),function(so){
                    return '<a href="!group-init-config --sort-option|'+so+'">'+
                        so+
                    '</a>';
                }).join(' ')+
            '</div>'+
        '</div>';
    },
    getConfigOption_DieSize = function() {
        return '<div>'
            +'Initiative Die size is currently <b>'
                +state.GroupInitiative.config.dieSize
            +'</b> '
            +'<a href="!group-init-config --set-die-size|?{Number of sides the initiative die has:|'+state.GroupInitiative.config.dieSize+'}">'
                +'Set Die Size'
            +'</a>'
        +'</div>';
    },

    getConfigOption_AutoOpenInit = function() {
        var text = (state.GroupInitiative.config.autoOpenInit ? 'On' : 'Off' );
        return '<div>'
            +'Auto Open Init is currently <b>'
                +text
            +'</b> '
            +'<a href="!group-init-config --toggle-auto-open-init">'
                +'Toggle'
            +'</a>'
        +'</div>';
        
    },
    getConfigOption_AnnounceOptions = function() {
        var text = state.GroupInitiative.config.announcer;
        return '<div>'+
            'Announcer is currently <b>'+
                text+
            '</b>.'+
            '<div>'+
                _.map(_.keys(announcers),function(an){
                    return '<a href="!group-init-config --set-announcer|'+an+'">'+
                        an+
                    '</a>';
                }).join(' ')+
            '</div>'+
        '</div>';
    },

    getAllConfigOptions = function() {
        return getConfigOption_SortOptions() + getConfigOption_DieSize() + getConfigOption_AutoOpenInit() + getConfigOption_AnnounceOptions();
    },

    showHelp = function() {
        var rollerRows=_.reduce(rollers,function(memo,r,n){
            var selected=((state.GroupInitiative.config.rollType === n) ? 
            '<div style="float:right;width:90px;border:1px solid black;background-color:#ffc;text-align:center;"><span style="color: red; font-weight:bold; padding: 0px 4px;">Selected</span></div>'
            : '' ),
            selectedStyleExtra=((state.GroupInitiative.config.rollType === n) ? ' style="border: 1px solid #aeaeae;background-color:#8bd87a;"' : '');

            return memo+selected+"<li "+selectedStyleExtra+"><b>"+n+"</b> - "+r.desc+"</li>";
        },""),
        statAdjustmentRows = buildStatAdjustmentRows(),
        bonusStatGroupRows = buildBonusStatGroupRows();            

        sendChat('',
            '/w gm '
            +'<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
            +'<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">'
            +'GroupInitiative v'+version
            +'</div>'
            +'<div style="padding-left:10px;margin-bottom:3px;">'
            +'<p>Rolls initiative for the selected tokens and adds them '
            +'to the turn order if they don'+ch("'")+'t have a turn yet.</p>'

            +'<p>The calculation of initiative is handled by the '
            +'combination of Roller (See <b>Roller Options</b> below) and '
            +'a Bonus.  The Bonus is determined based on an ordered list '
            +'of Stat Groups (See <b>Bonus Stat Groups</b> below).  Stat '
            +'Groups are evaluated in order.  The bonus computed by the first '
            +'Stat Group for which all attributes exist and have a '
            +'numeric value is used.  This allows you to have several '
            +'Stat Groups that apply to different types of characters. '
            +'In practice you will probably only have one, but more are '
            +'there if you need them.</p>'
            +'</div>'
            +'<b>Commands</b>'
            +'<div style="padding-left:10px;">'
            +'<b><span style="font-family: serif;">!group-init</span></b>'
            +'<div style="padding-left: 10px;padding-right:20px">'
            +'<p>This command uses the configured Roller to '
            +'determine the initiative order for all selected '
            +'tokens.</p>'
            +'</div>'
            +'</div>'

            +'<div style="padding-left:10px;">'
            +'<b><span style="font-family: serif;">!group-init <i>--help</i></span></b>'
            +'<div style="padding-left: 10px;padding-right:20px">'
            +'<p>This command displays the help.</p>'
            +'</div>'
            +'</div>'

            +'<div style="padding-left:10px;">'
            +'<b><span style="font-family: serif;">!group-init <i>--set-roller</i> '+ch('<')+'roller name'+ch('>')+'</span></b>'
            +'<div style="padding-left: 10px;padding-right:20px">'
            +'<p>Sets Roller to use for calculating initiative.</p>'
            +'This command requires 1 parameter:'
            +'<ul>'
            +'<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
            +'<b><span style="font-family: serif;">roller name</span></b> -- The name of the Roller to use.  See <b>Roller Options</b> below.'
            +'</li> '
            +'</ul>'
            +'</div>'
            +'</div>'

            +'<div style="padding-left:10px;">'
            +'<b><span style="font-family: serif;">!group-init <i>--promote</i> '+ch('<')+'index'+ch('>')+'</span></b>'
            +'<div style="padding-left: 10px;padding-right:20px">'
            +'<p>Increases the importance the specified Bonus Stat Group.</p>'
            +'This command requires 1 parameter:'
            +'<ul>'
            +'<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
            +'<b><span style="font-family: serif;">index</span></b> -- The numeric index of the Bonus Stat Group to promote.  See <b>Bonus Stat Groups</b> below.'
            +'</li> '
            +'</ul>'
            +'</div>'
            +'</div>'

            +'<div style="padding-left:10px;">'
            +'<b><span style="font-family: serif;">!group-init <i>--del-group</i> '+ch('<')+'index'+ch('>')+'</span></b>'
            +'<div style="padding-left: 10px;padding-right:20px">'
            +'<p>Deletes the specified Bonus Stat Group.</p>'
            +'This command requires 1 parameter:'
            +'<ul>'
            +'<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
            +'<b><span style="font-family: serif;">index</span></b> -- The numeric index of the Bonus Stat Group to delete.  See <b>Bonus Stat Groups</b> below.'
            +'</li> '
            +'</ul>'
            +'</div>'
            +'</div>'
            +'<div style="padding-left:10px;">'
            +'<b><span style="font-family: serif;">!group-init <i>--add-group</i> --'+ch('<')+'adjustment'+ch('>')+' [--'+ch('<')+'adjustment'+ch('>')+'] '+ch('<')+'attribute name[|'+ch('<')+'max|current'+ch('>')+']'+ch('>')+' [--'+ch('<')+'adjustment'+ch('>')+' [--'+ch('<')+'adjustment'+ch('>')+'] '+ch('<')+'attribute name[|'+ch('<')+'max|current'+ch('>')+']'+ch('>')+' ...]  </span></b>'
            +'<div style="padding-left: 10px;padding-right:20px">'
            +'<p>Adds a new Bonus Stat Group to the end of the list.  Each adjustment operation can be followed by another adjustment operation, but eventually must end in an attriute name.  Adjustment operations are applied to the result of the adjustment operations that follow them.</p>'
            +'<p>For example: <span style="border:1px solid #ccc; background-color: #eec; padding: 0px 3px;">--Bounded:-2:2 --Stat-DnD wisdom|max</span> would first computer the DnD Stat bonus for the max field of the wisdom attribute, then bound it between -2 and +2.</p>'
            +'This command takes multiple parameters:'
            +'<ul>'
            +'<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
            +'<b><span style="font-family: serif;">adjustment</span></b> -- One of the Stat Adjustment Options. See <b>Stat Adjustment Options</b> below.'
            +'</li> '
            +'<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
            +'<b><span style="font-family: serif;">attribute name</span></b> -- The name of an attribute.  You can specify |max or |current on the end to target those specific fields (defaults to |current).'
            +'</li> '
            +'</ul>'
            +'</div>'
            +'</div>'

            +'<div style="padding-left:10px;">'
                +'<b><span style="font-family: serif;">!group-init <i>--toggle-replace</i></span></b>'
                +'<div style="padding-left: 10px;padding-right:20px">'
                    +'<div style="float:right;width:40px;border:1px solid black;background-color:#ffc;text-align:center;">'+( state.GroupInitiative.config.replaceRoll ? '<span style="color: red; font-weight:bold; padding: 0px 4px;">ON</span>' : '<span style="color: #999999; font-weight:bold; padding: 0px 4px;">OFF</span>' )+'</div>'
                    +'<p>Sets whether initative scores for selected tokens replace their current scores.</p>'
                +'</div>'
            +'</div>'

            +'<b>Roller Options</b>'
            +'<div style="padding-left:10px;">'
            +'<ul>'
            +rollerRows
            +'</ul>'
            +'</div>'

            +'<b>Stat Adjustment Options</b>'
            +'<div style="padding-left:10px;">'
            +'<ul>'
            +statAdjustmentRows
            +'</ul>'
            +'</div>'

            +'<b>Bonus Stat Groups</b>'
            +'<div style="padding-left:10px;">'
            +'<ol>'
            +bonusStatGroupRows
            +'</ol>'
            +'</div>'

            +getAllConfigOptions()

            +'</div>'
        );
    },

    findInitiativeBonus = function(id) {
        var bonus = 0;
        if(_.has(bonusCache,id)) {
            return bonusCache[id];
        }
        _.chain(state.GroupInitiative.bonusStatGroups)
        .find(function(group){
            bonus = _.chain(group)
            .map(function(details){
                var stat=parseFloat(getAttrByName(id,details.attribute, details.type||'current'),10);

                stat = _.reduce(details.adjustments || [],function(memo,a){
                    var args,adjustment,func;
                    if(memo) {
                        args=a.split(':');
                        adjustment=args.shift();
                        args.unshift(memo);
                        func=statAdjustments[adjustment].func;
                        if(_.isFunction(func)) {
                            memo =func.apply({},args);
                        }
                    }
                    return memo;
                },stat);
                return stat;
            })
            .reduce(function(memo,v){
                return memo+v;
            },0)
            .value();
            return !(_.isUndefined(bonus) || _.isNaN(bonus) || _.isNull(bonus));
        });
        bonusCache[id]=bonus;
        return bonus;
    },

    HandleInput = function(msg_orig) {
        var msg = _.clone(msg_orig),
            args,
            cmds,
            workgroup,
            workvar,
            turnorder,
            rolls,
            pageid,
            error=false,
            initFunc,
            cont=false,
            manualBonus=0;

        if (msg.type !== "api" || !playerIsGM(msg.playerid) ) {
            return;
        }

		if(_.has(msg,'inlinerolls')){
			msg.content = _.chain(msg.inlinerolls)
				.reduce(function(m,v,k){
					m['$[['+k+']]']=v.results.total || 0;
					return m;
				},{})
				.reduce(function(m,v,k){
					return m.replace(k,v);
				},msg.content)
				.value();
		}

        args = msg.content.split(/\s+--/);
        switch(args.shift()) {
            case '!group-init':
                if(args.length > 0) {
                    cmds=args.shift().split(/\s+/);

                    switch(cmds[0]) {
                        case 'help':
                            showHelp();
                            break;

                        case 'add-group':
                            workgroup=[];
                            workvar={};

                            _.each(args,function(arg){
                                var a=arg.split(/\s+(.+)/),
                                b,
                                c=a[0].split(/:/);

                                if(_.has(statAdjustments,c[0])) {
                                    if('Bare' !== c[0]) {
                                        if(!_.has(workvar,'adjustments')) {
                                            workvar.adjustments=[];
                                        }
                                        workvar.adjustments.unshift(a[0]);
                                    }
                                    if(a.length > 1){
                                        b=a[1].split(/\|/);
                                        workvar.attribute=b[0];
                                        if('max'===b[1]) {
                                            workvar.type = 'max';
                                        }
                                        workgroup.push(workvar);
                                        workvar={};
                                    }
                                } else {
                                    sendChat('!group-init --add-group', '/w gm ' 
                                        +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                        +'Unknown Stat Adustment: '+c[0]+'<br>'
                                        +'Use one of the following:'
                                        +'<ul>'
                                        +buildStatAdjustmentRows()
                                        +'</ul>'
                                        +'</div>'
                                    );
                                    error=true;
                                }
                            });
                            if(!error) {
                                if(!_.has(workvar,'adjustments')){
                                    state.GroupInitiative.bonusStatGroups.push(workgroup);
                                    sendChat('GroupInitiative', '/w gm ' 
                                        +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                        +'Updated Bonus Stat Group Ordering:'
                                        +'<ol>'
                                        +buildBonusStatGroupRows()
                                        +'</ol>'
                                        +'</div>'
                                    );
                                } else {
                                    sendChat('!group-init --add-group', '/w gm ' 
                                        +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                        +'All Stat Adjustments must have a final attribute name as an argument.  Please add an attribute name after --'+args.pop()
                                        +'</div>'
                                    );
                                }
                            }
                            break;


                        case 'promote':
                            cmds[1]=Math.max(parseInt(cmds[1],10),1);
                            if(state.GroupInitiative.bonusStatGroups.length >= cmds[1]) {
                                if(1 !== cmds[1]) {
                                    workvar=state.GroupInitiative.bonusStatGroups[cmds[1]-1];
                                    state.GroupInitiative.bonusStatGroups[cmds[1]-1] = state.GroupInitiative.bonusStatGroups[cmds[1]-2];
                                    state.GroupInitiative.bonusStatGroups[cmds[1]-2] = workvar;
                                }

                                sendChat('GroupInitiative', '/w gm ' 
                                    +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                    +'Updated Bonus Stat Group Ordering:'
                                    +'<ol>'
                                    +buildBonusStatGroupRows()
                                    +'</ol>'
                                    +'</div>'
                                );
                            } else {
                                sendChat('!group-init --promote', '/w gm ' 
                                    +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                    +'Please specify one of the following by number:'
                                    +'<ol>'
                                    +buildBonusStatGroupRows()
                                    +'</ol>'
                                    +'</div>'
                                );
                            }
                            break;

                        case 'del-group':
                            cmds[1]=Math.max(parseInt(cmds[1],10),1);
                            if(state.GroupInitiative.bonusStatGroups.length >= cmds[1]) {
                                state.GroupInitiative.bonusStatGroups=_.filter(state.GroupInitiative.bonusStatGroups, function(v,k){
                                    return (k !== (cmds[1]-1));
                                });

                                sendChat('GroupInitiative', '/w gm ' 
                                    +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                    +'Updated Bonus Stat Group Ordering:'
                                    +'<ol>'
                                    +buildBonusStatGroupRows()
                                    +'</ol>'
                                    +'</div>'
                                );
                            } else {
                                sendChat('!group-init --del-group', '/w gm ' 
                                    +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                    +'Please specify one of the following by number:'
                                    +'<ol>'
                                    +buildBonusStatGroupRows()
                                    +'</ol>'
                                    +'</div>'
                                );
                            }
                            break;

                        case 'set-roller':
                            if(_.has(rollers,cmds[1])) {
                                state.GroupInitiative.config.rollType=cmds[1];
                                sendChat('GroupInitiative', '/w gm ' 
                                    +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                    +'Roller is now set to: <b>'+cmds[1]+'<br>'
                                    +'</div>'
                                );
                            } else {
                                sendChat('GroupInitiative', '/w gm ' 
                                    +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                    +'Not a valid Roller Name: <b>'+cmds[1]+'</b><br>'
                                    +'Please use one of the following:'
                                    +'<ul>'
                                    +_.reduce(rollers,function(memo,r,n){
                                        return memo+'<li>'+n+'</li>';
                                    },'')
                                    +'</ul>'
                                    +'</div>'
                                );
                            }
                            break;

                        case 'toggle-replace':
                            state.GroupInitiative.config.replaceRoll = !state.GroupInitiative.config.replaceRoll;
                            sendChat('GroupInitiative', '/w gm '
                                +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                +'Replace Initiative on Roll is now: <b>'+ (state.GroupInitiative.config.replaceRoll ? 'ON' : 'OFF') +'</b>'
                                +'</div>'
                            );
                            break;

                        case 'bonus':
                            if(cmds[1].match(/^[\-\+]?\d+(\.\d+)?$/)){
                                manualBonus=parseFloat(cmds[1]);
                                cont=true;
                            } else {
                                sendChat('GroupInitiative', '/w gm ' 
                                    +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                    +'Not a valid bonus: <b>'+cmds[1]+'</b>'
                                    +'</div>'
                                );
                            }
                            break;

                        default:
                            sendChat('GroupInitiative', '/w gm ' 
                                +'<div style="padding:1px 3px;border: 1px solid #8B4513;background: #eeffee; color: #8B4513; font-size: 80%;">'
                                +'Not a valid command: <b>'+cmds[0]+'</b>'
                                +'</div>'
                            );
                            break;
                    }
                } else {
                    cont=true;
                }

                if(cont) {
                    if(_.has(msg,'selected')) {
                        bonusCache = {};
                        turnorder = Campaign().get('turnorder');
                        turnorder = ('' === turnorder) ? [] : JSON.parse(turnorder);
                        if(state.GroupInitiative.config.replaceRoll) {
                            turnorder=_.reject(turnorder,function(i){
                                return _.contains(_.pluck(msg.selected, '_id'),i.id);
                            });
                        }

                        initFunc=rollers[state.GroupInitiative.config.rollType].func;

                        Campaign().set({
                            turnorder: JSON.stringify(
                                sorters[state.GroupInitiative.config.sortOption](
                                    turnorder.concat(
                                        _.chain(msg.selected)
                                            .map(function(s){
                                                return getObj(s._type,s._id);
                                            })
                                            .reject(_.isUndefined)
                                            .reject(function(s){
                                                return _.contains(_.pluck(turnorder,'id'),s.id);
                                            })
                                            .map(function(s){
                                                pageid=pageid || s.get('pageid');
                                                return {
                                                    token: s,
                                                    character: getObj('character',s.get('represents'))
                                                };
                                            })
                                            .map(function(s){
                                                s.bonus=(s.character ? findInitiativeBonus(s.character.id) || 0 : 0)+manualBonus;
                                                return s;
                                            })
                                            .map(initFunc)
                                            .tap(announcers[state.GroupInitiative.config.announcer])
                                            .map(function(s){
                                                return {
                                                    id: s.token.id,
                                                    pr: s.init,
                                                    custom: ''
                                                };
                                            })
                                            .value()
                                    )
                                )
                            )
                        });
                        if(state.GroupInitiative.config.autoOpenInit && !Campaign().get('initativepage')) {
                            Campaign().set({
                                initiativepage: pageid
                            });
                        }
                    } else {
                        showHelp();
                    }
                }
                break;
            case '!group-init-config':
                if(_.contains(args,'--help')) {
                    showHelp();
                    return;
                }
                if(!args.length) {
                    sendChat('','/w gm '
                        +'<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
                            +'<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">'
                                +'GroupInitiative v'+version
                            +'</div>'
                            +getAllConfigOptions()
                        +'</div>'
                    );
                    return;
                }
                _.each(args,function(a){
                    var opt=a.split(/\|/),
                        omsg='';
                    switch(opt.shift()) {
                        case 'sort-option':
                            if(sorters[opt[0]]) {
                               state.GroupInitiative.config.sortOption=opt[0];
                            } else {
                                omsg='<div><b>Error:</b> Not a valid sort method: '+opt[0]+'</div>';
                            }
                            sendChat('','/w gm '
                                +'<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
                                    +omsg
                                    +getConfigOption_SortOptions()
                                +'</div>'
                            );
                            break;
                        case 'set-die-size':
                            if(opt[0].match(/^\d+$/)) {
                               state.GroupInitiative.config.dieSize=parseInt(opt[0],10);
                            } else {
                                omsg='<div><b>Error:</b> Not a die size: '+opt[0]+'</div>';
                            }
                            sendChat('','/w gm '
                                +'<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
                                    +omsg
                                    +getConfigOption_DieSize()
                                +'</div>'
                            );
                            break;

                        case 'toggle-auto-open-init':
                            state.GroupInitiative.config.autoOpenInit = !state.GroupInitiative.config.autoOpenInit;
                            sendChat('','/w gm '
                                +'<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
                                    +getConfigOption_AutoOpenInit()
                                +'</div>'
                            );
                            break;
                        case 'set-announcer':
                            if(announcers[opt[0]]) {
                               state.GroupInitiative.config.announcer=opt[0];
                            } else {
                                omsg='<div><b>Error:</b> Not a valid announcer: '+opt[0]+'</div>';
                            }
                            sendChat('','/w gm '
                                +'<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
                                    +omsg
                                    +getConfigOption_AnnounceOptions()
                                +'</div>'
                            );
                            break;

                        default:
                            sendChat('','/w gm '
                                +'<div><b>Unsupported Option:</div> '+a+'</div>'
                            );
                    }
                            
                });

                break;
        }

    },


    RegisterEventHandlers = function() {
        on('chat:message', HandleInput);
    };

    return {
        RegisterEventHandlers: RegisterEventHandlers,
        CheckInstall: checkInstall
    };
}());

on("ready",function(){
    'use strict';

        GroupInitiative.CheckInstall();
        GroupInitiative.RegisterEventHandlers();
});



