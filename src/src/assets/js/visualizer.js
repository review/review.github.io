
/**
 *
 * Visualize mechanic simulations.
 *
 * @author Anthony Clark
 *
 */

/* eslint no-param-reassign: ["error", { "props": false }] */

// TODO: teardown visualization after new log is loaded

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AxesHelper,
  Clock,
  AmbientLight,
  SpotLight,
  LightShadow,
  PlaneGeometry,
  ShadowMaterial,
  Mesh,
  GridHelper,
  AnimationMixer,
  LoopOnce, LoopRepeat,
} from 'three';

import 'three/examples/js/controls/OrbitControls';
import 'three/examples/js/loaders/GLTFLoader';
import { Stats } from './stats';
/* global THREE */

import LogToGLTF from './logToGLTF';


const DEFAULT_CAMERA_POSITION = [-8, 8, 8];
// const DEFALUT_CAMERA_LOOKAT = [-10, 0, -100];


function onWindowResize(vis) {
  return () => {
    vis.camera.aspect = window.innerWidth / window.innerHeight;
    vis.camera.updateProjectionMatrix();
    vis.renderer.setSize(window.innerWidth, window.innerHeight);
  };
}


function disposeHierarchy(node, callback) {
  for (let i = node.children.length - 1; i >= 0; i -= 1) {
    const child = node.children[i];
    disposeHierarchy(child, callback);
    callback(child);
  }
}


function disposeNode(parentObject) {
  parentObject.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      if (node.geometry) {
        node.geometry.dispose();
      }
      if (node.material) {
        let materialArray;
        if (node.material instanceof THREE.MeshFaceMaterial
          || node.material instanceof THREE.MultiMaterial) {
          materialArray = node.material.materials;
        } else if (node.material instanceof Array) {
          materialArray = node.material;
        }
        if (materialArray) {
          materialArray.forEach((mtrl) => {
            if (mtrl.map) mtrl.map.dispose();
            if (mtrl.lightMap) mtrl.lightMap.dispose();
            if (mtrl.bumpMap) mtrl.bumpMap.dispose();
            if (mtrl.normalMap) mtrl.normalMap.dispose();
            if (mtrl.specularMap) mtrl.specularMap.dispose();
            if (mtrl.envMap) mtrl.envMap.dispose();
            mtrl.dispose();
          });
        } else {
          if (node.material.map) node.material.map.dispose();
          if (node.material.lightMap) node.material.lightMap.dispose();
          if (node.material.bumpMap) node.material.bumpMap.dispose();
          if (node.material.normalMap) node.material.normalMap.dispose();
          if (node.material.specularMap) node.material.specularMap.dispose();
          if (node.material.envMap) node.material.envMap.dispose();
          node.material.dispose();
        }
      }
    }
  });
}


class Visualizer {

