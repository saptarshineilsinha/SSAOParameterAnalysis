XML3D.shaders.register("render-depth", {
    vertex: [
        "attribute vec3 position;",
        "varying vec4 worldPosition;",
        "uniform mat4 modelMatrix;",
        "uniform mat4 modelViewProjectionMatrix;",


        "void main(void) {",
        "   worldPosition = modelMatrix * vec4(position, 1.0);",
        "   gl_Position   = modelViewProjectionMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "varying vec4 worldPosition;",
        "uniform mat4 viewMatrix;",
        "uniform float near, far;",
        "float cameraFarPlusNear = far + near;",
        "float cameraFarMinusNear =far - near;",
        "float cameraCoef = near;",


        "float linearDepth(float d) {",
        "return cameraCoef / (cameraFarPlusNear - (d * cameraFarMinusNear));",
        "}",


        "void main(void) {",
        "float ld=linearDepth(gl_FragCoord.z);",
        "float ndcDepth=(2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) /(gl_DepthRange.far - gl_DepthRange.near);",
        "float clipDepth = ndcDepth / gl_FragCoord.w;",
//        "gl_FragColor = vec4((clipDepth * 0.5) + 0.5); ",
        "gl_FragColor = vec4(gl_FragCoord.z);",
        "}"
    ].join("\n"),

    uniforms: {
        far: 10000,
        near: 0.1
    }
});