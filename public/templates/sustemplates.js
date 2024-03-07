(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['admin'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"playersBasic"),depth0,{"name":"playersBasic","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!DOCTYPE html>\n<html lang=\"en\">\n\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Master</title>\n    <script src=\"https://code.jquery.com/jquery-3.7.0.js\" integrity=\"sha256-JlqSTELeR4TLqP0OG9dxM7yDPqX1ox/HfgiSLBj8+kM=\" crossorigin=\"anonymous\"></script>\n        <script src=\"/socket.io/socket.io.js\"></script>\n<!--    <script src=\"https://cdn.socket.io/4.5.4/socket.io.min.js\"></script>-->\n    <link rel='stylesheet' href='css/basics.css'>\n    <link rel='stylesheet' href='css/master.css'>\n</head>\n\n<body>\n    <h1>Master "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"me") || (depth0 != null ? lookupProperty(depth0,"me") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"me","hash":{},"data":data,"loc":{"start":{"line":16,"column":15},"end":{"line":16,"column":21}}}) : helper)))
    + "</h1>\n    <p>This is the master client, it listens for player connections</p>\n    <p id='message'></p>\n    <button id='startSession'>Start Session</button>\n    <button id='endSession'>End Session</button>\n    <div id='players'></div>\n\n    <div>\n        <div id='controlPaanel'>\n            "
    + ((stack1 = lookupProperty(helpers,"with").call(alias1,(depth0 != null ? lookupProperty(depth0,"playersBasic") : depth0),{"name":"with","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":25,"column":12},"end":{"line":25,"column":60}}})) != null ? stack1 : "")
    + "\n        </div>\n    </div>\n\n\n    <script>\n        const socket = io();\n        const PINGBTN = `pingbtn-`;\n        const RESETBTN = `resetbtn-`;\n\n        socket.on('connect', () => {\n            socket.emit('nowIAmTheMaster');\n        });\n        socket.on('onPlayerConnect', (msg) => {\n            onPlayerConnect(msg);\n        });\n        socket.on('onGetPlayers', (msg) => {\n//            console.log('I hear onGetPlayers')\n            onGetPlayers(msg);\n        });\n        socket.on('onGetPlayerIDs', (msg) => {\n//            console.log('I hear onGetPlayerIDs')\n            onGetPlayerIDs(msg);\n        });\n        socket.on('updatePlayers', (arr) => {\n//            console.log('I hear updatePlayers')\n            onGetPlayerIDs(arr);\n        });\n        socket.on('newPlayer', (players) => {\n            newPlayer(players);\n        });\n        const buttonSetup = () => {\n            let b = document.getElementsByClassName('pingBtn');\n            [...b].forEach((bu) => {\n                bu.addEventListener('click', (evt) => {\n                    let id = evt.target.id.replace(PINGBTN, '');\n                    socket.emit('playerPing', id);\n                });\n            });\n            b = document.getElementsByClassName('resetBtn');\n            [...b].forEach((bu) => {\n                bu.addEventListener('click', (evt) => {\n                    let id = evt.target.id.replace(RESETBTN, '');\n                    socket.emit('playerReset', id);\n                });\n            });\n        };\n        let ssb = document.getElementById('startSession');\n        ssb.addEventListener('click', (evt) => {\n            console.log('cow');\n            socket.emit('startNewSession', function (s) {\n                console.log('mooooooooooooooooooooo');\n            });\n        });\n        let esb = document.getElementById('endSession');\n        esb.addEventListener('click', (evt) => {\n            socket.emit('adminTerminateSession');\n        });\n        const playerDisplay = (p, i) => {\n            var e = document.getElementById('players');\n            var s = '';\n            s += `<div class='${p.active ? 'active' : 'inactive'}'>${p.id} <button class=\"pingBtn\" id=\"${PINGBTN}${p.id}\">Ping</button>`;\n            s += `<button class=\"resetBtn\" id=\"${RESETBTN}${p.id}\">Reset</button></div>`;\n            e.innerHTML += s;\n        };\n        const clearPlayers = () => {\n            document.getElementById('players').innerHTML = ``;\n        };\n        const onPlayerConnect = (msg) => {\n            document.getElementById('message').innerHTML += `<p>player ${msg} has connected</p>`;\n        };\n        const onGetPlayers = (arr) => {\n//            console.log('onGetPlayers');\n//            console.log(arr);\n            clearPlayers();\n            document.getElementById('players').innerHTML = '<b>players:</b>';\n            for (var i = 0; i < arr.length; i++) {\n                playerDisplay(arr[i], i);\n//                console.log(players);\n//                console.log(arr[i]);\n            }\n            buttonSetup();\n        };\n        const onGetPlayerIDsOld = (arr) => {\n            console.log('onGetPlayerIDs');\n            console.log(arr);\n            clearPlayers();\n            document.getElementById('players').innerHTML = '<b>players:</b>';\n            for (var i = 0; i < arr.length; i++) {\n                playerDisplay(arr[i], i);\n//                console.log(players);\n                console.log(arr[i]);\n            }\n            buttonSetup();\n        };\n        const newPlayer = (id) => {\n            socket.emit('getPlayerIDs');\n        };\n        const updateSession = () => {\n            socket.emit('updateSession');\n        };\n        window.updateSession = updateSession;\n        socket.emit('getPlayerIDs');\n//        socket.emit('getPlayers');\n\n    </script>\n</body>\n\n</html>\n";
},"usePartial":true,"useData":true});
templates['connecton'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"nav-header-container\">\n	<div class=\"back-btn-title-bar title-bar-blue\">\n		<a class=\"back-btn home_btn\" href=\"#\" title=\"Previous page\"><img alt=\"Previous page icon\" src=\"assets/backButton.svg\"/></a>\n	</div>\n</div>\n\n	<!-- Main Content -->\n<div class=\"menu-container\">\n	<div class=\"header-img\">\n		<img alt=\"Company logo\" src=\"assets/GlobalNewsConnectOnLogos-02.svg\"/>\n	</div>\n<div class=\"team-menu\">\n	<div class=\"team-link\">\n		<div class=\"team-link-icon\">\n			<img class=\"gov-bg\" alt=\"team icon\" src=\"assets/icons_GOVwhite 1.svg\"/>\n		</div>\n		<div class=\"team-link-info\">\n			<h2>Team name</h2>\n			<h3>Government</h3>\n		</div>\n		<div class=\"team-link-next\">\n			<a href=\"#\" title=\"Go to Government\"><img alt=\"Next page icon\" src=\"assets/next.svg\"/></a>\n		</div>\n	</div>\n</div>\n<div class=\"team-menu\">\n	<div class=\"team-link\">\n		<div class=\"team-link-icon\">\n			<img class=\"icm-bg\" alt=\"team icon\" src=\"assets/icons_ICMwhite 1.svg\"/>\n		</div>\n		<div class=\"team-link-info\">\n			<h2>Team name</h2>\n			<h3>Individual Change Maker</h3>\n		</div>\n		<div class=\"team-link-next\">\n			<a href=\"#\" title=\"Go to Individual Change Maker\"><img alt=\"Next page icon\" src=\"assets/next.svg\"/></a>\n		</div>\n	</div>\n</div>\n	<div class=\"team-menu\">\n	<div class=\"team-link\">\n		<div class=\"team-link-icon\">\n			<img class=\"web-bg\" alt=\"team icon\" src=\"assets/icons_WEBwhite 1.svg\"/>\n		</div>\n		<div class=\"team-link-info\">\n			<h2>Team name</h2>\n			<h3>Well-Established Buisness</h3>\n		</div>\n		<div class=\"team-link-next\">\n			<a href=\"#\" title=\"Go to Well-Established Buisness\"><img alt=\"Next page icon\" src=\"assets/next.svg\"/></a>\n		</div>\n	</div>\n</div>\n<div class=\"team-menu\">\n	<div class=\"team-link\">\n		<div class=\"team-link-icon\">\n			<img class=\"cso-bg\" alt=\"team icon\" src=\"assets/icons_CSOwhite 1.svg\"/>\n		</div>\n		<div class=\"team-link-info\">\n			<h2>Team name</h2>\n			<h3>Civil Society Organisation</h3>\n		</div>\n		<div class=\"team-link-next\">\n			<a href=\"#\" title=\"Go to Civil Society Organisation\"><img alt=\"Next page icon\" src=\"assets/next.svg\"/></a>\n		</div>\n	</div>\n</div>\n<div class=\"team-menu\">\n	<div class=\"team-link\">\n		<div class=\"team-link-icon\">\n			<img class=\"se-bg\" alt=\"team icon\" src=\"assets/icons_SEwhite 1.svg\"/>\n		</div>\n		<div class=\"team-link-info\">\n			<h2>Team name</h2>\n			<h3>Small Enterprise</h3>\n		</div>\n		<div class=\"team-link-next\">\n			<a href=\"#\" title=\"Go to Small Enterprise\"><img alt=\"Next page icon\" src=\"assets/next.svg\"/></a>\n		</div>\n	</div>\n</div>\n<div class=\"team-menu\">\n	<div class=\"team-link\">\n		<div class=\"team-link-icon\">\n			<img class=\"pv1-bg\" alt=\"team icon\" src=\"assets/icons_PV1white 1.svg\"/>\n		</div>\n		<div class=\"team-link-info\">\n			<h2>Team name</h2>\n			<h3>Public Voice 1</h3>\n		</div>\n		<div class=\"team-link-next\">\n			<a href=\"#\" title=\"Go to Public Voice 1\"><img alt=\"Next page icon\" src=\"assets/next.svg\"/></a>\n		</div>\n	</div>\n</div>\n<div class=\"team-menu\">\n	<div class=\"team-link\">\n		<div class=\"team-link-icon\">\n			<img class=\"pv2-bg\" alt=\"team icon\" src=\"assets/icons_PV2white 1.svg\"/>\n		</div>\n		<div class=\"team-link-info\">\n			<h2>Team name</h2>\n			<h3>Public Voice 2</h3>\n		</div>\n		<div class=\"team-link-next\">\n			<a href=\"#\" title=\"Go to Public Voice 2\"><img alt=\"Next page icon\" src=\"assets/next.svg\"/></a>\n		</div>\n	</div>\n</div>\n</div>\n";
},"useData":true});
templates['dragwin'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='dragbar'>\n    <div class='closer'>x</div>\n</div>\n"
    + container.escapeExpression((lookupProperty(helpers,"dynamicPartial")||(depth0 && lookupProperty(depth0,"dynamicPartial"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"partialName") : depth0),{"name":"dynamicPartial","hash":{},"data":data,"loc":{"start":{"line":4,"column":0},"end":{"line":4,"column":30}}}))
    + "\n";
},"useData":true});
templates['game'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id='debuginfo' style='display: none;'><p id='playerID'>PlayerID: "
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":1,"column":70},"end":{"line":1,"column":76}}}) : helper)))
    + "</p></div>\n<div id='game'>\r\n<!--    <p id='team'>Team: <span>"
    + alias4(((helper = (helper = lookupProperty(helpers,"stakeholder") || (depth0 != null ? lookupProperty(depth0,"stakeholder") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"stakeholder","hash":{},"data":data,"loc":{"start":{"line":3,"column":33},"end":{"line":3,"column":48}}}) : helper)))
    + "</span></p>-->\n    <div id='activity'>\r\n    "
    + alias4((lookupProperty(helpers,"playerPartial")||(depth0 && lookupProperty(depth0,"playerPartial"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"partialName") : depth0),(depth0 != null ? lookupProperty(depth0,"ob") : depth0),{"name":"playerPartial","hash":{},"data":data,"loc":{"start":{"line":5,"column":4},"end":{"line":5,"column":36}}}))
    + "\r\n    </div>\r\n</div>\r\n";
},"useData":true});
templates['gamev1'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id='game'>\n    <!--    <p>This is the player client, it requires a master before it can init</p>    -->\n    <p id='stakeholder'></p>\n    <p id='playerID'>PlayerID: "
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":4,"column":31},"end":{"line":4,"column":37}}}) : helper)))
    + "</p>\n    <p id='team'>Team: <span>"
    + alias4(((helper = (helper = lookupProperty(helpers,"stakeholder") || (depth0 != null ? lookupProperty(depth0,"stakeholder") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"stakeholder","hash":{},"data":data,"loc":{"start":{"line":5,"column":29},"end":{"line":5,"column":44}}}) : helper)))
    + "</span></p>\n    <p id='gameTimer'>timer:</p>\n    <p id='active'></p>\n    <p id='message'></p>\n    <div id='activity'>\n    "
    + alias4((lookupProperty(helpers,"playerPartial")||(depth0 && lookupProperty(depth0,"playerPartial"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"partialName") : depth0),(depth0 != null ? lookupProperty(depth0,"ob") : depth0),{"name":"playerPartial","hash":{},"data":data,"loc":{"start":{"line":10,"column":4},"end":{"line":10,"column":36}}}))
    + "\n    </div>\n</div>\n";
},"useData":true});
templates['global'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"nav-header-container\">\n	<div class=\"back-btn-title-bar title-bar-red\">\n		<a class=\"back-btn home_btn\" href=\"#\" title=\"Previous page\"><img alt=\"Previous page icon\" src=\"assets/backButton.svg\"/></a>\n		<h1>GlobalTimes</h1>\n	</div>\n	<div class=\"headline-title\">\n		<h2>2030</h2>\n		<p>HEADLINES</p>\n	</div>\n</div>\n		<!-- Main Content -->\n\n<div class=\"article-container\">\n	<div class=\"article-img\">\n		<img alt=\"\" src=\"assets/Article1-img-100.jpg\"/>\n	</div>\n	<div class=\"article-headline\">\n		<h3>Governments threaten to deploy army as occupy retail movement escalates</h3>\n		<p>12 hours ago</p>\n	</div>\n</div>\n<div class=\"article-container\">\n	<div class=\"article-img\">\n		<img alt=\"\" src=\"assets/Article2-img-100.jpg\"/>\n	</div>\n	<div class=\"article-headline\">\n		<h3>Eco-protection laws cause mass evictions</h3>\n		<p>5 hours ago</p>\n	</div>\n</div>\n<div class=\"article-container\">\n	<div class=\"article-img\">\n		<img alt=\"\" src=\"assets/Article3-img-100.jpg\"/>\n	</div>\n	<div class=\"article-headline\">\n		<h3>Poisoned by plastic and unable to afford health care</h3>\n		<p>4 hours ago</p>\n	</div>\n</div>\n<div class=\"article-container\">\n	<div class=\"article-img\">\n		<img alt=\"\" src=\"assets/Article4-img-100.jpg\"/>\n	</div>\n	<div class=\"article-headline\">\n		<h3>Highest recorded referendums in a single year</h3>\n		<p>2 hours ago</p>\n	</div>\n</div>\n";
},"useData":true});
templates['holding'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"header\">\n		  <h1>Welcome to your travel portal</h1>\n\n		<div class=\"header-grad-overlay\"></div>\n\n</div>\n	<!-- Main Content -->\n\n<div class=\"main-content center\">\n		<h2>The session will begin shortly.</h2>\n		<p>Please wait while we connect all the players.</p>\n\n</div>\n";
},"useData":true});
templates['intro'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"header\">\n		  <h1>Welcome to your travel portal</h1>\n\n		<div class=\"header-grad-overlay\"></div>\n\n</div>\n	<!-- Main Content -->\n\n<div class=\"main-content center\">\n		<h2>You are here to figure things out.</h2>\n		<p>How can your sector adapt and thrive as part of successful decarbonisation pathways?</p>\n		<p>You will be accompanied by AI Caroline throughout your journey. She will make herself known shortly.</p>\n\n</div>\n";
},"useData":true});
templates['intro_v1'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "Welcome to the sustainability game. There is currently no active session, please wait here.\n";
},"useData":true});
templates['kickedout'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "Sorry, you have been removed from the player list. But don't worry, you can rejoin by refreshing the page.\n";
},"useData":true});
templates['newlogin'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"header\">\n		  <h1>Welcome to your travel portal</h1>\n\n		<div class=\"header-grad-overlay\"></div>\n\n</div>\n	<!-- Main Content -->\n\n<div class=\"main-content center\">\n		<h2>You are here to figure things out.</h2>\n		<p>How can your sector adapt and thrive as part of successful decarbonisation pathways?</p>\n		<p>You will be accompanied by AI Caroline throughout your journey. She will make herself known shortly.</p>\n	<!-- Start Button -->\n	<div class=\"big-button\" id='big_start_button'>\n			<a>START</a>\n	</div>\n\n</div>\n<div id='login'>\n<!--    <p>If you have a session ID you can enter it here to join the session</p>-->\n    <input type='text' id='seshnum' placeholder='enter code...' value='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"value") || (depth0 != null ? lookupProperty(depth0,"value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"value","hash":{},"data":data,"loc":{"start":{"line":21,"column":71},"end":{"line":21,"column":80}}}) : helper)))
    + "' oninput='validate'><button id='enter'>Join session</button>\n</div>\n<script>\n    validate = (inp) => {\n        inp.value = inp.value.replace(/[^0-9]/g, '');\n    };\n    requestSession = () => {\n        let o = {session: txt.val().replace(/ /gm, ''), player: staticID};\n//        console.log('request session:');\n//        console.log(o);\n        socket.emit('requestSession', o);\n    };\n    butt = $('#enter');\n\n    bbutt = $('#big_start_button');\n    butt = butt.add(bbutt);\n    txt = $('#seshnum');\n    butt.on('click', () => {\n        requestSession();\n    });\n    txt.on('keydown', (ev) => {\n        if (ev.keyCode === '13') {\n            requestSession();\n        }\n    });\n    txt.focus();\n//    if (getInitProps().autoenroll) {\n    if (autoEnrollAllowed()) {\n        console.log('auto enroll this');\n        let d = 1000 + (Math.random() * 2000);\n        d = 100;\n//        setTimeout(requestSession, d);\n        requestSession();\n    }\n</script>\n";
},"useData":true});
templates['outtro'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"header\">\n		  <h1>Thank you for participating</h1>\n\n		<div class=\"header-grad-overlay\"></div>\n\n</div>\n	<!-- Main Content -->\n\n<div class=\"main-content center\">\n		<h2>The session has now ended.</h2>\n		<p>Please close this browser window to leave the game.</p>\n\n</div>\n";
},"useData":true});
templates['playerList'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <tr>\n        <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":8,"column":12},"end":{"line":8,"column":18}}}) : helper)))
    + "</td>\n        <td class='"
    + alias4(((helper = (helper = lookupProperty(helpers,"connected") || (depth0 != null ? lookupProperty(depth0,"connected") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"connected","hash":{},"data":data,"loc":{"start":{"line":9,"column":19},"end":{"line":9,"column":32}}}) : helper)))
    + "'>"
    + alias4(((helper = (helper = lookupProperty(helpers,"connected") || (depth0 != null ? lookupProperty(depth0,"connected") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"connected","hash":{},"data":data,"loc":{"start":{"line":9,"column":34},"end":{"line":9,"column":47}}}) : helper)))
    + "</td>\n        <td class='"
    + alias4(((helper = (helper = lookupProperty(helpers,"enrolled") || (depth0 != null ? lookupProperty(depth0,"enrolled") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"enrolled","hash":{},"data":data,"loc":{"start":{"line":10,"column":19},"end":{"line":10,"column":31}}}) : helper)))
    + "'>"
    + alias4(((helper = (helper = lookupProperty(helpers,"enrolled") || (depth0 != null ? lookupProperty(depth0,"enrolled") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"enrolled","hash":{},"data":data,"loc":{"start":{"line":10,"column":33},"end":{"line":10,"column":45}}}) : helper)))
    + "</td>\n        <td class='"
    + alias4(((helper = (helper = lookupProperty(helpers,"assigned") || (depth0 != null ? lookupProperty(depth0,"assigned") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"assigned","hash":{},"data":data,"loc":{"start":{"line":11,"column":19},"end":{"line":11,"column":31}}}) : helper)))
    + "'>"
    + alias4(((helper = (helper = lookupProperty(helpers,"stakeholder") || (depth0 != null ? lookupProperty(depth0,"stakeholder") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"stakeholder","hash":{},"data":data,"loc":{"start":{"line":11,"column":33},"end":{"line":11,"column":48}}}) : helper)))
    + "</td>\n        <td class='"
    + alias4(((helper = (helper = lookupProperty(helpers,"isLead") || (depth0 != null ? lookupProperty(depth0,"isLead") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"isLead","hash":{},"data":data,"loc":{"start":{"line":12,"column":19},"end":{"line":12,"column":29}}}) : helper)))
    + "'>"
    + alias4(((helper = (helper = lookupProperty(helpers,"isLead") || (depth0 != null ? lookupProperty(depth0,"isLead") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"isLead","hash":{},"data":data,"loc":{"start":{"line":12,"column":31},"end":{"line":12,"column":41}}}) : helper)))
    + "</td>\n        <td class=''>"
    + ((stack1 = container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"rounds") : stack1), depth0)) != null ? stack1 : "")
    + "</td>\n        <td><button class='pingBtn' id='pingbtn-"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":14,"column":48},"end":{"line":14,"column":54}}}) : helper)))
    + "'>ping</button>\n        <button class='refreshBtn' id='refreshbtn-"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":15,"column":50},"end":{"line":15,"column":56}}}) : helper)))
    + "'>refresh</button>\n        <button class='leadBtn' id='leadbtn-"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":16,"column":44},"end":{"line":16,"column":50}}}) : helper)))
    + "'>make lead</button>\n        <button class='removeBtn' id='removebtn-"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":17,"column":48},"end":{"line":17,"column":54}}}) : helper)))
    + "'>remove</button></td>\n        </tr>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n\n<table id='playerList'>\n    <tbody>\n        <tr><th>id</th><th>connected</th><th class='allenrolled'>enrolled</th><th>stakeholder</th><th>isLead</th><th>rounds</th><th></th></tr>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"players") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":8},"end":{"line":19,"column":17}}})) != null ? stack1 : "")
    + "    </tbody>\n</table>\n";
},"useData":true});
templates['playersBasic'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "<p>"
    + container.escapeExpression(container.lambda(depth0, depth0))
    + "</p>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "list of player IDs\nThat's insane\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"ids") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":0},"end":{"line":5,"column":9}}})) != null ? stack1 : "");
},"useData":true});
templates['playlist'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <tr class='"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"isCurrent") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":15},"end":{"line":3,"column":48}}})) != null ? stack1 : "")
    + "'>\n    <td><div class='slideIcon "
    + alias4(((helper = (helper = lookupProperty(helpers,"type") || (depth0 != null ? lookupProperty(depth0,"type") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data,"loc":{"start":{"line":4,"column":30},"end":{"line":4,"column":38}}}) : helper)))
    + "'></div></td><td><div class='slideLink' id='slideLink_"
    + alias4(((helper = (helper = lookupProperty(helpers,"index") || (depth0 != null ? lookupProperty(depth0,"index") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data,"loc":{"start":{"line":4,"column":92},"end":{"line":4,"column":101}}}) : helper)))
    + "'>"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":4,"column":103},"end":{"line":4,"column":114}}}) : helper))) != null ? stack1 : "")
    + "</div></td><td><div class='rInd rInd_"
    + alias4(((helper = (helper = lookupProperty(helpers,"hasAction") || (depth0 != null ? lookupProperty(depth0,"hasAction") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"hasAction","hash":{},"data":data,"loc":{"start":{"line":4,"column":151},"end":{"line":4,"column":164}}}) : helper)))
    + " indr"
    + alias4(((helper = (helper = lookupProperty(helpers,"actionID") || (depth0 != null ? lookupProperty(depth0,"actionID") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"actionID","hash":{},"data":data,"loc":{"start":{"line":4,"column":169},"end":{"line":4,"column":181}}}) : helper)))
    + "' id='indr"
    + alias4(((helper = (helper = lookupProperty(helpers,"actionID") || (depth0 != null ? lookupProperty(depth0,"actionID") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"actionID","hash":{},"data":data,"loc":{"start":{"line":4,"column":191},"end":{"line":4,"column":203}}}) : helper)))
    + "'></div></td>\n    </tr>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "highlight";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<table><tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"slideList") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":4},"end":{"line":6,"column":13}}})) != null ? stack1 : "")
    + "    <tr><td></td><td>* = action updates user devices</td><td></td></tr>\n</tbody></table>\n";
},"useData":true});
templates['rounds'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<tr><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"n") || (depth0 != null ? lookupProperty(depth0,"n") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"n","hash":{},"data":data,"loc":{"start":{"line":5,"column":8},"end":{"line":5,"column":13}}}) : helper)))
    + "</td><td class='"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"current") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":5,"column":29},"end":{"line":5,"column":60}}})) != null ? stack1 : "")
    + "'>"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":5,"column":62},"end":{"line":5,"column":68}}}) : helper)))
    + "</td><td class='unticked "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"complete") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":5,"column":93},"end":{"line":5,"column":122}}})) != null ? stack1 : "")
    + "'>&#x2714;</td></tr>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "highlight";
},"4":function(container,depth0,helpers,partials,data) {
    return "ticked";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "Session rounds:\n<table><tbody>\n<tr><th></th><th></th><th>completed?</th></tr>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":4,"column":0},"end":{"line":6,"column":9}}})) != null ? stack1 : "")
    + "</tbody></table>\n";
},"useData":true});
templates['scores'] = template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, alias5=container.lambda, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <tr><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":6,"column":16},"end":{"line":6,"column":25}}}) : helper)))
    + "</td><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"stVote") || (depth0 != null ? lookupProperty(depth0,"stVote") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"stVote","hash":{},"data":data,"loc":{"start":{"line":6,"column":34},"end":{"line":6,"column":44}}}) : helper)))
    + "</td><td>"
    + alias4(alias5(((stack1 = (depth0 != null ? lookupProperty(depth0,"pv1") : depth0)) != null ? lookupProperty(stack1,"m") : stack1), depth0))
    + "</td><td>"
    + alias4(alias5(((stack1 = (depth0 != null ? lookupProperty(depth0,"pv2") : depth0)) != null ? lookupProperty(stack1,"m") : stack1), depth0))
    + "</td><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"pvTotal") || (depth0 != null ? lookupProperty(depth0,"pvTotal") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"pvTotal","hash":{},"data":data,"loc":{"start":{"line":6,"column":89},"end":{"line":6,"column":100}}}) : helper)))
    + "</td><td class='highlight'>"
    + alias4(((helper = (helper = lookupProperty(helpers,"mult") || (depth0 != null ? lookupProperty(depth0,"mult") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"mult","hash":{},"data":data,"loc":{"start":{"line":6,"column":127},"end":{"line":6,"column":135}}}) : helper)))
    + "</td></tr>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id='scoreSummary'>\n    <div>Score summary:</div>\n    <table><tbody>\n        <tr><th>Stakeholder</th><th>Player<br>resources</th><th>PV 1<br>mean</th><th>PV 2<br>mean</th><th>PV total</th><th>PR x PV</th></tr>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"teams") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":5,"column":8},"end":{"line":7,"column":17}}})) != null ? stack1 : "")
    + "    </tbody></table>\n</div>\n";
},"useData":true});
templates['scoresheet'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <tr class='stat'><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"prop") || (depth0 != null ? lookupProperty(depth0,"prop") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"prop","hash":{},"data":data,"loc":{"start":{"line":3,"column":25},"end":{"line":3,"column":33}}}) : helper)))
    + ":</td><td class='highlight'>"
    + alias4(((helper = (helper = lookupProperty(helpers,"val") || (depth0 != null ? lookupProperty(depth0,"val") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"val","hash":{},"data":data,"loc":{"start":{"line":3,"column":61},"end":{"line":3,"column":68}}}) : helper)))
    + "</td></tr>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<table><tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"vals") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":4},"end":{"line":4,"column":13}}})) != null ? stack1 : "")
    + "</tbody></table>\n";
},"useData":true});
templates['serverlost'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div id='wrapper'>\n    server connection lost, please wait\n</div>\n";
},"useData":true});
templates['session'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <tr><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":7,"column":16},"end":{"line":7,"column":22}}}) : helper)))
    + "</td><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"src") || (depth0 != null ? lookupProperty(depth0,"src") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"src","hash":{},"data":data,"loc":{"start":{"line":7,"column":31},"end":{"line":7,"column":38}}}) : helper)))
    + "</td><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"targ") || (depth0 != null ? lookupProperty(depth0,"targ") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"targ","hash":{},"data":data,"loc":{"start":{"line":7,"column":47},"end":{"line":7,"column":55}}}) : helper)))
    + "</td><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"round") || (depth0 != null ? lookupProperty(depth0,"round") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"round","hash":{},"data":data,"loc":{"start":{"line":7,"column":64},"end":{"line":7,"column":73}}}) : helper)))
    + "</td><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"valID") || (depth0 != null ? lookupProperty(depth0,"valID") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"valID","hash":{},"data":data,"loc":{"start":{"line":7,"column":82},"end":{"line":7,"column":91}}}) : helper)))
    + ":</td><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"val") || (depth0 != null ? lookupProperty(depth0,"val") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"val","hash":{},"data":data,"loc":{"start":{"line":7,"column":101},"end":{"line":7,"column":108}}}) : helper)))
    + "</td></tr>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<p>I am the sesh</p>\n<div>\n    <p>raw score table:</p>\n    <table><tbody>\n        <tr><th>id</th><th>src</th><th>targ</th><th>round</th><th>valID:</th><th>val</th></tr>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"scores") : depth0)) != null ? lookupProperty(stack1,"raw") : stack1),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":8},"end":{"line":8,"column":17}}})) != null ? stack1 : "")
    + "    </tbody></table>\n\n</div>\n";
},"useData":true});
templates['sessionno'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "No session found\n";
},"useData":true});
templates['superuser'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "I AM THE SUPER USER\n<div class='controls'>\n<br>\n<button id='showSock'>show sockets</button>\n</div>\n";
},"useData":true});
templates['teamview'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <h3>"
    + alias4(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":3,"column":8},"end":{"line":3,"column":17}}}) : helper)))
    + "</h3>\n    "
    + alias4(((helper = (helper = lookupProperty(helpers,"teamSize") || (depth0 != null ? lookupProperty(depth0,"teamSize") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"teamSize","hash":{},"data":data,"loc":{"start":{"line":4,"column":4},"end":{"line":4,"column":16}}}) : helper)))
    + " members\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id='teamlist'>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"team") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":4},"end":{"line":5,"column":13}}})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true});
