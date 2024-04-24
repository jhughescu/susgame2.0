// Code to load the IFrame player API code asynchronously
var tag = document.createElement('script');

tag.src = "https://developers.panopto.com/scripts/embedapi.min.js"
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// The following function creates an <iframe> and Panopto player
var embedApi;

function onPanoptoEmbedApiReady() {
    embedApi = new EmbedApi("player", {
        width: "750",
        height: "422",
        //This is the URL of your Panopto site
        serverName: "mysite.hosted.panopto.com",
        sessionId: "5cc99c54-6d3d-40b0-ab23-ab4c016124e0",
        videoParams: { // Optional parameters
            //interactivity parameter controls if the user sees table of contents, discussions, notes, & in-video search
            "interactivity": "none",
            "showtitle": "false"
        },
        events: {
            "onIframeReady": onPanoptoIframeReady,
            "onReady": onPanoptoVideoReady,
            "onStateChange": onPanoptoStateUpdate
        }
    });
}

//The API will call this function when the iframe is ready
function onPanoptoIframeReady() {
    // The iframe is ready and the video is not yet loaded (on the splash screen)
    // Load video will begin playback
    embedApi.loadVideo();
}

//The API will call this function when the video player is ready
function onPanoptoVideoReady() {
    // The video has successfully been loaded by onPanoptoIframeReady

    // Seek to 100s
    embedApi.seekTo(100);
}

//The API calls this function when a player state change happens
function onPanoptoStateUpdate(state) {
    if (state === PlayerState.Playing) {
        embedApi.setVolume(0.3);
        embedApi.setPlaybackRate(2);
    }
}
