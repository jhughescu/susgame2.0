document.addEventListener('DOMContentLoaded', function () {
    const targ = 'insertion';
    let gameID = null;
    let game = null;
    let videoPlayer = null;
    let autoplay = true;
    const getSessionID = () => {
        const ID = window.location.hash.replace('#', '');
        gameID = ID;
        return ID;
    };
    let socket = null;
    const estSocket = () => {
        //        console.log(`estSocket`);
        socket = io('', {
            query: {
                role: 'presentation',
                id: getSessionID()
                //            session: session
            }
        });
        socket.on('setGame', (rgame) => {
            if (rgame) {
                game = rgame;
            }
            const initSlide = game.presentation.slideData.slideList[game.presentation.currentSlide];
//            console.log(`initSlide`, initSlide);
            if (initSlide) {
                showSlide(initSlide);
            }
        });
        socket.on('gameUpdate', (game) => {

        });
        socket.on('showSlide', (slOb) => {
            showSlide(slOb);
        });
    };
    const estPanopto  = () => {
        // Loads the Panopto API script for controlling video content
        var tag = document.createElement('script');
        tag.src = "https://developers.panopto.com/scripts/embedapi.min.js"
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        console.log('Panopto API ready');
    };
    const init = () => {
        // Delay required to ensure game is started prior to init; find a better way to do this.
        setTimeout(() => {
            estPanopto();
            estSocket();
        }, 500);
    };
    const showScores = () => {
        socket.emit('getScores', `game-${game.uniqueID}`, (s) => {
            console.log(`showScores callback`);
            console.log(s);
            renderTemplate('insertion', 'slides/showscores', s);
        })
    };
    const sortByProperty = (array, property) => {
        return array.sort((a, b) => {
            // Extract the values of the specified property from each object
            const valueA = a[property];
            const valueB = b[property];

            // Compare the values and return the result
            if (valueA < valueB) {
                return -1;
            } else if (valueA > valueB) {
                return 1;
            } else {
                return 0;
            }
        });
    };
    const showValues = () => {
        socket.emit('getAllValues', `game-${game.uniqueID}`, (v) => {
            console.log(`getAllValues callback`);
            const vals = Object.assign({}, v);
            console.log(game)
            for (let i in vals) {
                vals[i].teamTitle = game.persistentData.teamsArray[vals[i].team].title;
            }
            console.log(vals)
            const valsArr = Object.values(vals);
            valsArr = sortByProperty(valsArr, 'team');
            console.log(valsArr);
            renderTemplate('insertion', 'slides/showvalues', v);
        })
    };
    const showRound1 = () => {
        socket.emit('getGame', `${game.uniqueID}`, (rgame) => {
            game = rgame;
            let s = null;
            let v = game.values;
            const t = game.persistentData.teamsArray;
            let rArr = [];
            console.log(game)
            socket.emit('getScores', `game-${game.uniqueID}`, (rs) => {
                s = rs;
                console.log(rs)
                v = sortByProperty(v, 'team');
                s = sortByProperty(s, 'src');
                v.forEach((vu, i) => {
                    const ob = {
                        team: vu.team,
                        title: t[i].title,
                        action: vu.action,
                        description: vu.description,
                        value: s[i].val,
                        teamObj: t[i]
                    }
                    rArr[i] = ob;
                    //                    console.log(ob)
                });
                renderTemplate(targ, 'slides/showround1', rArr);
            });

        });
    };
    const showVideo = (slOb) => {
        renderTemplate(targ, 'slides/video_player', slOb, () => {
            goVideo(slOb.srcRef);
            videoPlayer = $('#videoPlayer');
        });
    };
    // Panopto API code:
    var embedApi;
    function goVideo(id) {
        embedApi = new EmbedApi("player", {
            width: "100%",
            height: "100%",
            //This is the URL of your Panopto site
            serverName: "cranfield.cloud.panopto.eu",
            sessionId: id,
            videoParams: { // Optional parameters
            //interactivity parameter controls if the user sees table of contents, discussions, notes, & in-video search
                "interactivity": "none",
                "showtitle": "false",
                "hideoverlay": true,
                "showcontrols": true
            },
            events: {
                "onIframeReady": onPanoptoIframeReady,
                "onReady": onPanoptoVideoReady,
                "onStateChange": onPanoptoStateUpdate
            }
        });
    };
    let int = null;
    let count = 0;
    function onPanoptoVideoReady () {
//        console.log(`onPanoptoVideoReady`)
        embedApi.seekTo(0);
//        maxVol();
//        unmute();
        setTimeout(() => {
            maxVol();
        }, 1000);
    };
    function onPanoptoIframeReady () {
        // The iframe is ready and the video is not yet loaded (on the splash screen)
        // Load video will begin playback
//        console.log(`onPanoptoIframeReady`);
        embedApi.loadVideo();
//        embedApi.seekTo(0);
    };
    const ensurePlayback = () => {
        console.log('force it to play')
        embedApi.playVideo();
        setTimeout(ensurePlayback, 2000);
    };
    const ensureAudio = () => {
//        embedApi.unmuteVideo();
        embedApi.setVolume(1);
        setTimeout(ensureAudio, 4000);
    }
    const unmute = () => {
        embedApi.unmuteVideo();
    }
    const maxVol = () => {
        embedApi.setVolume(1);
    }
    function onPanoptoStateUpdate (state) {
        if (state === PlayerState.Ended) {
//            console.log(`we're done here`);
            if (autoplay) {
                socket.emit('gotoNextSlide', {gameID: game.uniqueID, address: game.address});
            }
        }
    };
    // End Panopto
    const showSlide = (slOb) => {
        //        console.log(slOb);
        if (slOb.type === 'video') {
            showVideo(slOb)
        } else {
            const rOb = {gameID: game.uniqueID, light: '#d1e5d177', dark: '#0d140d'};
            renderTemplate(targ, 'slides/slide_010_intro', rOb, () => {
                renderTemplate('qr', `qr/qrcode-${game.uniqueID}`, rOb, () => {

                })
            });
        }
        console.log(slOb);
    };
    init();

    renderTemplate = window.renderTemplate;
    getTemplate = window.getTemplate;
    window.showScores = showScores;
    window.showValues = showValues;
    window.showRound1 = showRound1;
    window.unmute = unmute;
    window.maxVol = maxVol;
    window.ensureAudio = ensureAudio;
//    window.videoCheck = videoCheck;
});
