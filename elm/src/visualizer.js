/**
 *
 * Visualize mechanic simulations.
 *
 * @author Anthony Clark
 *
 */


// TODO: teardown visualization after new log is loaded
// TODO: look for commented code

let THREE = window.THREE;

// import {
//   THREE.Scene,
//   THREE.PerspectiveCamera,
//   THREE.WebGLRenderer,
//   THREE.AxesHelper,
//   THREE.Clock,
//   THREE.AmbientLight,
//   THREE.SpotLight,
//   THREE.LightShadow,
//   THREE.PlaneGeometry,
//   THREE.ShadowMaterial,
//   THREE.Mesh,
//   THREE.GridHelper,
//   THREE.AnimationMixer,
//   THREE.LoopOnce,
//   THREE.LoopRepeat,
// } from 'three';

// import 'three/examples/js/controls/OrbitControls';
// import 'three/examples/js/loaders/GLTFLoader';
// import 'three/examples/js/exporters/GLTFExporter';

import { LogToGLTF } from './logToGLTF';


const DEFAULT_CAMERA_POSITION = [-8, 8, 8];


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


function save(blob, filename = 'scene.gltf') {
  // https://github.com/mrdoob/three.js/blob/master/examples/misc_exporter_gltf.html

  const link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link); // Firefox workaround, see #6594

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}


export class Visualizer {

  constructor(containerID, timeCB, readyCB, endCB) {
    // TODO: detect stuff
    // if (!Detector.webgl) {
    //   const warning = Detector.getWebGLErrorMessage();
    //   document.getElementById(container_id).appendChild(warning);
    // }

    // Visualization state
    this.reset();
    this.isFollowing = false;
    this.followObject = null;


    this.gltfData = null;


    const container = document.getElementById(containerID);
    const width = window.innerWidth;
    const height = window.innerHeight;


    this.scene = new THREE.Scene();


    this.scene.add(new THREE.AmbientLight(0xffffff));


    this.spotLight = new THREE.SpotLight(0xffffff, 1.5);
    this.spotLight.position.set(0, 15, 5);
    this.spotLight.castShadow = true;
    this.spotLight.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(60, 1, 10, 200));
    this.spotLight.shadow.bias = -0.000222;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;
    this.scene.add(this.spotLight);


    // TODO: pass in device pixel ratio?
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xffffff);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);


    // fov in degrees, aspect ratio, near clip, far clip
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 100);
    this.camera.position.set(...DEFAULT_CAMERA_POSITION);


    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.8 });
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    groundGeometry.rotateX(-Math.PI / 2);
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);


    this.grid = new THREE.GridHelper(100, 100);
    this.grid.material.opacity = 0.5;
    this.grid.material.transparent = true;
    this.scene.add(this.grid);


    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableKeys = false;
    // this.controls.target.set(...DEFALUT_CAMERA_LOOKAT);


    this.axis = new THREE.AxesHelper(50);
    this.scene.add(this.axis);


    this.loader = new THREE.GLTFLoader();
    // this.exporter = new THREE.GLTFExporter();


    this.clock = new THREE.Clock();


    this.mixer = null;
    this.clips = [];
    this.actions = [];


    this.timeCB = timeCB;
    this.readyCB = readyCB;
    this.endCB = endCB;


    window.addEventListener('resize', onWindowResize(this), false);
  }


  loadAnimation(log) {

    // TODO: move this to constructor?
    const converter = new LogToGLTF();
    const gltf = converter.convert(log);
    const timeEnd = converter.getTimeEnd();
    const name = converter.getName();

    this.objNames = log.objects.map(obj => obj.name);

    // TODO: does this need to be saved?
    this.gltfData = gltf;

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

        const objectColors = new Map();
        this.scene.traverseVisible(function (node) {
          if (node instanceof THREE.Mesh) {
            objectColors.set(node.name, node.material.color.clone());
          }
        });
        this.objectColors = objectColors;

        this.mixer = new THREE.AnimationMixer(data.scene);
        this.clips = data.animations;
        this.actions = this.clips.map(clip => this.mixer.clipAction(clip));

        this.actions.forEach((action) => {
          action.play();
          action.paused = true;
          action.setLoop(THREE.LoopOnce, Infinity);
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
          this.endCB();
        });

        this.readyCB(timeEnd, name);

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


  follow(objIdx) {
    this.controls.enabled = false;
    this.isFollowing = true;
    this.followObject = this.scene.getObjectByName(this.objNames[objIdx || 0]);
    this.cameraRelativePosition = new THREE.Vector3();
    this.cameraRelativePosition.subVectors(this.followObject.position, this.camera.position);
    this.controls.target = this.followObject.position;
  }


  unFollow() {
    this.controls.target = this.followObject.position.clone();
    this.cameraRelativePosition = null;
    this.followObject = null;
    this.isFollowing = false;
    this.controls.enabled = true;
  }


  loop() {
    this.actions.forEach((action) => {
      action.setLoop(THREE.LoopRepeat, Infinity);
    });
  }

  noLoop() {
    this.actions.forEach((action) => {
      action.setLoop(THREE.LoopOnce, Infinity);
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


  // setObjectColor(objIdxs, color) {
  //   objIdxs.forEach((objI) => {
  //     const obj = this.scene.getObjectByName(this.objNames[objI]);
  //     if (obj) obj.material.color.set(color);
  //   });
  // }

  // toggleObjectVisibility(objIdxs) {
  //   objIdxs.forEach((objI) => {
  //     const obj = this.scene.getObjectByName(this.objNames[objI]);
  //     if (obj) obj.visible = !obj.visible;
  //   });
  // }

  noColor() {
    this.scene.traverseVisible(function (node) {
      if (node.isMesh && node.name !== "") {
        node.material.color.set('#FFFFFF');
      }
    });
  }

  color() {
    const objectColors = this.objectColors;
    this.scene.traverseVisible(function (node) {
      if (node.isMesh && node.name !== "") {
        node.material.color.set(objectColors.get(node.name));
      }
    });
  }

  reset() {
    this.isShutdown = true;


    if (this.loadedScene) {
      disposeHierarchy(this.loadedScene, disposeNode);
      this.scene.remove(this.loadedScene);


      this.actions.forEach((action) => {
        this.mixer.uncacheAction(action);
      });


      this.clips.forEach((clip) => {
        this.mixer.uncacheClip(clip);
      });

      // mixer.uncacheRoot(root);
    }

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

        if (this.actions.length > 0 && this.actions[0].isRunning()) {
          this.timeCB(this.actions[0].time);
        }

        if (this.mixer) {
          this.mixer.update(this.clock.getDelta());
        }

        if (this.isFollowing) {
          // this.camera.lookAt(objPos);
          this.camera.position.subVectors(this.followObject.position, this.cameraRelativePosition);
          this.controls.update();
        }

        this.renderer.render(this.scene, this.camera);
      }
    };

    loop();
  }


  downloadGltf() {
    // TODO: look at the differences below
    // this.exporter.parse(this.scene, (result) => {
    //   const text = JSON.stringify(result, null, 2);
    //   save(new Blob([text], { type: 'text/plain' }));
    // });
    save(new Blob([JSON.stringify(this.gltfData, null, 2)]));
  }
}