  constructor(containerID, statsID, timeCB, loopCB) {
    // TODO: detect stuff
    // if (!Detector.webgl) {
    //   const warning = Detector.getWebGLErrorMessage();
    //   document.getElementById(container_id).appendChild(warning);
    // }


    // Visualization state
    this.isShutdown = true;


    // TODO: pass in the actual element instead?
    const container = document.getElementById(containerID);
    const statsContainer = document.getElementById(statsID);

    // TODO: should these be passed in?
    const width = window.innerWidth;
    const height = window.innerHeight;


    this.scene = new Scene();


    this.scene.add(new AmbientLight(0xffffff));


    this.spotLight = new SpotLight(0xffffff, 1.5);
    this.spotLight.position.set(0, 15, 5);
    this.spotLight.castShadow = true;
    this.spotLight.shadow = new LightShadow(new PerspectiveCamera(60, 1, 10, 200));
    this.spotLight.shadow.bias = -0.000222;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;
    this.scene.add(this.spotLight);


    // TODO: pass in device pixel ratio?
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xffffff);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);


    // fov in degrees, aspect ratio, near clip, far clip
    this.camera = new PerspectiveCamera(60, width / height, 0.01, 100);
    this.camera.position.set(...DEFAULT_CAMERA_POSITION);


    const groundMaterial = new ShadowMaterial({ opacity: 0.8 });
    const groundGeometry = new PlaneGeometry(100, 100);
    groundGeometry.rotateX(-Math.PI / 2);
    this.ground = new Mesh(groundGeometry, groundMaterial);
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);


    this.grid = new GridHelper(100, 100);
    this.grid.material.opacity = 0.5;
    this.grid.material.transparent = true;
    this.scene.add(this.grid);


    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.target.set(...DEFALUT_CAMERA_LOOKAT);


    this.axis = new AxesHelper(50);
    this.scene.add(this.axis);


    this.loader = new THREE.GLTFLoader();


    this.clock = new Clock();


    this.stats = new Stats();
    this.stats.dom.style.cssText = 'position:relative;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
    statsContainer.appendChild(this.stats.dom);


    this.mixer = null;
    this.clips = [];
    this.actions = [];


    this.timeCB = timeCB;
    this.loopCB = loopCB;


    window.addEventListener('resize', onWindowResize(this), false);
  }


  loadAnimation(log) {
    // TODO: validate log file here
    this.objNames = log.objects.map(obj => obj.name);

    const converter = new LogToGLTF();
    const gltf = converter.convert(log);

    this.loader.parse(
      // glTF data in JSON format
      JSON.stringify(gltf, null, '  '),

      // Path to resources
      '',

      // onLoad callback function
      (data) => {
        data.scene.traverse((child) => {
          if (child.isMesh) {
            // child.material.envMap = envMap;
            child.material.needsUpdate = true;
            child.castShadow = true;
          }
        });

        this.loadedScene = data.scene;
        this.scene.add(data.scene);

        this.mixer = new AnimationMixer(data.scene);
        this.clips = data.animations;
        this.actions = this.clips.map(clip => this.mixer.clipAction(clip));

        this.actions.forEach((action) => {
          action.play();
          action.paused = true;
          // action.enabled = true;
          // action.clampWhenFinished = ...;
          // action.isRunning(); <-- read-only
          // action.startAt(mixer.time + 0.5).play();
          // action.weight = ...;
          // action.getEffectiveWeight();
          // action.setEffectiveWeight();
          // action.reset().fadeIn(0.25).play();
          // action.fadeOut(0.25).play();
          // action.timeScale = 1;
          // action.getEffectiveTimeScale();
          // action.setEffectiveTimeScale();
          // action.warp(timeScaleNow, destTimeScale, 4).play();
          // action.loop = +value;
          // action.repetitions = +value;
        });

        this.mixer.addEventListener('finished', () => {
          this.loopCB();
        });

        // data.animations; // Array<THREE.AnimationClip>
        // data.scene;      // THREE.Scene
        // data.scenes;     // Array<THREE.Scene>
        // data.cameras;    // Array<THREE.Camera>
      },

      // onError callback function
      (error) => {
        // eslint-disable-next-line
        console.error(error);
      },
    );
  }


  setTime(newTime) {
    this.actions.forEach((action) => {
      action.time = newTime;
    });
  }


  setPlaybackSpeed(newTimeScale) {
    this.actions.forEach((action) => {
      action.timeScale = newTimeScale;
    });
  }


  resetCamera() {
    this.controls.reset();
  }


  setLoop(loop) {
    const mode = loop ? LoopRepeat : LoopOnce;
    this.actions.forEach((action) => {
      action.setLoop(mode, Infinity);
    });
  }


  play() {
    this.actions.forEach((action) => {
      action.paused = false;
    });
  }


  pause() {
    this.actions.forEach((action) => {
      action.paused = true;
    });
  }


  enable() {
    this.actions.forEach((action) => {
      if (!action.enabled) action.reset();
    });
  }


  getObjectNames() {
    return this.objNames;
  }


  setObjectColor(objIdxs, color) {
    objIdxs.forEach((objI) => {
      const obj = this.scene.getObjectByName(this.objNames[objI]);
      if (obj) obj.material.color.set(color);
    });
  }

  reset() {
    this.isShutdown = true;


    if (this.loadedScene) {
      disposeHierarchy(this.loadedScene, disposeNode);
      this.scene.remove(this.loadedScene);
    }


    this.actions.forEach((action) => {
      this.mixer.uncacheAction(action);
    });


    this.clips.forEach((clip) => {
      this.mixer.uncacheClip(clip);
    });

    // mixer.uncacheRoot(root);

    this.objNames = [];
    this.actions = [];
    this.clips = [];
    this.mixer = null;
  }


  start() {
    this.isShutdown = false;

    const loop = () => {
      if (!this.isShutdown) {
        requestAnimationFrame(loop);

        this.stats.begin();

        if (this.actions.length > 0 && this.actions[0].isRunning()) {
          this.timeCB(this.actions[0].time);
        }

        if (this.mixer) this.mixer.update(this.clock.getDelta());

        this.renderer.render(this.scene, this.camera);

        this.stats.end();
      }
    };

    loop();
  }
}


export default Visualizer;
