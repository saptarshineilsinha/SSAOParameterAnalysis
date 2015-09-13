XML3D.shaders.register("sao", {
    vertex: [
        "attribute vec2 position;",
        "varying vec2 uv;",
        "void main(void) {",
        "  gl_Position = vec4(position,0.0, 1.0);",
        "  uv =(vec2( gl_Position.x,  gl_Position.y ) + vec2( 1.0, 1.0 ) ) * 0.5;",
        "}"
    ].join("\n"),

    fragment: [
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "#define PI  3.14159265",
        "uniform vec2 canvasSize;",
        "uniform sampler2D sNormalTex,sPositionTex;",
        "uniform vec2 uRandomTexSize;",
        "uniform sampler2D sRandomNormals;",
        "uniform float radius_sao,fieldOfView;",
        "uniform float near, far,epsilon_sao;",
        "uniform vec3 worldPosition;",
        "uniform sampler2D sDepthTexture;",
        "uniform mat4 inverseProjectionMatrix,projectionMatrix,viewMatrix,inverseViewMatrix;",
        "varying vec2 uv;",

        "const int NUM_SAMPLES = 16;",
        "const int NUM_SPIRAL_TURNS = 5;",
        "#define VARIATION 1",


        "vec3 getPositionViewSpace(vec2 texCoordinate) {",
        "vec3 originWS=texture2D(sPositionTex, texCoordinate).xyz;",
        "vec3 originVS=(viewMatrix*vec4(originWS,1.0)).xyz;;",
        "return originVS;",
        "}",


        "vec3 getOffsetPositionVS(vec2 uv, vec2 unitOffset, float radiusSS) {",
        "uv = uv + radiusSS * unitOffset * (1.0 / canvasSize);",
        "return getPositionViewSpace(uv);",
        "}",


        "vec2 tapLocation(int sampleNumber, float spinAngle, out float radiusSS) {",
        "float alpha = (float(sampleNumber) + 0.5) * (1.0 / float(NUM_SAMPLES));",
        "float angle = alpha * (float(NUM_SPIRAL_TURNS) * 6.28) + spinAngle;",
        "radiusSS = alpha;",
        "return vec2(cos(angle), sin(angle));",
        "}",


        "float sampleAO(vec2 uv, vec3 positionVS, vec3 normalVS, float sampleRadiusSS,int tapIndex, float rotationAngle){",
        "float radius2 = radius_sao * radius_sao;",
        "float radiusSS;",
        "vec2 unitOffset = tapLocation(tapIndex, rotationAngle,radiusSS);",
        "radiusSS *= sampleRadiusSS;",
        "vec3 Q = getOffsetPositionVS(uv, unitOffset, radiusSS);",
        "vec3 diff = Q - positionVS;",
        "vec3 v = normalize(diff);",
        "float vv = dot(v, v);",
        "float vn = dot(v, normalVS);",

        "#if VARIATION == 0",
        "return float(vv < radius2) * max(vn / (epsilon_sao + vv), 0.0);",

        "#elif VARIATION == 1 ",
        "float f = max(radius2 - vv, 0.0) / radius2;",
        "return f * f * f * max(vn / (epsilon_sao + vv), 0.0);",

        "#elif VARIATION == 2",
        "float invRadius2 = 1.0 / radius2;",
        "return 4.0 * max(1.0 - vv * invRadius2, 0.0) * max(vn, 0.0);",


        "#else",
        "return 2.0 * float(vv < radius2) * max(vn, 0.0);",

        "#endif",
        "}",


        "void main(void) {",
        "float ao=0.0;",
        "vec3 originVS=getPositionViewSpace(uv);",

        "vec3 normalVS = normalize(texture2D(sNormalTex, uv).xyz * 2.0 - 1.0 );",
        "vec3 sampleNoise=normalize(texture2D(sRandomNormals, gl_FragCoord.xy /uRandomTexSize).xyz * 2.0 - 1.0);",
        "float randomPatternRotationAngle = 2.0 * PI * sampleNoise.x;",

        "float radiusSS=0.0;",
        "float radiusWS=0.0;",

        "float projScale = 60.0;",
        "radiusWS = radius_sao;",
        "radiusSS =projScale*radiusWS/originVS.z;",

        "for (int i = 0; i < NUM_SAMPLES; ++i) {",
        "ao += sampleAO(uv, originVS, normalVS, radiusSS, i, randomPatternRotationAngle);",
        "}",
        "ao =ao/(float(NUM_SAMPLES));",
        "gl_FragColor = vec4(vec3(ao),1.0);",
        "}"
    ].
        join("\n"),

    uniforms: {
        canvasSize: [512, 512],
        worldPosition: [512, 512, 512],
        radius_sao: 1.3,
        far: 10000,
        near: 0.1,
        epsilon_sao: 0.001
    },

    samplers: {
        sNormalTex: null,
        sPositionTex: null,
        sRandomNormals: null,
        sDepthTexture: null
    },

    attributes: {
    }
})
;