XML3D.shaders.register("boxBlur", {
    vertex: [
        "attribute vec3 position;",

        "void main(void) {",
        "   gl_Position = vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "uniform sampler2D sInTexture;",
        "uniform vec2 canvasSize;",
        "uniform vec2 blurOffset;",

        "const float blurSize = 1.0/512.0;",

        "void main(void) {",
        "   vec2 texcoord = (gl_FragCoord.xy / canvasSize.xy);",
        "   vec4 sum = vec4(0.0);",
        "   float blurSizeY = blurOffset.y / canvasSize.y;",
        "   float blurSizeX = blurOffset.x / canvasSize.x;",

        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y - 1.5*blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y - 2.0*blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y - blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y + blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y + 2.0*blurSizeY));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x, texcoord.y + 1.5*blurSizeY));",

        "   sum += texture2D(sInTexture, vec2(texcoord.x - 1.5*blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x - 2.0*blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x - blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x + blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x + 2.0*blurSizeX, texcoord.y));",
        "   sum += texture2D(sInTexture, vec2(texcoord.x + 1.5*blurSizeX, texcoord.y));",

        "   gl_FragColor = sum/12.0;",
        "}"
    ].join("\n"),

    uniforms: {
        canvasSize : [512, 512],
        blurOffset : [1.0, 1.0]
    },

    samplers: {
        sInTexture : null
    }
});