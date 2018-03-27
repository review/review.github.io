
/**
 *
 * Convert a Review log file to glTF.
 *
 * @author Anthony Clark
 *
 */

import { CubeMesh, SphereMesh, CylinderMesh, createStandardPrimitives } from './URIBuffers';

// https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/README.md

// TODO: export only the needed interface

const DEFAULT_COLOR = [0.9, 0.9, 0.9, 1.0];

const DEFAULT_METALLIC = 0.5;

const DEFAULT_ROUGHNESS = 0.5;

const BYTES_IN_FLOAT = 4;


function arrayEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  // TODO: arbitrary threshold
  return a.every((e, i) => Math.abs(e - b[i]) < 0.01);
}


function materialEqual(a, b) {
  if (a === b) return true;
  return arrayEqual(a.color, b.color)
    && a.metallic === b.metallic
    && a.roughness === b.roughness;
}


function linspace(a, b, count) {
  let n = count || Math.max(Math.round(b - a) + 1, 1);
  if (n < 2) return n === 1 ? [a] : [];

  const ret = Array(n);
  n -= 1;
  for (let i = n; i >= 0; i -= 1) ret[i] = ((i * b) + ((n - i) * a)) / n;
  return ret;
}


// Float32Array -> ASCII String
function float32ArrayToBase64(a) {
  // Get a Uint8Array view
  const buf = new Uint8Array(a.buffer, 0, a.length * BYTES_IN_FLOAT);

  // Convert Uint8Array to ASCII string
  let ascii = '';
  const len = buf.length;
  for (let i = 0; i < len; i += 1) {
    ascii += String.fromCharCode(buf[i]);
  }
  return btoa(ascii);
}


class LogToGLTF {

  constructor() {
    this.reset();
  }


  reset() {
    this.logObject = null;


    this.glTFObject = {
      scenes: [],
      scene: 0,
      nodes: [],
      meshes: [],
      materials: [],
      animations: [],
      accessors: [],
      bufferViews: [],
      buffers: [],
      asset: { version: '2.0' },
    };


    this.nodeIndex = 0;
    this.meshIndex = 0;
    this.materialIndex = 0;
    this.accessorIndex = 0;
    this.viewIndex = 0;
    this.bufferIndex = 0;


    this.cached = {
      meshes: [],
      materials: [],
      buffers: {},
    };


    this.dynamicNodes = [];
  }


  convert(log) {
    this.reset();

    // eslint-disable-next-line
    // console.log(log);

    // TODO loop through json objects (e.g., multiple files)
    this.logObject = log;

    this.createScenes();
    this.createAnimations();

    // console.log(this.cached);

    return this.glTFObject;
  }


  // The scene is the entry point for the description of the scene that
  // is stored in the glTF. It refers to the nodes that define the
  // scene graph.
  createScenes() {
    this.glTFObject.scenes.push({
      // Loop through each node in objects array (can be nested)
      nodes: this.logObject.objects.map(obj => this.createNode(obj)),
    });
  }


  // The node is one node in the scene graph hierarchy. It can contain a
  // transformation (e.g., rotation or translation), and it may refer to
  // further (child) nodes. Additionally, it may refer to mesh or camera
  // instances that are "attached" to the node, or to a skin that describes
  // a mesh deformation.
  createNode(obj) {
    // TODO handle children nodes

    const node = {
      mesh: this.getMeshIndex(obj.mesh, obj.material),
      name: obj.name,
    };

    if (obj.translation) node.translation = obj.translation;
    if (obj.rotation) node.rotation = obj.rotation;
    if (obj.scale) node.scale = obj.scale;
    if (!obj.static || obj.static === false) this.dynamicNodes.push(this.nodeIndex);

    this.glTFObject.nodes.push(node);

    const currentIndex = this.nodeIndex;
    this.nodeIndex += 1;
    return currentIndex;
  }


  // A mesh describes a geometric object that appears in the scene. It refers
  // to accessor objects that are used for accessing the actual geometry data,
  // and to materials that define the appearance of the object when it is
  // rendered.
  getMeshIndex(objMesh, objMaterial) {
    const { materialI, isNew } = this.getMaterialIndex(objMaterial);

    if (!isNew) {
      const meshI = this.cached.meshes.findIndex(
        mesh => objMesh === mesh.name && materialI === mesh.materialI);

      if (meshI >= 0) return meshI;
    }

    return this.createMesh(objMesh, materialI);
  }


