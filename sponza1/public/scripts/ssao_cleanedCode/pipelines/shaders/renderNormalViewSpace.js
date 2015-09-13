XML3D.shaders.register("render-normalViewSpace", {
    vertex : [
        "attribute vec3 position;",
        "attribute vec3 normal;",
        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat3 modelViewMatrixN;",

        "varying vec3 fragNormal;",

        "void main(void) {",
        "    fragNormal = modelViewMatrixN * normal;",
        "    gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment : [
        "varying vec3 fragNormal;",

        "void main(void) {",
        "   gl_FragColor = vec4((normalize(fragNormal) + 1.0) / 2.0, 1.0);",
        "}"
    ].join("\n"),

    uniforms : {}
});