//http://www.gamedev.net/page/resources/_/technical/graphics-programming-and-theory/a-simple-and-practical-approach-to-ssao-r2753
XML3D.shaders.register("ssaoXml3D", {
    vertex: [
        "attribute vec2 position;",

        "void main(void) {",
        "    gl_Position = vec4(position, 0.0, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",

        "uniform vec2 canvasSize;",
        "uniform sampler2D sPositionTex;",
        "uniform sampler2D sNormalTex;",
        "uniform sampler2D sRandomNormals;",
        "uniform vec2 uRandomTexSize;",
        "uniform float uSampleRadius;",
        "uniform float uScale;",
        "uniform float uBias;",
        "uniform float uIntensity;",
        "uniform vec2 uConstVectors[4];",
        "uniform mat4 viewMatrix;",

        "vec3 getPosition(vec2 uv) {",
        "return texture2D(sPositionTex, uv).xyz;",
        "}",

        "float calcAmbientOcclusion(vec2 screenUV, vec2 uvOffset, vec3 origin, vec3 cnorm) {",
        "   vec3 diff = getPosition(screenUV + uvOffset) - origin;",
        "   vec3 v = normalize(diff);",
        "   float dist = length(diff) * uScale;",
        "   return max(0.0, dot(cnorm, v) - uBias) * (1.0/(1.0 + dist)) * uIntensity;",
        "}",

        "void main(void) {",
        "   vec2 screenUV = gl_FragCoord.xy / canvasSize.xy;",
        "   vec2 rand = normalize(texture2D(sRandomNormals, gl_FragCoord.xy / uRandomTexSize).xy * 2.0 - 1.0 );",
        "   vec3 norm = normalize(texture2D(sNormalTex, screenUV).xyz * 2.0 - 1.0 );",
        "   vec3 origin = getPosition(screenUV);",
        "   float radius = uSampleRadius / (viewMatrix * vec4(origin, 1.0)).z;",
        "   float ao = 0.0;",

        "   const int iterations = 4;",
        "   for (int i = 0; i < iterations; ++i) {",
        "       vec2 coord1 = reflect(uConstVectors[i], rand) * radius;",
        "       vec2 coord2 = vec2(coord1.x*0.707 - coord1.y*0.707, coord1.x*0.707 + coord1.y*0.707);",
        "       ao += calcAmbientOcclusion(screenUV, coord1*0.25, origin, norm);",
        "       ao += calcAmbientOcclusion(screenUV, coord2*0.5, origin, norm);",
        "       ao += calcAmbientOcclusion(screenUV, coord1*0.75, origin, norm);",
        "       ao += calcAmbientOcclusion(screenUV, coord2, origin, norm);",
        "   }",
        "   ao /= (float(iterations) * 4.0);",
        "   gl_FragColor = vec4(ao, ao, ao, 1.0);",
        "}"
    ].join("\n"),

    uniforms: {
        canvasSize: [512, 512],
        uConstVectors: [1, 0, -1, 0, 0, 1, 0, -1],
        uRandomTexSize: [64, 64],
        uSampleRadius: 0.9,
        uScale: 0.9,
        uBias: 0.2,
        uIntensity: 1.0
    },

    samplers: {
        sPositionTex: null,
        sNormalTex: null,
        sRandomNormals: null
    },

    attributes: {
    }
});