  createMesh(objMesh, materialI) {
    this.cached.meshes.push({ name: objMesh, materialI });

    // The accessor is used as an abstract source of arbitrary data. It is used
    // by the mesh, skin, and animation, and provides the geometry data, the
    // skinning parameters and the time-dependent animation values. It refers to a
    // bufferView, which is a part of a buffer that contains the actual raw
    // binary data.

    let primitives;
    if (Object.prototype.hasOwnProperty.call(this.cached.buffers, objMesh)) {
      // Use the current buffer/view/accessor but update the material
      primitives = createStandardPrimitives(this.cached.buffers[objMesh].accessorI, materialI);
    } else {
      // Completely new mesh
      // let meshData;
      let Creator;
      if (objMesh === 'cube') {
        // meshData = new CubeMesh(this.bufferIndex, this.viewIndex,
        //    this.accessorIndex, materialI);
        Creator = CubeMesh;
      } else if (objMesh === 'sphere') {
        // meshData = new SphereMesh(this.bufferIndex, this.viewIndex,
        //    this.accessorIndex, materialI);
        Creator = SphereMesh;
      } else if (objMesh === 'cylinder') {
        // meshData = new CylinderMesh(this.bufferIndex, this.viewIndex,
        //    this.accessorIndex, materialI);
        Creator = CylinderMesh;
      } else {
        // eslint-disable-next-line
        console.warn(`Unhandled mesh type: ${objMesh}`);
        // meshData = new CubeMesh(this.bufferIndex, this.viewIndex,
        //    this.accessorIndex, materialI);
        Creator = CubeMesh;
      }

      const meshData = new Creator(this.bufferIndex, this.viewIndex, this.accessorIndex, materialI);

      Array.prototype.push.apply(this.glTFObject.buffers, meshData.buffers);
      Array.prototype.push.apply(this.glTFObject.bufferViews, meshData.views);
      Array.prototype.push.apply(this.glTFObject.accessors, meshData.accessors);

      this.cached.buffers[objMesh] = { accessorI: this.accessorIndex };

      this.bufferIndex += meshData.bufferCount;
      this.viewIndex += meshData.viewCount;
      this.accessorIndex += meshData.accessorCount;

      primitives = meshData.primitives;
    }

    // Setup mesh accessor indices
    this.glTFObject.meshes.push({ primitives });

    const currentIndex = this.meshIndex;
    this.meshIndex += 1;
    return currentIndex;
  }


  getMaterialIndex(objMaterial) {
    const material = objMaterial || {};
    if (!material.color) material.color = DEFAULT_COLOR;
    if (!material.metallic) material.metallic = DEFAULT_METALLIC;
    if (!material.roughness) material.roughness = DEFAULT_ROUGHNESS;

    // const materialI = this.cached.materials.findIndex(
    //   cachedMaterial => materialEqual(material, cachedMaterial));

    // TODO: let some objects share materials. Setting isNew to true gives every obejct
    // a unique material.

    // if (materialI >= 0) {
    //   return { materialI, isNew: true };
    // }

    return { materialI: this.createMaterial(material), isNew: true };
  }


  createMaterial(objMaterial) {
    this.cached.materials.push(objMaterial);

    this.glTFObject.materials.push({
      pbrMetallicRoughness: {
        baseColorFactor: objMaterial.color,
        metallicFactor: objMaterial.metallic,
        roughnessFactor: objMaterial.roughness,
      },
    });

    const currentIndex = this.materialIndex;
    this.materialIndex += 1;
    return currentIndex;
  }


