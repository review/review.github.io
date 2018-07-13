
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
