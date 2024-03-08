document.addEventListener('DOMContentLoaded', function () {
    // Define the setupObserver function to accept an element ID as an argument
    const setupObserver = (elementId, cb) => {
        // Select the target element based on the provided ID
        const targetNode = document.getElementById(elementId);
        // Ensure the targetNode exists before proceeding
        if (!targetNode) {
            console.error(`Element with ID '${elementId}' not found.`);
            return;
        }
        // Options for the observer (which mutations to observe)
        const config = {
            attributes: true,
            childList: true,
            subtree: true
        };
        // Callback function to execute when mutations are observed
        const callback = function (mutationsList, observer) {
            // Iterate over each mutation
            for (const mutation of mutationsList) {
                // Perform actions based on the type of mutation
                if (mutation.type === 'childList') {
                    console.log('A child node has been added or removed');
                    // Perform actions such as updating the UI, etc.
                    if (cb) {
                        cb();
                    }
                } else if (mutation.type === 'attributes') {
//                    console.log('Attributes of the target element have changed');
                    // Perform actions such as updating the UI, etc.
                }
            }
        };
        // Create a new observer instance linked to the callback function
        const observer = new MutationObserver(callback);
        // Start observing the target node for configured mutations
        observer.observe(targetNode, config);
        // Later, you can disconnect the observer when it's no longer needed
        // observer.disconnect();
    };

//    setupObserver('myTargetElement');

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
    window.setupObserver = setupObserver;
});
