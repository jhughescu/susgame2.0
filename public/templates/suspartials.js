(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
Handlebars.partials['dragwin'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class='dragbar'>\n<div class='closer'>x</div>\n</div>\n";
},"useData":true});
Handlebars.partials['erascores'] = template({"1":function(container,depth0,helpers,partials,data) {
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
Handlebars.partials['inner'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "This is the inner\n";
},"useData":true});
Handlebars.partials['playersBasic'] = template({"1":function(container,depth0,helpers,partials,data) {
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
Handlebars.partials['publicvoices'] = template({"1":function(container,depth0,helpers,partials,data) {
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
    + "</span></div>\n    <p>(Please submit a vote for each stakeholder. Votes can be positive, negative or zero.)</p>\n    <table>\n        <tbody>\n<!--            <tr><td><b>id</b></td><td><b>title</b></td><td></td></tr>-->\n            "
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"mainTeams") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":20,"column":12},"end":{"line":20,"column":258}}})) != null ? stack1 : "")
    + "\n        </tbody>\n    </table>\n</div>\n<script>\n    setupPV();\n</script>\n";
},"useData":true});
Handlebars.partials['stactions'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "";
},"useData":true});
Handlebars.partials['stakeholder'] = template({"1":function(container,depth0,helpers,partials,data) {
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
Handlebars.partials['stakeholderV1'] = template({"1":function(container,depth0,helpers,partials,data) {
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
Handlebars.partials['stakeholderV2'] = template({"1":function(container,depth0,helpers,partials,data) {
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
Handlebars.partials['unassigned'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "Oh no, I am NOT ASSIGNED\n";
},"useData":true});
Handlebars.partials['waiting'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"header\">\n		  <h1>Welcome to your travel portal</h1>\n\n		<div class=\"header-grad-overlay\"></div>\n\n</div>\n	<!-- Main Content -->\n\n<div class=\"main-content center\">\n		<h2>Please wait, teams will be assigned shortly.</h2>\n\n</div>\n";
},"useData":true});
})();