  // An animation describes how transformations of certain nodes
  // (e.g., rotation or translation) change over time.
  createAnimations() {
    // Setup time data
    const timeEnd = this.logObject.duration;
    const timeSteps = Math.round(timeEnd / this.logObject.timeStep) + 1;
    const timeData = new Float32Array(linspace(0, timeEnd, timeSteps));
    const timeByteLength = timeData.length * BYTES_IN_FLOAT;
    const timeURI = float32ArrayToBase64(timeData);

    const timeBufferI = this.addBase64Buffer('time', timeByteLength, timeURI);
    const timeViewI = this.addView('time', timeBufferI, 0, timeByteLength);
    const timeAccessorI = this.addAccessor('time', timeViewI, timeData.length,
      'SCALAR', [0], [timeEnd]);

    // Setup TRS data for each animated node
    const animProps = [];
    this.dynamicNodes.forEach((nodeI) => {
      const name = this.logObject.objects[nodeI].name;
      const data = this.logObject.frames[0][name];
      // console.log(name, data);
      if (data.t) {
        animProps.push({
          name,
          nodeI,
          dataType: 't',
          animType: 'translation',
          valueType: 'VEC3',
          data: data.t.slice(0),
          prev: data.t.slice(0),
          min: data.t.slice(0),
          max: data.t.slice(0),
        });
      }
      if (data.r) {
        animProps.push({
          name,
          nodeI,
          dataType: 'r',
          animType: 'rotation',
          valueType: 'VEC4',
          data: data.r.slice(0),
          prev: data.r.slice(0),
          min: data.r.slice(0),
          max: data.r.slice(0),
        });
      }
      if (data.s) {
        animProps.push({
          name,
          nodeI,
          dataType: 's',
          animType: 'scale',
          valueType: 'VEC3',
          data: data.s.slice(0),
          prev: data.s.slice(0),
          min: data.s.slice(0),
          max: data.s.slice(0),
        });
      }
    });

    // console.log(this.logObject.frames.length);

    this.logObject.frames.slice(1).forEach((frame) => {
      animProps.forEach((prop, propI) => {
        // If data exists for this frame
        if (frame[prop.name] && frame[prop.name][prop.dataType]) {
          frame[prop.name][prop.dataType].forEach((value, valueI) => {
            prop.data.push(value);
            animProps[propI].prev[valueI] = value;
            animProps[propI].min[valueI] = Math.min(prop.min[valueI], value);
            animProps[propI].max[valueI] = Math.max(prop.max[valueI], value);
          });
        } else {
          // Copy from previous
          Array.prototype.push.apply(prop.data, prop.prev);
        }
      });
    });

    // Combine all animations into a single array and convert to base64
    const animArray = [].concat(...animProps.map(prop => prop.data));
    const animData = new Float32Array(animArray);
    const animByteLength = animData.length * BYTES_IN_FLOAT;
    const animURI = float32ArrayToBase64(animData);

    const animBufferI = this.addBase64Buffer('animation', animByteLength, animURI);

    // Each animation needs its only view and accessor
    let offset = 0;
    animProps.forEach((prop) => {
      const propLength = prop.data.length;
      const propCount = Math.round(propLength / prop.min.length);
      const propLengthBytes = propLength * BYTES_IN_FLOAT;
      const propName = `${prop.name}-${prop.animType}`;

      const propViewI = this.addView(propName, animBufferI, offset, propLengthBytes);
      const propAccessorI = this.addAccessor(propName, propViewI, propCount,
        prop.valueType, prop.min, prop.max);

      this.addAnimation(timeAccessorI, propAccessorI, prop.nodeI, prop.animType);

      offset += propLengthBytes;
    });
  }


  addBase64Buffer(name, byteLength, dataURI) {
    this.glTFObject.buffers.push({
      name,
      byteLength,
      uri: `data:application/octet-stream;base64,${dataURI}`,
    });

    const currentIndex = this.bufferIndex;
    this.bufferIndex += 1;
    return currentIndex;
  }


  addView(name, buffer, byteOffset, byteLength) {
    this.glTFObject.bufferViews.push({
      name,
      buffer,
      byteOffset,
      byteLength,
    });

    const currentIndex = this.viewIndex;
    this.viewIndex += 1;
    return currentIndex;
  }


  addAccessor(name, bufferView, count, type, min, max) {
    this.glTFObject.accessors.push({
      name,
      bufferView,
      byteOffset: 0,
      componentType: 5126,
      count,
      type,
      max,
      min,
    });

    const currentIndex = this.accessorIndex;
    this.accessorIndex += 1;
    return currentIndex;
  }


  addAnimation(timeAccessorI, animAccessorI, nodeI, animType) {
    this.glTFObject.animations.push({
      samplers: [{
        input: timeAccessorI,
        interpolation: 'LINEAR',
        output: animAccessorI,
      }],
      channels: [{
        sampler: 0,
        target: {
          node: nodeI,
          path: animType,
        },
      }],
    });
  }
}

// The camera defines the view configuration for rendering the scene.

// The skin defines parameters that are required for vertex skinning,
// which allows the deformation of a mesh based on the pose of a virtual
// character. The values of these parameters are obtained from an accessor.

// The material contains the parameters that define the appearance of an
// object. It usually refers to texture objects that will be applied to
// the rendered geometry.

// The texture is defined by a sampler and an image. The sampler defines
// how the texture image should be placed on the object.

export default LogToGLTF;
