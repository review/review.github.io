import { Elm } from './Main.elm';
import { Visualizer } from './visualizer';


let visualizer = new Visualizer('canvas-container', timeCB, readyCB, endCB);

function timeCB(newTime) {
    app.ports.vis2UiTime.send(newTime);
}

function readyCB(timeEnd) {
    app.ports.vis2UiLoaded.send(timeEnd);
}

function endCB() {
    // not looping, so reset playing values
    // time = 0; // i don't like this
    visualizer.enable();
    visualizer.pause();
    app.ports.vis2UiCommand.send("pause");
    // this.isPlaying = !this.isPlaying;
    // this.isPlaying ? this.visualizer.play() : this.visualizer.pause();
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
    // TODO: validate data (send error)
    const data = JSON.parse(str);
    visualizer.reset();
    visualizer.loadAnimation(data);
    visualizer.start();
});

