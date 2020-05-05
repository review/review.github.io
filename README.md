# Review

Example of using review:

https://review.github.io/?log=https://raw.githubusercontent.com/review/review.github.io/master/examples/simple-sphere.json

Link to all examples found in the examples directory:

- [multiple-shapes](https://review.github.io/?log=https://raw.githubusercontent.com/review/review.github.io/master/examples/multiple-shapes.json)
- [quadruped-gallop](https://review.github.io/?log=https://raw.githubusercontent.com/review/review.github.io/master/examples/quadruped-gallop.json)
- [quadruped-hop](https://review.github.io/?log=https://raw.githubusercontent.com/review/review.github.io/master/examples/quadruped-hop.json)
- [simple-sphere](https://review.github.io/?log=https://raw.githubusercontent.com/review/review.github.io/master/examples/simple-sphere.json)
- [worm-hop](https://review.github.io/?log=https://raw.githubusercontent.com/review/review.github.io/master/examples/worm-hop.json)
- [worm-tumble](https://review.github.io/?log=https://raw.githubusercontent.com/review/review.github.io/master/examples/worm-tumble.json)
- [autonomous-vehicle](https://review.github.io/?log=https://raw.githubusercontent.com/anthonyjclark/adabot02-ann/master/animations/fsm-40-2-best20.json)


## Review Log-File Schema

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Review Log-File",
    "description": "A visualization of meshes evolving through time.",
    "type": "object",
    "properties": {
        "name": {
            "description": "A unique name for this animation.",
            "type": "string"
        },
        "timeStep": {
            "description": "Time elapsing between frames.",
            "type": "number",
            "exclusiveMinimum": 0
        },
        "objects": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {
                        "description": "A unique identifier for a single object.",
                        "type": "string"
                    },
                    "mesh": {
                        "description": "Specify the object mesh (primitives only for now).",
                        "type": "string",
                        "enum": ["cube", "cylinder", "sphere"]
                    }
                },
                "required": ["name", "mesh"]
            },
            "minItems": 1
        },
        "frames": {
            "type": "array",
            "items": {
                "type": "object",
            },
            "minItems": 1
        }
    },
    "required": ["name", "timeStep", "objects", "frames"]
}
```

## Development

~~~bash
# Development
parcel index.html

# Building for production
rm -rf dist *.js *.map *.html
parcel build index.html
cp dist/* .
~~~

## Tasks

- cleanup
  - https://threejs.org/docs/#manual/en/introduction/Import-via-modules
  - change example urls
- visualizer features
  - light vs dark view
  - handle material depth https://stackoverflow.com/questions/15994944/transparent-objects-in-threejs
  - single face materials (cutaway like down a hallway)
  - material.isShadowMaterial
  - shared material
- capabilities
  - z-Monster.gltf as example for meshes and binary
    - handle multiple files
  - update GLTF abilities
- [tools](https://github.com/KhronosGroup/glTF/blob/master/README.md)
  - convert to binary
  - improve schema
    - frames (object names, t/r/s, require presence of non-static items)
    - objects (scale, material (color, roughness, metallic), static, translation, rotation)
  - add id to use in place of name for lookup in frames
