document.addEventListener('DOMContentLoaded', function () {

    // templateStore maintains copies of each fetched template so they can be retrieved without querying the server
    const templateStore = {};

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
                    //                    console.log('A child node has been added or removed');
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
    const procVal = (v) => {
        // process values into numbers, booleans etc
        if (!isNaN(parseInt(v))) {
            v = parseInt(v);
        } else if (v === 'true') {
            v = true;
        } else if (v === 'false') {
            v = false;
        }
        return v;
    }
    const getTemplatev1 = (temp, ob, cb) => {
        // returns a compiled template, but does not render it
        fetch(`/getTemplate?template=${temp}&data=${JSON.stringify(ob)}`)
            .then(response => response.text())
            .then(compiledTemplate => {
                const template = compiledTemplate;
                if (cb) {
                    cb(template);
                }
            })
            .catch(error => {
                console.error('Error fetching or rendering template:', error);
            });
    };
    const getTemplateV2 = (temp, ob, cb) => {
        // returns a compiled template, but does not render it
        fetch(`/getTemplate?template=${temp}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ob)
            })
            .then(response => response.text())
            .then(compiledTemplate => {
                const template = compiledTemplate;
                if (cb) {
                    cb(compiledTemplate);
                }
            })
            .catch(error => {
                console.error('Error fetching or rendering template:', error);
            });
    };
    const getTemplate = (temp, ob, cb) => {
        // returns a compiled template, but does not render it
        if (templateStore.hasOwnProperty(temp)) {
            // template exists in the store, return that
            const uncompiledTemplate = templateStore[temp];
            if (cb) {
                cb(uncompiledTemplate);
            }
        } else {
            // new template request, fetch from the server
            fetch(`/getTemplate?template=${temp}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ob)
                })
                .then(response => response.text())
                .then(uncompiledTemplate => {
//                    const template = uncompiledTemplate;
                    templateStore[temp] = uncompiledTemplate;
                    if (cb) {
                        cb(uncompiledTemplate);
                    }
                })
                .catch(error => {
                    console.error('Error fetching or rendering template:', error);
                });
        }
    };
    const getPartials = () => {
        // Client-side code
//        console.log(`getPartials`);
        fetch('/partials')
            .then(response => response.json())
            .then(data => {
                const partials = data.partials;
//                console.log('partials');
//                console.log(partials);
                (async () => {
//                    console.log(`the async`)
                    for (const name in partials) {
                        const part = await Handlebars.compile(partials[name]);
                        Handlebars.registerPartial(name, part);
//                        console.log(part);
//                        console.log(`Handlebars.partials:`);
//                        console.log(JSON.parse(JSON.stringify(Handlebars.partials)));
                    }

                })();

                // Now the partials are registered and ready to use
            })
            .catch(error => {
                console.error('Error fetching partials:', error);
            });

    };
    const renderTemplateV1 = (targ, temp, ob, cb) => {
        console.log(`renderTemplate, targ: ${targ}, temp: ${temp}`);
//        console.log(JSON.stringify(ob));
        if (ob === undefined) {
            console.error('Error: Data object is undefined');
            return;
        }
        fetch(`/getTemplate?template=${temp}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ob)
            })
            .then(response => response.text())
            .then(compiledTemplate => {
                const template = compiledTemplate;
                document.getElementById(targ).innerHTML = template;
                if (cb) {
                    cb();
                }
            })
            .catch(error => {
                console.error('Error fetching or rendering template:', error);
            });
    };

    const renderTemplate = (targ, temp, ob, cb) => {
//        getPartials()
//        console.log(`renderTemplate, targ: ${targ}, temp: ${temp}`);
//        console.log(JSON.stringify(ob));
//        console.log(ob);
//        console.log(JSON.parse(JSON.stringify(Handlebars.partials)))
        if (ob === undefined) {
            console.error('Error: Data object is undefined');
            return;
        }
        if (templateStore.hasOwnProperty(temp)) {
            // if this template has already been requested we can just serve it from the store
            const compiledTemplate = Handlebars.compile(templateStore[temp]);
//            const compiledTemplate = Handlebars.compile(uncompiledTemplate);
            document.getElementById(targ).innerHTML = compiledTemplate(ob);
//            console.log(`template returned from store: ${temp}`);
//            console.log(compiledTemplate());
            if (cb) {
                cb();
            }
        } else {
            // If this template is being requested for the first time we will have to fetch it from the server
            fetch(`/getTemplate?template=${temp}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ob)
                })
                .then(response => response.text())
                .then(uncompiledTemplate => {
//                    console.log(`template fetched from server: ${temp}`);
//                    console.log(JSON.parse(JSON.stringify(Handlebars.partials)));
                    const template = uncompiledTemplate;
//                    console.log(`template:`);
//                    console.log(template);
                    templateStore[temp] = uncompiledTemplate;
                    const compiledTemplate = Handlebars.compile(template);

//                    console.log(`compiledTemplate:`)
//                    console.log(compiledTemplate);
//                    if (temp === 'sessionCardSystem') {
//                        console.log(`compiledTemplate run:`)
//                        console.log(compiledTemplate({password: 'sjdkl'}));
//                    }
//                    console.log(`compiledTemplate run with ob:`)
//                    console.log(compiledTemplate(ob))
//                    console.log(`ob:`)
//                    console.log(ob)
                    document.getElementById(targ).innerHTML = compiledTemplate(ob);
                    if (cb) {
                        cb();
                    }
                })
                .catch(error => {
                    console.error('Error fetching or rendering template:', error);
                });
        }
    };

    const copyObjectWithExclusions = (obj, exclusions) => {
        const newObj = {};
        // Copy properties from the original object to the new object,
        // excluding properties specified in the exclusions array
        for (const key in obj) {
            if (!exclusions.includes(key)) {
                newObj[key] = obj[key];
            }
        }
        return newObj;
    }
    const setupPanel = () => {
        console.log('setupPanel')
    };
    const getQueries = (u) => {
        // return an object all query string properties in a given URL
        let qu = {};
        if (u.indexOf('?', 0) > -1) {
            let r = u.split('?')[1];
            r = r.split('&');
            r.forEach(q => {
                q = q.split('=');
                qu[q[0]] = q[1];
            });
        }
        return qu;
    };
    // NOTE: parials are currently set up each time the system admin connects, so the method call below is safe for now.
    // In case of problems getting partials, check the order of system architecture.
    getPartials();
    window.procVal = procVal;
    window.renderTemplate = renderTemplate;
    window.getTemplate = getTemplate;
    window.setupPanel = setupPanel;
    window.setupObserver = setupObserver;
    window.copyObjectWithExclusions = copyObjectWithExclusions;
    window.getQueries = getQueries;
    window.getPartials = getPartials;
});
