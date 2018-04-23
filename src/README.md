
Current Tabs:
- https://skyronic.com/blog/vuejs-internals-computed-properties
- https://material.io/color/#!/?view.left=0&view.right=0
- https://gomakethings.com/how-to-update-a-url-without-reloading-the-page-using-vanilla-javascript/

Tasks:
- had to add  "|| material.isShadowMaterial" to gltf export (line 762)
- debounce color picker (lodash)
- watch time and update visualizer
- full screen mode
- clean up side panel (should not close when interacting with controls)
  + https://spaces.archilogic.com/explore
  + https://pissang.github.io/clay-viewer/editor/
- export button (change to icon)

Logger tasks:
- add id to use in place of name for lookup in frames
- is duration necessary?
- handle material depth https://stackoverflow.com/questions/15994944/transparent-objects-in-threejs


# Review

> An online visualizer for mechanical simulations.

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build
mv dist/index.html ..
mv dist/static ..

# build for production and view the bundle analyzer report
npm run build --report
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).



Modifications to webpack template
- [Adding Threejs extras](https://github.com/mrdoob/three.js/issues/9562)
  + ProvidePlugin
  + https://webpack.js.org/guides/shimming/#shimming-globals
  + https://gist.github.com/cecilemuller/0be98dcbb0c7efff64762919ca486a59
- Added postcss plugins to `.postcssrc.js`
