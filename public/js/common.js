document.addEventListener('DOMContentLoaded', function() {
    const renderTemplate = (targ, temp, d) => {
        const tID = `template_${temp}`;
        var source = document.getElementById(tID).innerHTML;
        var template = Handlebars.compile(source);
        var html = template(d);
        document.getElementById(targ).innerHTML = html;
    };
    window.renderTemplate = renderTemplate;
});
