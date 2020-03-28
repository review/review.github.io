
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
- [autonomous vehicle](https://review.github.io/?log=https://raw.githubusercontent.com/anthonyjclark/adabot02-ann/master/animations/fsm-40-2-best20.json)


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
                "patternProperties"
            },
            "minItems": 1
        }
    },
    "required": ["name", "timeStep", "objects", "frames"]
}
```








keyboard controls
- play/pause: space bar
- skip ahead/back: arrow keys
- increase/decrease speed: arrow keys



Add key checking and error messages
Spent a lot of time confused because I had “timestep” instead of “timeStep”
- This is allows the video to be played but with a time length of NaN and no frames seems to be played (at least no movement of objects)
Document the different types of frames.
- I see “t”, “s”, and “r” which I am assuming to be translation, shrink or scale, and rotate but I do not see these defined anywhere and I am just guessing based off of examples.
In examples, objects can be defined to be static, but this is not documented at all. Should mention the reasoning why someone would want to specify this or not.
Document about defining color and scaling the objects when defining them.


Export to sketchfab (now supports glTF)
