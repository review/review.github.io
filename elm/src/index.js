import { Elm } from './Main.elm';
import { Visualizer } from './visualizer';


let visualizer = new Visualizer('canvas-container', timeCB, readyCB, endCB);

function timeCB(newTime) {
    app.ports.vis2UiTime.send(newTime);
}

function readyCB(timeEnd, name) {
    document.title = `Review: ${name}`;
    app.ports.vis2UiLoaded.send(timeEnd);
}

function endCB() {
    visualizer.enable();
    visualizer.pause();
    app.ports.vis2UiCommand.send('pause');
}

// Search URL parameters as source of data
const urlParams = new URLSearchParams(window.location.search);
const logParam = urlParams.get('log');

var app = Elm.Main.init({
    node: document.getElementById('elm'),
    flags: logParam || ''
});

app.ports.ui2VisCommand.subscribe(function (command) {
    visualizer[command]();
});

app.ports.ui2VisTime.subscribe(function (newTime) {
    visualizer.setTime(newTime);
});

app.ports.ui2VisSpeed.subscribe(function (newSpeed) {
    visualizer.setPlaybackSpeed(newSpeed);
});

app.ports.ui2VisData.subscribe(function (str) {

    let data;
    try {
        data = JSON.parse(str);
    }
    catch (error) {
        app.ports.vis2UiError.send('Could not parse JSON data (see console for more information).');
        console.error(error.message);
        return;
    }

    try {
        visualizer.reset();
        visualizer.loadAnimation(data);
    } catch (error) {
        app.ports.vis2UiError.send('Could not parse GLTF data (see console for more information).');
        console.error(error.message);
        return;
    }

    visualizer.start();
});


// window.addEventListener("dragover", function (e) {
//     e = e || event;
//     e.preventDefault();
// }, false);
// window.addEventListener("drop", function (e) {
//     e = e || event;
//     e.preventDefault();
// }, false);
