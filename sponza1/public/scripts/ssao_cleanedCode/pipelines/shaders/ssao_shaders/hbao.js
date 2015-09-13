XML3D.shaders.register("hbao", {
    vertex: [
        "attribute vec2 position;",
        "void main(void) {",
        "  gl_Position = vec4(position,0.0, 1.0);",
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
        "uniform float radius_hbao,fieldOfView;",
        "uniform float near, far,uAngleBias,uIntensity;",
        "uniform vec3 worldPosition;",
        "uniform sampler2D sDepthTexture;",
        "uniform mat4 inverseProjectionMatrix,viewMatrix;",
//        "varying vec2 uv;",
        "float cameraFarPlusNear = far + near;",
        "float cameraFarMinusNear = far - near;",
        "float cameraCoef = near;",

        "const int NUM_SAMPLE_DIRECTION = 8;",
        "const int NUM_SAMPLE_STEPS = 3;",

        "vec3 getPositionViewSpace(vec2 texCoordinate) {",
        "vec3 originWS=texture2D(sPositionTex, texCoordinate).xyz;",
        "vec3 originVS=(viewMatrix*vec4(originWS,1.0)).xyz;;",
        "return originVS;",
        "}",

        "void main(void) {",
        "vec2 uv = (gl_FragCoord.xy / canvasSize.xy);",
        "float ao=0.0;",
        "vec3 originVS=getPositionViewSpace(uv);",
        "vec3 normal = normalize(texture2D(sNormalTex, uv).xyz * 2.0 - 1.0 );",

        "float radiusSS=0.0;",
        "float radiusWS=0.0;",

        "radiusSS=radius_hbao;",
        "vec4 temp0=inverseProjectionMatrix*vec4(0.0,0.0,-1.0,1.0);",
        "vec3 out0=temp0.xyz;",
        "vec4 temp1=inverseProjectionMatrix*vec4(radiusSS,0.0,-1.0,1.0);",
        "vec3 out1=temp1.xyz;",

        "radiusWS=min(tan(radiusSS*fieldOfView/2.0)*originVS.y/2.0,length(out1-out0));",


        "const float theta=2.0*PI/float(NUM_SAMPLE_DIRECTION);",
        "float cosTheta=cos(theta);",
        "float sinTheta=sin(theta);",

        "mat2 deltaRotationMatrix=mat2(cosTheta,-sinTheta,sinTheta,cosTheta);",
        //step vector in view space
        "vec2 deltaUV=vec2(1.0,0.0)*(radiusSS/(float(NUM_SAMPLE_DIRECTION*NUM_SAMPLE_STEPS)+1.0));",

        "vec3 sampleNoise=normalize(texture2D(sRandomNormals, gl_FragCoord.xy /uRandomTexSize).xyz * 2.0 - 1.0);",
        "mat2 rotationMatrix=mat2(sampleNoise.x,-sampleNoise.y,sampleNoise.y,sampleNoise.x);",

        "deltaUV = rotationMatrix * deltaUV;",
        "float jitter = sampleNoise.x;",

        "for (int i = 0; i < NUM_SAMPLE_DIRECTION; ++i) {",
        "deltaUV = deltaRotationMatrix * deltaUV;",
        "vec2 sampleDirUV = deltaUV;",
        "float oldAngle=uAngleBias;",
        " for (int j = 0; j < NUM_SAMPLE_STEPS; ++j) {",
        "vec2 sampleUV = uv + (jitter + float(j)) * sampleDirUV;",
        "vec3 sampleVS=getPositionViewSpace(sampleUV);",
        "vec3 sampleDirVS =(sampleVS - originVS);",
        "float gamma = (PI / 2.0) - acos(dot(normal, normalize(sampleDirVS)));",
        "if (gamma > oldAngle) {",
        "float value = sin(gamma) - sin(oldAngle);",
//        "float attenuation = (1.0 - pow(length(sampleDirVS) / radiusWS, 2.0));",
        "ao+=value;",
        "oldAngle = gamma;",
        "}",
        "}",
        "}",
        "ao =ao/float(NUM_SAMPLE_DIRECTION);",
        "gl_FragColor = vec4(vec3(ao),1.0);",
        "}"
    ].
        join("\n"),

    uniforms: {
        canvasSize: [512, 512],
        worldPosition: [512, 512,512],
        radius_hbao: 1.3,
        far: 10000,
        near: 0.1,
        uAngleBias: 0.1,
        uIntensity:0.5
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
