XML3D.shaders.register("gaussianBlurX", {
    vertex: [
        "attribute vec3 position;",

        "void main(void) {",
        "   gl_Position = vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "uniform sampler2D RTScene;",
        "uniform vec2 canvasSize;",
        "uniform vec2 blurOffset;",

        "const float blurSize = 1.0/512.0;",

        "void main(void) {",
        "vec2 texcoord = (gl_FragCoord.xy / canvasSize.xy);",
        "vec4 sum = vec4(0.0);",
        "sum += texture2D(RTScene, vec2(texcoord.x - 4.0*blurSize, texcoord.y)) * 0.05;",
        "sum += texture2D(RTScene, vec2(texcoord.x - 3.0*blurSize, texcoord.y)) * 0.09;",
        "sum += texture2D(RTScene, vec2(texcoord.x - 2.0*blurSize, texcoord.y)) * 0.12;",
        "sum += texture2D(RTScene, vec2(texcoord.x - blurSize, texcoord.y)) * 0.15;",
        "sum += texture2D(RTScene, vec2(texcoord.x, texcoord.y)) * 0.16;",
        "sum += texture2D(RTScene, vec2(texcoord.x + blurSize, texcoord.y)) * 0.15;",
        "sum += texture2D(RTScene, vec2(texcoord.x + 2.0*blurSize, texcoord.y)) * 0.12;",
        "sum += texture2D(RTScene, vec2(texcoord.x + 3.0*blurSize, texcoord.y)) * 0.09;",
        "sum += texture2D(RTScene, vec2(texcoord.x + 4.0*blurSize, texcoord.y)) * 0.05;",
        "gl_FragColor = sum;",
        "}"
    ].join("\n"),

    uniforms: {
        canvasSize: [512, 512],
        blurOffset: [1.0, 1.0]
    },

    samplers: {
        RTScene: null
    }
});

XML3D.shaders.register("gaussianBlurY", {
    vertex: [
        "attribute vec3 position;",

        "void main(void) {",
        "   gl_Position = vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "uniform sampler2D RTBlurH;",
        "uniform vec2 canvasSize;",
        "uniform vec2 blurOffset;",

        "const float blurSize = 1.0/512.0;",

        "void main(void) {",
        "vec2 texcoord = (gl_FragCoord.xy / canvasSize.xy);",
        "vec4 sum = vec4(0.0);",
        "sum += texture2D(RTBlurH, vec2(texcoord.x , texcoord.y- 4.0*blurSize)) * 0.05;",
        "sum += texture2D(RTBlurH, vec2(texcoord.x , texcoord.y- 3.0*blurSize)) * 0.09;",
        "sum += texture2D(RTBlurH, vec2(texcoord.x , texcoord.y- 2.0*blurSize)) * 0.12;",
        "sum += texture2D(RTBlurH, vec2(texcoord.x , texcoord.y- blurSize)) * 0.15;",
        "sum += texture2D(RTBlurH, vec2(texcoord.x, texcoord.y)) * 0.16;",
        "sum += texture2D(RTBlurH, vec2(texcoord.x, texcoord.y + blurSize)) * 0.15;",
        "sum += texture2D(RTBlurH, vec2(texcoord.x , texcoord.y+ 2.0*blurSize)) * 0.12;",
        "sum += texture2D(RTBlurH, vec2(texcoord.x , texcoord.y+ 3.0*blurSize)) * 0.09;",
        "sum += texture2D(RTBlurH, vec2(texcoord.x , texcoord.y+ 4.0*blurSize)) * 0.05;",
        "gl_FragColor = sum;",
        "}"
    ].join("\n"),

    uniforms: {
        canvasSize: [512, 512],
        blurOffset: [1.0, 1.0]
    },

    samplers: {
        RTBlurH: null
    }
});