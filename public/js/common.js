document.addEventListener('DOMContentLoaded', function() {
    const renderTemplate = (targ, temp, ob, cb) => {
        fetch(`/getTemplate?template=${temp}&data=${JSON.stringify(ob)}`)
            .then(response => response.text())
            .then(compiledTemplate => {
                const template = compiledTemplate;
                document.getElementById(targ).innerHTML = template;
                console.log('template loaded');
                if (cb) {
                    cb();
                }
            })
            .catch(error => {
                console.error('Error fetching or rendering template:', error);
            });
    };

    const setupPanel = () => {
        console.log('setupPanel')
    };
    window.renderTemplate = renderTemplate;
    window.setupPanel = setupPanel;
});
