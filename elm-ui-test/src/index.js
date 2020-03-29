import { Elm } from './Main.elm';
import { Visualizer } from './visualizer';


let visualizer = new Visualizer('canvas-container', 'stats-container', timeCB, loopCB);


// Elm-Visualization State
let isPaused = true;
let time = 0;
let timeEnd = 0;


function timeCB(newTime) {
    time = newTime;
}


function loopCB() {
    time = 0;
    visualizer.enable();
    togglePlayPause();
}


function dataReady(files) {
    const jsonData = files[0];
    // this.animationAvailable = true;
    // this.displayDropzone = false;
    // this.isPlaying = false;
    // this.playbackSpeed = 1;
    timeEnd = (jsonData.frames.length - 1) * jsonData.timeStep;
    time = 0;
    // this.hideSettings();
    visualizer.reset();
    visualizer.loadAnimation(jsonData);
    visualizer.start();
    // this.updateObjects();
}


function loadLogFromURL(urlRef) {
    fetch(urlRef).then(res => res.json()).then(async (data) => {
        dataReady([data]);
        // .then(() => {
        // updateControls();
        // });
    }).catch((error) => {
        console.log('An error occurred while fetching the log file: ' + error);
    });
}

// Search URL parameters as source of data
const searchParams = new URLSearchParams(window.location.search);

if (searchParams.has('log')) {
    const urlPath = searchParams.get('log');
    if (urlPath.includes('http')) {
        loadLogFromURL(urlPath);
    } else {
        console.log('Invalid log url.');
    }
}


var app = Elm.Main.init({
    node: document.getElementById('elm')
});

app.ports.portIsPaused.subscribe(function (isPaused) {
    isPaused === true ? visualizer.pause() : visualizer.play();
});



//         // // simplified on three.js/examples/webgl_loader_gltf2.html
//         // function main() {
//         //     // renderer
//         //     const renderer = new THREE.WebGLRenderer({ antialias: true });
//         //     renderer.setSize(800, 600);
//         //     renderer.setClearColor('gray');
//         //     document.getElementById("container").appendChild(renderer.domElement);

//         //     // camera
//         //     const camera = new THREE.PerspectiveCamera(30, 800 / 600, 1, 10000);
//         //     camera.position.set(30, 10, 70); // settings in `sceneList` "Monster"
//         //     camera.up.set(0, 1, 0);
//         //     camera.lookAt(new THREE.Vector3(0, 0, 0));

//         //     // scene and lights
//         //     const scene = new THREE.Scene();
//         //     scene.add(new THREE.AmbientLight(0xcccccc));

//         //     // load gltf model and texture
//         //     const objs = [];
//         //     const loader = new THREE.GLTFLoader();
//         //     loader.load("./z-Monster.gltf", gltf => {
//         //         // model is a THREE.Group (THREE.Object3D)
//         //         const mixer = new THREE.AnimationMixer(gltf.scene);
//         //         // animations is a list of THREE.AnimationClip
//         //         for (const anim of gltf.animations) {
//         //             mixer.clipAction(anim);//.play();
//         //         }
//         //         // settings in `sceneList` "Monster"
//         //         gltf.scene.scale.set(0.4, 0.4, 0.4);
//         //         gltf.scene.rotation.copy(new THREE.Euler(0, -3 * Math.PI / 4, 0));
//         //         gltf.scene.position.set(2, 1, 0);

//         //         scene.add(gltf.scene);
//         //         objs.push({ gltf, mixer });
//         //     }, xhr => {
//         //         // called while loading is progressing
//         //         console.log((xhr.loaded / xhr.total * 100) + '% loaded');
//         //     }, error => {
//         //         // called when loading has errors
//         //         console.log('An error happened');
//         //         console.log(error);
//         //     });

//         //     // animation rendering
//         //     const clock = new THREE.Clock();
//         //     (function animate() {
//         //         if (isPaused == false) {
//         //             objs.forEach(({ mixer }) => { mixer.update(clock.getDelta()); });
//         //         }
//         //         renderer.render(scene, camera);
//         //         requestAnimationFrame(animate);
//         //     })();
//         //     return objs;
//         // }
//         // const objs = main();
