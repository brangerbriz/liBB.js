({
  baseUrl: "./src",
  name: "../node_modules/almond/almond",
  include: ["main"],
  out: "./build/BBMod.js",
  optimize: "none",
  wrap: {
    "startFile": "src/start.frag.js",
    "endFile": "src/end.frag.js"
  }
})