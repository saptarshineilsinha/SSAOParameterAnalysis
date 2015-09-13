XML3D.shaders.register("alchemy-ssao", {
    vertex: [
        "attribute vec2 position;",
//        "varying vec2 uv;",
        "void main(void) {",
        "  gl_Position = vec4(position,0.0, 1.0);",
//        "  uv =(vec2( gl_Position.x,  gl_Position.y ) + vec2( 1.0, 1.0 ) ) * 0.5;",
        "}"
    ].join("\n"),

    fragment: [
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "#define PI  3.14159265",
        "uniform vec2 canvasSize;",
        "uniform sampler2D sNormalTex;",
        "uniform vec2 uRandomTexSize;",
        "uniform sampler2D sRandomNormals;",
        "uniform float radius_alchemy,fieldOfView,epsilon,beta,sigma;",
        "uniform float near, far;",
        "uniform sampler2D sDepthTexture,sPositionTex;",
        "uniform mat4 viewMatrix;",
//        "vec2 uv;",
        "float cameraFarPlusNear = (far + near);",
        "float cameraFarMinusNear =(far - near);",
        "float cameraCoef = 2.0*(near);",


        "const int NUM_SAMPLES = 16;",
        "const int NUM_SPIRAL_TURNS = 5;",

        //linearized the depth
        "float linearDepth(float d) {",
        "return cameraCoef / (cameraFarPlusNear - (d * cameraFarMinusNear));",
        "}",

        "vec3 getPositionWS(vec2 texCoordinate) {",
        "vec3 originWS=texture2D(sPositionTex, texCoordinate).xyz;",
        "return originWS;",
        "}",

        //calculate the offset for next location
        "vec2 tapLocation(int sampleNumber, float spinAngle) {",
        "float alpha = (float(sampleNumber) + 0.5) * (1.0 / float(NUM_SAMPLES));",
        "float angle = alpha * (float(NUM_SPIRAL_TURNS) * 2.0 * PI) + spinAngle;",
        "float radius_alchemy = alpha;",
        "return alpha * vec2(cos(angle), sin(angle));",
        "}",

        "void main(void) {",
        "vec2 uv = (gl_FragCoord.xy / canvasSize.xy);",
        "float ao=0.0;",
        "vec3 wc_position = getPositionWS(uv);",
        "vec4 current_depth_data = texture2D(sDepthTexture, uv);",
        "float linearDepth_texCoord =linearDepth(current_depth_data.x);",
        "vec3 wc_normal = normalize(texture2D(sNormalTex, uv).xyz * 2.0 - 1.0 );",
        "vec2 rand = normalize(texture2D(sRandomNormals, gl_FragCoord.xy / canvasSize*uRandomTexSize).xy * 2.0 - 1.0 );",
        "float random =rand.x;",
        "float diskRadius = radius_alchemy / (viewMatrix * vec4(wc_position, 1.0)).z;",
        "for(int i=0; i < NUM_SAMPLES; i++){",
        "vec2 offset = tapLocation(i, random);",
        "vec2 samplePosition = uv + diskRadius * offset;",
        "vec3 samplePoint = getPositionWS(samplePosition);",
        "vec3 diff = samplePoint - wc_position;",
        "vec3 v = normalize(diff);",
        "float vv = dot(v, v);",
        "float vn = dot(v, wc_normal);",
        "ao += max(0.0, vn - linearDepth_texCoord * beta) / (vv + epsilon);",
        "}",
        "ao *= 2.0 * sigma / float(NUM_SAMPLES);",
        "ao = min(1.0, max(0.0, ao));",
        "gl_FragColor = vec4(vec3(ao),1.0);",
        "}"
    ].
        join("\n"),

    uniforms: {
        canvasSize: [512, 512],
        radius_alchemy: 0.5,
        far: 10,
        near: 1,
        epsilon: 0.01,
        beta: 0.2,
        sigma:1.0
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