templates['test'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "I am the test template on the server\n<p>Here is the data: "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"data":data,"loc":{"start":{"line":2,"column":21},"end":{"line":2,"column":30}}}) : helper)))
    + "</p>\n<p>"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"inner"),depth0,{"name":"inner","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "</p>\n";
},"usePartial":true,"useData":true});
templates['layouts/backup'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<!DOCTYPE html>\n<html>\n\n<head>\n    <title>Default HB template</title>\n</head>\n\n<body>\n    <h3>Oh no</h3>\n    <p>Looks like you are trying use a Handlebars template which doesn't exist. This is the backup template.</p>\n</body>\n\n</html>\n";
},"useData":true});
templates['partials/dragwin'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class='dragbar'>\n<div class='closer'>x</div>\n</div>\n";
},"useData":true});
templates['partials/erascores'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "<p>"
    + container.escapeExpression(container.lambda(depth0, depth0))
    + "</p>";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "erascores:\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"era1") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":0},"end":{"line":2,"column":38}}})) != null ? stack1 : "")
    + "\n";
},"useData":true});
templates['partials/inner'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "This is the inner\n";
},"useData":true});
templates['partials/playersBasic'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "Wow ";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "list of player IDs\nThat's insane\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"ids") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":0},"end":{"line":3,"column":26}}})) != null ? stack1 : "")
    + "\n";
},"useData":true});
templates['partials/publicvoices'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<tr><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":20,"column":39},"end":{"line":20,"column":48}}}) : helper)))
    + "</td><td><input class='voteVal' id='voteVal_"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":20,"column":92},"end":{"line":20,"column":98}}}) : helper)))
    + "' style='width: 40px;' oninput='validateVote(this)' type='number' value='0'><button class='buttonVote' id='buttonVote_"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":20,"column":216},"end":{"line":20,"column":222}}}) : helper)))
    + "'>Submit</button></td></tr>";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='represent-header'>\n	<div class='represent-info center'>\n		<h1>You Represent</h1>\n		<div class='icon-badge-box'>\n			<img class='represent-icon "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"abbr") : stack1), depth0))
    + "-bg' alt='Team icon' src='assets/icons_"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"abbrCap") : stack1), depth0))
    + "white 1.svg'/>\n		</div>\n		<h2>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "</h2>\n		<p>You are a representative of the "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + " group</p>\n	</div>\n\n</div>\n\n\n<div class='round round3 round5' id='publicvoicesNO'>\n    <div>Votes remaining: <span id='votes' class='highlight'>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"votes") : stack1), depth0))
    + "</span></div>\n    <p>(please submit a vote for each stakeholder)</p>\n    <table>\n        <tbody>\n<!--            <tr><td><b>id</b></td><td><b>title</b></td><td></td></tr>-->\n            "
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"mainTeams") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":20,"column":12},"end":{"line":20,"column":258}}})) != null ? stack1 : "")
    + "\n        </tbody>\n    </table>\n</div>\n<script>\n    setupPV();\n</script>\n";
},"useData":true});
templates['partials/stactions'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "";
},"useData":true});
templates['partials/stakeholder'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "			<img alt='Leader badge' class='icon-badge' src='assets/Leader.svg'/>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "		<p>You have been assigned the role of team leader for this round. This means that only you will be able to submit your team’s move decisions.</p>\r\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "        <p>You are team member for this round. Only your team leader will be able to submit your team’s move decisions.</p>\r\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- allocation section -->\r\n<div class='round round2' id='allocation'>\r\n\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"currentRoundComplete") : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.program(10, data, 0),"data":data,"loc":{"start":{"line":42,"column":4},"end":{"line":73,"column":11}}})) != null ? stack1 : "")
    + "</div>\r\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"your-move-2\">\r\n		<h2>Action choice</h2>\r\n		<p>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"pageState") : depth0)) != null ? lookupProperty(stack1,"action-choice") : stack1), depth0))
    + "</p>\r\n		<h2>Move description</h2>\r\n		<p>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"pageState") : depth0)) != null ? lookupProperty(stack1,"actionDesc") : stack1), depth0))
    + "</p>\r\n		<h2>Resources</h2>\r\n		<p>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"pageState") : depth0)) != null ? lookupProperty(stack1,"allocateVal") : stack1), depth0))
    + "</p>\r\n	</div>\r\n";
},"10":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <label for='action-choice'>Action choice</label>\r\n    <select id='action-choice' name='action-choice'>\r\n    <option value=''>Select an option...</option>\r\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"actions") : depth0),{"name":"each","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":55,"column":4},"end":{"line":57,"column":13}}})) != null ? stack1 : "")
    + "    </select>\r\n\r\n    <label for='move-description'>Move description</label>\r\n    <textarea id='actionDesc' placeholder='Add description here...'></textarea>\r\n    <label for='move-description'>Resources</label>\r\n    <div class='resources-container'>\r\n        <div class='resources-score'>\r\n            <p><span class='tempV'>0</span>/<span>10</span></p>\r\n        </div>\r\n        <div class='resources-buttons'>\r\n            <button class='resources-btn' id='vote_btn_minus'><i class='fa fa-minus'></i></button>\r\n            <button class='resources-btn' id='vote_btn_plus'><i class='fa fa-plus'></i></button>\r\n        </div>\r\n    </div>\r\n    <input type='submit' value='SUBMIT' class='buttonSubmit buttonAllocate' id='buttonAllocate'>\n";
},"11":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "    <option value='"
    + alias2(alias1(depth0, depth0))
    + "'>"
    + alias2(alias1(depth0, depth0))
    + "</option>\r\n";
},"13":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isMyTeam") : depth0),{"name":"if","hash":{},"fn":container.program(14, data, 0),"inverse":container.program(16, data, 0),"data":data,"loc":{"start":{"line":81,"column":8},"end":{"line":83,"column":15}}})) != null ? stack1 : "");
},"14":function(container,depth0,helpers,partials,data) {
    return "";
},"16":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n        <tr><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":82,"column":16},"end":{"line":82,"column":22}}}) : helper)))
    + "</td><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":82,"column":31},"end":{"line":82,"column":40}}}) : helper)))
    + "</td><td><input class='collabVal' id='collabVal_"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":82,"column":88},"end":{"line":82,"column":94}}}) : helper)))
    + "' style='width: 40px;' oninput='validateVote(this)' type='number' value=''><button class='buttonCollaborate buttonSubmit' id='buttonCollaborate_"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":82,"column":238},"end":{"line":82,"column":244}}}) : helper)))
    + "'>Submit</button></td></tr>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.lambda, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='represent-header'>\r\n	<div class='represent-info center'>\r\n		<h1>You Represent</h1>\r\n		<div class='icon-badge-box'>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"isLead") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":5,"column":3},"end":{"line":7,"column":19}}})) != null ? stack1 : "")
    + "            <img class='represent-icon "
    + alias3(alias2(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"abbr") : stack1), depth0))
    + "-bg' alt='Team icon' src='assets/icons_"
    + alias3(alias2(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"abbrCap") : stack1), depth0))
    + "white 1.svg'/>\r\n		</div>\r\n		<h2>"
    + alias3(alias2(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"lead") : stack1), depth0))
    + "</h2>\r\n		<p>("
    + alias3(((helper = (helper = lookupProperty(helpers,"stakeholder") || (depth0 != null ? lookupProperty(depth0,"stakeholder") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"stakeholder","hash":{},"data":data,"loc":{"start":{"line":11,"column":6},"end":{"line":11,"column":21}}}) : helper)))
    + ")</p>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"isLead") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"data":data,"loc":{"start":{"line":12,"column":2},"end":{"line":16,"column":15}}})) != null ? stack1 : "")
    + "	</div>\r\n\r\n</div>\r\n	<!-- Main Content -->\r\n<div class='main-content' style='display: block;'>\r\n	<div class='grid-container'>\r\n		<div class='grid-item-span-all link_main' id='link_resources'>\r\n			<h3>Resources</h3>\r\n		</div>\r\n		<div class='grid-item-2 link_main inactive' id='link_global'>\r\n            <img alt='Global Times Headlines logo' src='assets/GlobalNewsConnectOnLogos-01.svg'/>\r\n		</div>\r\n		<div class='grid-item-3 link_main' id='link_connecton'>\r\n		    <img alt='Connect On logo' src='assets/GlobalNewsConnectOnLogos-02.svg'/>\r\n		</div>\r\n<!--		<div class='grid-item-span-all link_main' id='link_yourmove'>-->\r\n		<div class='grid-item-span-all title'>\r\n			<h3>Your move</h3>\r\n		</div>\r\n	</div>\r\n</div>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"isLead") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":38,"column":0},"end":{"line":75,"column":7}}})) != null ? stack1 : "")
    + "<div class='round round4' id='collaboration'>\n<!--OK, this is the collab vote-->\n<div>Votes remaining: <span id='votes' class='highlight resources'>"
    + alias3(alias2(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"votes") : stack1), depth0))
    + "</span></div>\n    <table><tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"mainTeams") : depth0),{"name":"each","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":80,"column":8},"end":{"line":84,"column":17}}})) != null ? stack1 : "")
    + "    </tbody></table>\n</div>\n<script>\r\n    setupStakeholder();\r\n</script>\r\n";
},"useData":true});
templates['partials/stakeholderV1'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "Lead";
},"3":function(container,depth0,helpers,partials,data) {
    return "Member";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='round' id='collaboration'>\n    <div>Votes remaining: <span id='votes' class='highlight resources'>"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"votes") : stack1), depth0))
    + "</span></div>\n    <table><tbody>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"mainTeams") : depth0),{"name":"each","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":8},"end":{"line":10,"column":17}}})) != null ? stack1 : "")
    + "    </tbody></table>\n</div>\n\n<div class='round' id='allocation'>\n    <select id='actionSelect'>\n    <option value=''>Select an option...</option>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"actions") : depth0),{"name":"each","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":17,"column":4},"end":{"line":19,"column":13}}})) != null ? stack1 : "")
    + "    </select>\n    <br>\n    <div id=\"input-container\">\n        <textarea id='actionDesc' placeholder=\"Add description here...\"></textarea>\n    </div>\n    <br>\n    Assign a value: <input class='allocateVal' id='allocateVal' style='width: 40px;' oninput='validateAllocation(this)' type='number'>\n    <button class='buttonAllocate' id='buttonAllocate'>Submit</button>\n</div>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isMyTeam") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(9, data, 0),"data":data,"loc":{"start":{"line":7,"column":8},"end":{"line":9,"column":15}}})) != null ? stack1 : "");
},"7":function(container,depth0,helpers,partials,data) {
    return "";
},"9":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n        <tr><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":8,"column":16},"end":{"line":8,"column":22}}}) : helper)))
    + "</td><td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":8,"column":31},"end":{"line":8,"column":40}}}) : helper)))
    + "</td><td><input class='voteVal' id='voteVal_"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":8,"column":84},"end":{"line":8,"column":90}}}) : helper)))
    + "' style='width: 40px;' oninput='validateVote(this)' type='number' value='0'><button class='buttonVote' id='buttonVote_"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":8,"column":208},"end":{"line":8,"column":214}}}) : helper)))
    + "'>Submit</button></td></tr>\n";
},"11":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "        <option value='"
    + alias2(alias1(depth0, depth0))
    + "'>"
    + alias2(alias1(depth0, depth0))
    + "</option>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<p>Role: Stakeholder Team "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"isLead") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":1,"column":26},"end":{"line":1,"column":65}}})) != null ? stack1 : "")
    + "</p>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"isLead") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":0},"end":{"line":29,"column":7}}})) != null ? stack1 : "")
    + "\n<script>\n    setupStakeholder();\n</script>\n";
},"useData":true});
templates['partials/stakeholderV2'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "			<img alt='Leader badge' class='icon-badge' src='assets/Leader.svg'/>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "		<p>You have been assigned the role of team leader for this round. This means that only you will be able to submit your team’s move decisions.</p>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "        <p>You are team member for this round. Only your team leader will be able to submit your team’s move decisions.</p>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- allocation section -->\n<div class='round' id='allocation'>\n\n    <!-- OLD VERSION -->\n<!--    <div id='oldstuff'>-->\n    <!--\n    <div id='oldstuff' style='display: none;'>\n    <select id='actionSelect'>\n    <option value=''>Select an option...</option>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"actions") : depth0),{"name":"each","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":47,"column":4},"end":{"line":49,"column":13}}})) != null ? stack1 : "")
    + "    </select>\n    <br>\n    <div id='input-container'>\n        <textarea id='actionDesc' placeholder='Add description here...'></textarea>\n    </div>\n    <br>\n    Assign a value: <input class='allocateVal' id='allocateVal' style='width: 40px;' oninput='validateAllocation(this)' type='number'>\n    <button class='buttonAllocate' id='buttonAllocate'>Submit</button>\n    </div>\n    -->\n\n    <!-- NEW VERSION -->\n    <label for='action-choice'>Action choice</label>\n    <select id='action-choice' name='action-choice'>\n    <option value=''>Select an option...</option>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"actions") : depth0),{"name":"each","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":65,"column":4},"end":{"line":67,"column":13}}})) != null ? stack1 : "")
    + "    </select>\n\n    <label for='move-description'>Move description</label>\n    <textarea id='actionDesc' placeholder='Add description here...'></textarea>\n    <label for='move-description'>Resources</label>\n    <div class='resources-container'>\n        <div class='resources-score'>\n            <p><span class='tempV'>0</span>/<span>10</span></p>\n        </div>\n        <div class='resources-buttons'>\n            <button class='resources-btn' id='vote_btn_minus'><i class='fa fa-minus'></i></button>\n            <button class='resources-btn' id='vote_btn_plus'><i class='fa fa-plus'></i></button>\n        </div>\n    </div>\n    <input type='submit' value='SUBMIT' class='buttonAllocate' id='buttonAllocate'>\n<!--    <button type='submit' value='SUBMIT' class='buttonAllocate' id='buttonAllocate'>SUBMIT</button>-->\n\n</div>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "        <option value='"
    + alias2(alias1(depth0, depth0))
    + "'>"
    + alias2(alias1(depth0, depth0))
    + "</option>\n";
},"10":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "    <option value='"
    + alias2(alias1(depth0, depth0))
    + "'>"
    + alias2(alias1(depth0, depth0))
    + "</option>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.lambda, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='represent-header'>\n	<div class='represent-info center'>\n		<h1>You Represent</h1>\n		<div class='icon-badge-box'>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"isLead") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":5,"column":3},"end":{"line":7,"column":19}}})) != null ? stack1 : "")
    + "            <img class='represent-icon "
    + alias3(alias2(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"abbr") : stack1), depth0))
    + "-bg' alt='Team icon' src='assets/icons_"
    + alias3(alias2(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"abbrCap") : stack1), depth0))
    + "white 1.svg'/>\n		</div>\n		<h2>"
    + alias3(alias2(((stack1 = (depth0 != null ? lookupProperty(depth0,"teamObj") : depth0)) != null ? lookupProperty(stack1,"lead") : stack1), depth0))
    + "</h2>\n		<p>("
    + alias3(((helper = (helper = lookupProperty(helpers,"stakeholder") || (depth0 != null ? lookupProperty(depth0,"stakeholder") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"stakeholder","hash":{},"data":data,"loc":{"start":{"line":11,"column":6},"end":{"line":11,"column":21}}}) : helper)))
    + ")</p>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"isLead") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"data":data,"loc":{"start":{"line":12,"column":2},"end":{"line":16,"column":15}}})) != null ? stack1 : "")
    + "	</div>\n\n</div>\n	<!-- Main Content -->\n<div class='main-content' style='display: block;'>\n	<div class='grid-container'>\n		<div class='grid-item-span-all link_main' id='link_resources'>\n			<h3>Resources</h3>\n		</div>\n		<div class='grid-item-2 link_main' id='link_global'>\n            <img alt='Global Times Headlines logo' src='assets/GlobalNewsConnectOnLogos-01.svg'/>\n		</div>\n		<div class='grid-item-3 link_main' id='link_connecton'>\n		    <img alt='Connect On logo' src='assets/GlobalNewsConnectOnLogos-02.svg'/>\n		</div>\n		<div class='grid-item-span-all link_main' id='link_yourmove'>\n			<h3>Your move</h3>\n		</div>\n	</div>\n</div>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"isLead") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":37,"column":0},"end":{"line":86,"column":7}}})) != null ? stack1 : "")
    + "\n<script>\n    setupStakeholder();\n</script>\n";
},"useData":true});
templates['partials/unassigned'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "Oh no, I am NOT ASSIGNED\n";
},"useData":true});
templates['partials/waiting'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"header\">\n		  <h1>Welcome to your travel portal</h1>\n\n		<div class=\"header-grad-overlay\"></div>\n\n</div>\n	<!-- Main Content -->\n\n<div class=\"main-content center\">\n		<h2>Please wait, teams will be assigned shortly.</h2>\n\n</div>\n";
},"useData":true});
templates['slides/slide_010_intro'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='wrapper intro'>\r\n    <div id='circle-wrapper'>\r\n        <div class='circle' id='circle-fill'></div>\r\n    </div>\r\n    <div id='header'>\r\n        <p>"
    + alias4(((helper = (helper = lookupProperty(helpers,"header") || (depth0 != null ? lookupProperty(depth0,"header") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"header","hash":{},"data":data,"loc":{"start":{"line":6,"column":11},"end":{"line":6,"column":21}}}) : helper)))
    + "</p>\r\n    </div>\r\n    <div class=\"container intro "
    + alias4(((helper = (helper = lookupProperty(helpers,"viewtype") || (depth0 != null ? lookupProperty(depth0,"viewtype") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"viewtype","hash":{},"data":data,"loc":{"start":{"line":8,"column":32},"end":{"line":8,"column":44}}}) : helper)))
    + "\">\r\n    Welcome, the session will begin shortly\r\n    </div>\r\n</div>\r\n";
},"useData":true});
templates['slides/slide_010_outro'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='wrapper intro'>\r\n    <div id='circle-wrapper'>\r\n        <div class='circle' id='circle-fill'></div>\r\n    </div>\r\n    <div id='header'>\r\n        <p>"
    + alias4(((helper = (helper = lookupProperty(helpers,"header") || (depth0 != null ? lookupProperty(depth0,"header") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"header","hash":{},"data":data,"loc":{"start":{"line":6,"column":11},"end":{"line":6,"column":21}}}) : helper)))
    + "</p>\r\n    </div>\r\n    <div class=\"container intro "
    + alias4(((helper = (helper = lookupProperty(helpers,"viewtype") || (depth0 != null ? lookupProperty(depth0,"viewtype") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"viewtype","hash":{},"data":data,"loc":{"start":{"line":8,"column":32},"end":{"line":8,"column":44}}}) : helper)))
    + "\">\r\n    Thank you for participating\r\n    </div>\r\n</div>\r\n";
},"useData":true});
templates['slides/slide_020_entry'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "enter code "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"code") || (depth0 != null ? lookupProperty(depth0,"code") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"code","hash":{},"data":data,"loc":{"start":{"line":3,"column":72},"end":{"line":3,"column":80}}}) : helper)));
},"3":function(container,depth0,helpers,partials,data) {
    return "<i>(no current session)</i>";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"container entry "
    + alias4(((helper = (helper = lookupProperty(helpers,"viewtype") || (depth0 != null ? lookupProperty(depth0,"viewtype") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"viewtype","hash":{},"data":data,"loc":{"start":{"line":1,"column":28},"end":{"line":1,"column":40}}}) : helper)))
    + "\">\n    <div class=\"box top-box blank wide\">go to "
    + alias4(((helper = (helper = lookupProperty(helpers,"url") || (depth0 != null ? lookupProperty(depth0,"url") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"url","hash":{},"data":data,"loc":{"start":{"line":2,"column":46},"end":{"line":2,"column":53}}}) : helper)))
    + "</div>\n    <div class=\"box bottom-box blank wide\">"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"hasSession") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":3,"column":43},"end":{"line":3,"column":122}}})) != null ? stack1 : "")
    + "</div>\n</div>\n";
},"useData":true});
templates['slides/slide_110_stakeholders'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"frame1full"),depth0,{"name":"frame1full","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "<div class='container'>\n    <div class=\"grid-container1\">\n        <div class=\"cell\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"stakeholder_card"),(depth0 != null ? lookupProperty(depth0,"card_0") : depth0),{"name":"stakeholder_card","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "        </div>\n        <div class=\"cell\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"stakeholder_card"),(depth0 != null ? lookupProperty(depth0,"card_1") : depth0),{"name":"stakeholder_card","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "        </div>\n        <div class=\"cell\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"stakeholder_card"),(depth0 != null ? lookupProperty(depth0,"card_2") : depth0),{"name":"stakeholder_card","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "        </div>\n    </div>\n    <div class=\"grid-container2\">\n        <div class=\"cell\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"stakeholder_card"),(depth0 != null ? lookupProperty(depth0,"card_3") : depth0),{"name":"stakeholder_card","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "        </div>\n        <div class=\"cell\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"stakeholder_card"),(depth0 != null ? lookupProperty(depth0,"card_4") : depth0),{"name":"stakeholder_card","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "        </div>\n    </div>\n</div>\n";
},"usePartial":true,"useData":true});
templates['slides/slide_210_checkdevice'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"frame1full"),depth0,{"name":"frame1full","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "<div class='container'>\n    <div class='centered check'>\n    CHECK YOUR DEVICE\n    </div>\n</div>\n";
},"usePartial":true,"useData":true});
templates['slides/slide_230_stakeholderscollab'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"frame1full"),depth0,{"name":"frame1full","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "<div class='container'>\n    <div class=\"grid-container1\">\n        <div class=\"cell\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"stakeholder_card2"),(depth0 != null ? lookupProperty(depth0,"card_0") : depth0),{"name":"stakeholder_card2","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "        </div>\n        <div class=\"cell\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"stakeholder_card2"),(depth0 != null ? lookupProperty(depth0,"card_1") : depth0),{"name":"stakeholder_card2","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "        </div>\n        <div class=\"cell\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"stakeholder_card2"),(depth0 != null ? lookupProperty(depth0,"card_2") : depth0),{"name":"stakeholder_card2","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "        </div>\n    </div>\n    <div class=\"grid-container2\">\n        <div class=\"cell\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"stakeholder_card2"),(depth0 != null ? lookupProperty(depth0,"card_3") : depth0),{"name":"stakeholder_card2","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "        </div>\n        <div class=\"cell\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"stakeholder_card2"),(depth0 != null ? lookupProperty(depth0,"card_4") : depth0),{"name":"stakeholder_card2","data":data,"indent":"            ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "        </div>\n    </div>\n</div>\n";
},"usePartial":true,"useData":true});
templates['slides/video'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='wrapper video'>\n    <div id='vidDiv'>\n        <iframe id='vidFrame' src=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"src") || (depth0 != null ? lookupProperty(depth0,"src") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"src","hash":{},"data":data,"loc":{"start":{"line":3,"column":35},"end":{"line":3,"column":42}}}) : helper)))
    + "\" style=\"border: 0px; overflow: hidden;\" allowfullscreen allow=\"autoplay\" title='"
    + alias4(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":3,"column":123},"end":{"line":3,"column":132}}}) : helper)))
    + "' aria-label=\"Panopto Embedded Video Player\"></iframe>\n    </div>\n</div>\n\n\n\n\n";
},"useData":true});
templates['_old/slide_010_introv1'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='wrapper intro'>\n    <div id='circle-wrapper'>\n        <div class='circle' id='circle-fill'></div>\n    </div>\n    <div id='header'>\n        <p>"
    + alias4(((helper = (helper = lookupProperty(helpers,"header") || (depth0 != null ? lookupProperty(depth0,"header") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"header","hash":{},"data":data,"loc":{"start":{"line":6,"column":11},"end":{"line":6,"column":21}}}) : helper)))
    + "</p>\n    </div>\n    <div class=\"container intro "
    + alias4(((helper = (helper = lookupProperty(helpers,"viewtype") || (depth0 != null ? lookupProperty(depth0,"viewtype") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"viewtype","hash":{},"data":data,"loc":{"start":{"line":8,"column":32},"end":{"line":8,"column":44}}}) : helper)))
    + "\">\n    Welcome, the session will begin shortly\n        <div class=\"box top-box button\" id='intro_admin'>admin</div>\n        <div class=\"box bottom-box button\" id='intro_player'>play</div>\n    </div>\n</div>\n";
},"useData":true});
templates['slides/slide_partials/frame1'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class='wrapper intro'>\n    <div class=\"container frame1top\">\n    </div>\n    <div class=\"container frame1bottom\">\n    </div>\n</div>\n";
},"useData":true});
templates['slides/slide_partials/frame1full'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "\n    <div class=\"frame1full\">\n    </div>\n";
},"useData":true});
templates['slides/slide_partials/fullscreen1'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class='fullscreen1'></div>\n";
},"useData":true});
templates['slides/slide_partials/fullscreen2'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"frame2\">\n    <div class=\"framecorner top-left\"></div>\n    <div class=\"top\"></div>\n    <div class=\"framecorner top-right\"></div>\n    <div class=\"left\"></div>\n    <div class=\"center\"></div>\n    <div class=\"right\"></div>\n    <div class=\"framecorner bottom-left\"></div>\n    <div class=\"bottom\"></div>\n    <div class=\"framecorner bottom-right\"></div>\n</div>\n";
},"useData":true});
templates['slides/slide_partials/stakeholder_card'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='stakeholder_card' id='stakeholder_card_"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":1,"column":51},"end":{"line":1,"column":57}}}) : helper)))
    + "'>\n    <div class='textarea'>\n        <div class='vertical-center'>\n            <div class='header'>\n                "
    + alias4(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":5,"column":16},"end":{"line":5,"column":25}}}) : helper)))
    + "\n            </div>\n        </div>\n        <div class='text action_name'>"
    + alias4(((helper = (helper = lookupProperty(helpers,"action_name") || (depth0 != null ? lookupProperty(depth0,"action_name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"action_name","hash":{},"data":data,"loc":{"start":{"line":8,"column":38},"end":{"line":8,"column":53}}}) : helper)))
    + "</div>\n        <div class='text action_desc'>"
    + alias4(((helper = (helper = lookupProperty(helpers,"action_desc") || (depth0 != null ? lookupProperty(depth0,"action_desc") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"action_desc","hash":{},"data":data,"loc":{"start":{"line":9,"column":38},"end":{"line":9,"column":53}}}) : helper)))
    + "</div>\n        <div class='text vote'>"
    + alias4(((helper = (helper = lookupProperty(helpers,"vote") || (depth0 != null ? lookupProperty(depth0,"vote") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"vote","hash":{},"data":data,"loc":{"start":{"line":10,"column":31},"end":{"line":10,"column":39}}}) : helper)))
    + "</div>\n    </div>\n    <div class='background'>\n        <?xml version=\"1.0\" encoding=\"UTF-8\"?>\n        <svg class='card_bg' data-name='card_bg_"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":14,"column":48},"end":{"line":14,"column":54}}}) : helper)))
    + "' xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 503.54 398.18\">\n          <defs>\n            <style>\n                .cls-1-"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":17,"column":23},"end":{"line":17,"column":29}}}) : helper)))
    + " {\n                  fill: "
    + alias4(((helper = (helper = lookupProperty(helpers,"displayColour") || (depth0 != null ? lookupProperty(depth0,"displayColour") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"displayColour","hash":{},"data":data,"loc":{"start":{"line":18,"column":24},"end":{"line":18,"column":41}}}) : helper)))
    + ";\n              }\n\n                .cls-1-"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":21,"column":23},"end":{"line":21,"column":29}}}) : helper)))
    + ", .cls-2, .cls-3 {\n                stroke-width: 0px;\n              }\n\n              .cls-4 {\n                font-size: 38.14px;\n              }\n\n              .cls-4, .cls-5, .cls-6 {\n                font-family: ArialMT, Arial;\n              }\n\n              .cls-4, .cls-5, .cls-6, .cls-2, .cls-7 {\n                fill: #fff;\n              }\n\n              .cls-5 {\n                font-size: 24.95px;\n              }\n\n              .cls-8 {\n                fill: #5b7936;\n                stroke-width: 1.42px;\n              }\n\n              .cls-8, .cls-9 {\n                stroke: #fff;\n                stroke-linecap: round;\n                stroke-miterlimit: 10;\n              }\n\n              .cls-6 {\n                font-size: 19.96px;\n              }\n\n              .cls-9 {\n                fill: none;\n                stroke-width: 1.7px;\n              }\n\n              .cls-7 {\n                font-family: Arial-BoldMT, Arial;\n                font-size: 29.94px;\n                font-weight: 700;\n              }\n\n              .cls-3 {\n                fill: #80d2e7;\n              }\n\n              .cls-10 {\n                letter-spacing: -.07em;\n              }\n            </style>\n          </defs>\n          <polygon class=\"cls-1-"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":76,"column":32},"end":{"line":76,"column":38}}}) : helper)))
    + "\" points=\"497.34 118.71 3.08 118.71 3.08 1.93 485.34 .93 503.34 18.84 503.34 57.79 497.34 62.99 497.34 118.71\"/>\n          <path class=\"cls-3\" d=\"m503.34,394.99H214.78l-4.66-6.8h-123.31l-4.66,6.8H.19V.19h484.85l18.31,18.26v40.33l-5.65,4.65v305.12l5.65,4.65v21.79Zm-287.81-1.41h286.4v-19.72l-5.65-4.65V62.77l5.65-4.65V19.04l-17.48-17.43H1.61v391.98h79.8l4.66-6.8h124.8l4.66,6.8Z\"/>\n          <g>\n            <path class=\"cls-2\" d=\"m104.53,66.84c0-2.09-.02-4.18-.06-6.27-.01-.51.06-.94.5-1.27.15-.11.26-.29.37-.45,1.24-1.66,1.96-3.55,2.43-5.55.21-.86.35-1.73.53-2.61.94.2,1.47-.3,1.84-1.06.17-.35.32-.72.38-1.1.15-.91.3-1.83.36-2.75.08-1.22.15-2.45.11-3.67-.04-1.05-.34-1.31-1.33-1.57.15-1.23.31-2.46.44-3.69.18-1.78.37-3.56.05-5.34-.63-3.49-2.27-6.37-5.27-8.33-2.62-1.72-5.45-2.62-8.47-2.65v-.63c3.11.03,6.08.95,8.82,2.75,2.98,1.96,4.85,4.9,5.54,8.75.34,1.88.15,3.73-.04,5.52-.09.86-.19,1.73-.3,2.57-.03.2-.05.4-.07.6.8.3,1.23.8,1.27,2,.04,1.26-.03,2.54-.11,3.73-.07.99-.23,1.98-.37,2.82-.08.49-.28.93-.44,1.27-.52,1.08-1.24,1.42-1.89,1.46-.02.09-.04.18-.05.27-.11.59-.23,1.21-.37,1.81-.57,2.38-1.37,4.22-2.54,5.78l-.07.09c-.11.15-.24.34-.44.49-.17.13-.25.26-.24.74.03,1.85.05,3.82.06,6.2l2.53,1.12c1.9.84,3.85,1.71,5.78,2.55,1.78.77,3.69,1.57,5.68,2.04.29.07.59.12.91.17.38.07.78.13,1.18.24,5.76,1.56,9.74,4.61,12.15,9.34,1.47,2.88,2.4,6.07,2.75,9.49.07.64.14,1.29.14,1.95,0,.26-.01.52-.04.78-.16,1.65-1.19,2.67-2.91,2.88-.44.05-.87.08-1.3.08h-35.64v-.64c11.88,0,23.76,0,35.64,0,.41,0,.81-.03,1.22-.08,1.37-.17,2.22-.93,2.35-2.31.08-.86-.01-1.74-.1-2.61-.34-3.25-1.2-6.35-2.69-9.26-2.49-4.86-6.59-7.62-11.75-9.02-.68-.18-1.39-.25-2.07-.41-2-.48-3.9-1.27-5.78-2.08-2.78-1.2-5.54-2.44-8.31-3.67-.23-.1-.38-.2-.38-.51Z\"/>\n            <path class=\"cls-2\" d=\"m104.76,58.59s.06-.07.08-.11c1.06-1.42,1.8-3.11,2.32-5.32.14-.57.25-1.15.36-1.75.05-.28.11-.56.16-.84l.13-.64.64.14c.45.09.77.01,1.12-.71.12-.24.27-.6.33-.93.14-.81.29-1.75.35-2.68.08-1.16.15-2.4.11-3.6-.03-.71-.07-.77-.85-.97l-.54-.14.07-.56c.04-.38.09-.76.14-1.13.1-.84.21-1.7.29-2.54.17-1.7.36-3.46.05-5.16-.63-3.49-2.31-6.15-4.99-7.91-2.53-1.66-5.26-2.52-8.12-2.54v-.64c3.02.03,5.85.93,8.47,2.65,2.99,1.96,4.63,4.84,5.27,8.33.32,1.78.14,3.56-.05,5.34-.13,1.23-.29,2.46-.44,3.69,1,.25,1.3.51,1.33,1.57.04,1.22-.02,2.45-.11,3.67-.06.92-.21,1.84-.36,2.75-.06.38-.22.76-.38,1.1-.36.76-.9,1.27-1.84,1.06-.17.88-.32,1.75-.53,2.61-.47,2-1.19,3.89-2.43,5.55-.12.16-.22.34-.37.45-.44.33-.51.76-.5,1.27.04,2.09.06,4.18.06,6.27,0,.3.16.41.38.51,2.77,1.22,5.53,2.46,8.31,3.67,1.88.81,3.78,1.6,5.78,2.08.68.16,1.4.23,2.07.41,5.15,1.4,9.26,4.15,11.75,9.02,1.49,2.92,2.35,6.01,2.69,9.26.09.87.18,1.75.1,2.61-.13,1.37-.98,2.14-2.35,2.31-.41.05-.81.08-1.22.08-11.87,0-23.76,0-35.64,0v-.64h35.64c.37,0,.75-.03,1.14-.07,1.11-.14,1.69-.71,1.79-1.74.08-.8-.01-1.65-.1-2.48-.34-3.26-1.22-6.3-2.62-9.03-2.24-4.39-5.96-7.23-11.35-8.69-.34-.09-.69-.15-1.06-.22-.32-.06-.66-.12-.99-.19-2.09-.5-4.05-1.32-5.89-2.11-1.94-.84-3.9-1.71-5.79-2.55l-2.53-1.12c-.18-.08-.76-.34-.76-1.09,0-2.41-.03-4.39-.06-6.25-.01-.6.07-1.29.76-1.79.04-.03.11-.13.16-.2Z\"/>\n            <path class=\"cls-2\" d=\"m96.42,96.15v.64h-.64V20.56c.22,0,.43-.01.64-.01v75.6Z\"/>\n            <path class=\"cls-2\" d=\"m96.42,19.9v.02c-.22-.01-.43,0-.65,0l.65-.02Z\"/>\n            <path class=\"cls-2\" d=\"m95.77,19.92c.22,0,.43-.01.65,0v.63c-.22,0-.43,0-.64.01v76.23h.64v.64h-1.28V19.95c.21-.02.41-.03.62-.03h.02Z\"/>\n            <path class=\"cls-2\" d=\"m95.14,19.94l.62-.02c-.21,0-.41.02-.62.03h0Z\"/>\n            <path class=\"cls-2\" d=\"m77.42,72.23c-1.63.71-3.55,1.49-5.61,1.76-1.42.18-2.83.6-4.43,1.3-2.97,1.3-5.24,3.14-6.93,5.62-1.49,2.2-2.55,4.71-3.22,7.67-.48,2.12-.71,3.87-.68,5.5.01,1.06.54,1.71,1.59,1.92.41.09.88.13,1.38.13,11.87,0,23.75,0,35.62,0v1.28c-11.87,0-23.74,0-35.62,0-.59,0-1.15-.05-1.65-.15-1.64-.34-2.59-1.49-2.61-3.16-.02-1.74.21-3.59.72-5.81.71-3.12,1.83-5.77,3.41-8.1,1.83-2.69,4.27-4.68,7.47-6.08,1.72-.75,3.24-1.19,4.78-1.39,1.89-.25,3.71-.99,5.27-1.67,2-.87,4.03-1.78,5.99-2.65,1.16-.52,2.33-1.04,3.49-1.55v-.05c.01-1.3.02-2.6.04-3.9.01-.92.02-1.84.03-2.76-1.32-1.35-2.26-3.08-2.95-5.44-.23-.8-.39-1.61-.55-2.4-.06-.3-.12-.6-.18-.9-.58-.02-1.22-.28-1.73-1.1-.47-.76-.74-1.65-.84-2.81-.15-1.65-.26-3.11-.33-4.46-.03-.51.06-1.01.14-1.44.16-.81.53-1.28,1.21-1.5l-.03-.22c-.08-.6-.16-1.22-.21-1.84-.03-.39-.06-.78-.09-1.17-.11-1.31-.22-2.66-.18-4,.07-2.49,1.02-4.81,2.92-7.11,2.59-3.13,6.02-5.03,10.18-5.65.24-.04.47-.06,1.33-.15v1.28c-.38.03-.76.07-1.14.13-1.92.28-3.67.86-5.24,1.73-1.56.87-2.95,2.02-4.14,3.47-1.71,2.06-2.57,4.13-2.63,6.32-.04,1.28.07,2.59.18,3.87l.09,1.18c.04.59.12,1.19.2,1.77.04.27.07.55.11.82l.08.65-.66.06c-.56.05-.63.15-.72.6-.07.35-.14.76-.12,1.12.07,1.34.18,2.78.33,4.43.08.95.29,1.66.66,2.25.32.51.62.56,1.01.47l.64-.15.16.8c.02.09.03.17.05.25.07.35.14.71.22,1.06.15.76.31,1.55.52,2.29.64,2.19,1.5,3.76,2.7,4.96.28.28.31.68.31.84-.01.92-.02,1.84-.03,2.77-.02,1.29-.03,2.59-.04,3.89,0,.22,0,.88-.75,1.21-1.17.51-2.33,1.03-3.49,1.55-1.96.88-4,1.79-6,2.66Z\"/>\n          </g>\n          <text class=\"cls-5\" transform=\"translate(157.87 176.03)\"><tspan x=\"0\" y=\"0\"></tspan></text>\n          <text class=\"cls-7\" transform=\"translate(208.56 74.99)\"><tspan class=\"cls-10\" x=\"0\" y=\"0\"></tspan></text>\n          <text class=\"cls-6\" transform=\"translate(85.82 206.25)\"><tspan x=\"0\" y=\"0\"></tspan></text>\n          <text class=\"cls-4\" transform=\"translate(271.03 354.88)\"><tspan x=\"0\" y=\"0\"></tspan></text>\n          <g>\n            <line class=\"cls-9\" x1=\"236.27\" y1=\"358.46\" x2=\"236.27\" y2=\"341.52\"/>\n            <path class=\"cls-8\" d=\"m211.36,327.68h16.09c4.67,0,8.47,3.8,8.47,8.47v5.93h-16.09c-4.67,0-8.47-3.8-8.47-8.47v-5.93h0Z\" transform=\"translate(447.29 669.76) rotate(180)\"/>\n            <path class=\"cls-8\" d=\"m245.85,327.68h15.04v4.88c0,5.25-4.27,9.52-9.52,9.52h-15.04v-4.88c0-5.25,4.27-9.52,9.52-9.52Z\"/>\n          </g>\n        </svg>\n    </div>\n</div>\n";
},"useData":true});
templates['slides/slide_partials/stakeholder_card2'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='stakeholder_card' id='stakeholder_card_"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":1,"column":51},"end":{"line":1,"column":57}}}) : helper)))
    + "'>\n    <div class='textarea'>\n        <div class='vertical-center'>\n            <div class='header'>\n                "
    + alias4(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data,"loc":{"start":{"line":5,"column":16},"end":{"line":5,"column":25}}}) : helper)))
    + "\n            </div>\n        </div>\n        <div class='scorebox' id='st"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":8,"column":36},"end":{"line":8,"column":42}}}) : helper)))
    + "_v1'><span class='scoreboxsrc'></span><span class='scoreboxval'></span></div>\n        <div class='scorebox' id='st"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":9,"column":36},"end":{"line":9,"column":42}}}) : helper)))
    + "_v2'><span class='scoreboxsrc'></span><span class='scoreboxval'></span></div>\n        <div class='scorebox' id='st"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":10,"column":36},"end":{"line":10,"column":42}}}) : helper)))
    + "_v3'><span class='scoreboxsrc'></span><span class='scoreboxval'></span></div>\n        <div class='scorebox' id='st"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":11,"column":36},"end":{"line":11,"column":42}}}) : helper)))
    + "_v4'><span class='scoreboxsrc'></span><span class='scoreboxval'></span></div>\n        <div class='scorebox' id='st"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":12,"column":36},"end":{"line":12,"column":42}}}) : helper)))
    + "_v5'><span class='scoreboxsrc'></span><span class='scoreboxval'></span></div>\n        <div class='scorebox' id='pv"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":13,"column":36},"end":{"line":13,"column":42}}}) : helper)))
    + "_v1'><span class='scoreboxsrc'></span><span class='scoreboxval'></span></div>\n        <div class='scorebox' id='pv"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":14,"column":36},"end":{"line":14,"column":42}}}) : helper)))
    + "_v2'><span class='scoreboxsrc'></span><span class='scoreboxval'></span></div>\n        <div class='scorebox subtotal' id='st"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":15,"column":45},"end":{"line":15,"column":51}}}) : helper)))
    + "_vtotal'><span class='scoreboxsrc'></span><span class='scoreboxval'></span></div>\n        <div class='scorebox subtotal' id='pv"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":16,"column":45},"end":{"line":16,"column":51}}}) : helper)))
    + "_vtotal'><span class='scoreboxsrc'></span><span class='scoreboxval'></span></div>\n        <div class='scorebox total' id='score"
    + alias4(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data,"loc":{"start":{"line":17,"column":45},"end":{"line":17,"column":51}}}) : helper)))
    + "'><span class='scoreboxsrc'></span><span class='scoreboxval'></span></div>\n    </div>\n</div>\n";
},"useData":true});
})();
