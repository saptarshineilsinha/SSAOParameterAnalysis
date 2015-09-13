XML3D.shaders.register("ssaoGauss", {
    vertex: [
        "attribute vec2 position;",
        "varying vec2 uv;",
        "void main(void) {",
        "  gl_Position = vec4(position,0.0, 1.0);",
        "  uv =(vec2( gl_Position.x,  gl_Position.y ) + vec2( 1.0 ) ) * 0.5;",
        "}"
    ].join("\n"),

    fragment: [
        //http://www.gamedev.net/topic/550699-ssao-no-halo-artifacts/
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "#define PI  3.14159265",
        "const int NUM_SAMPLES = 16;",
        //definition of uniforms
        "uniform vec2 canvasSize;",
        "uniform sampler2D sNormalTex;",
        "uniform vec2 uRandomTexSize;",
        "uniform sampler2D sRandomNormals;",
        "uniform sampler2D sDepthTexture;",
        "uniform float near,far,gDisplace,radius_Gauss,intensity;",
        "varying vec2 uv;",

        "float cameraFarPlusNear = far + near;",
        "float cameraFarMinusNear =far - near;",
        "float cameraCoef = near;",
        "float pw = 1.0/canvasSize.x*0.5;",
        "float ph = 1.0/canvasSize.y*0.5;",

        "float linearDepth(float d) {",
        "return cameraCoef / (cameraFarPlusNear - (d * cameraFarMinusNear));",
        "}",

        "float compareDepths(in float depth1, in float depth2,inout int far){",
        "float diff = (depth1 - depth2)*100.0;", //depth difference (0-100)
        "float gauss = pow(2.7182,-2.0*(diff-gDisplace)*(diff-gDisplace)/(radius_Gauss*radius_Gauss));",
        "return gauss;",
        "}",

        "float calAO( float depth, float dw, float dh) {",
        "float temp = 0.0;",
        "float temp2 = 0.0;",
        "float coordw = uv.x + dw/depth;",
        "float coordh = uv.y + dh/depth;",
        "float coordw2 = uv.x - dw/depth;",
        "float coordh2 = uv.y - dh/depth;",
        " if (coordw  < 1.0 && coordw  > 0.0 && coordh < 1.0 && coordh  > 0.0){",
        "vec2 coord = vec2(coordw , coordh);",
        "vec2 coord2 = vec2(coordw2, coordh2);",
        "int far = 0;",
        "vec4 coord_depth_data = texture2D(sDepthTexture, coord);",
        "temp = compareDepths(depth, linearDepth(coord_depth_data.x),far);",
        "if (far > 0){",
        "vec4 coord2_depth_data = texture2D(sDepthTexture, coord2);",
        "temp2 = compareDepths(linearDepth(coord2_depth_data.x),depth,far);",
        "temp += (1.0-temp)*temp2;",
        "}",
        "}",
        " return temp;",
        "}",

        "void main(void) {",
        "float ao=0.0;",
        "vec2 random =normalize(texture2D(sRandomNormals, gl_FragCoord.xy / uRandomTexSize).xy * 2.0 - 1.0 );",
        "vec4 current_depth_data = texture2D(sDepthTexture, uv);",
        "float depth = linearDepth(current_depth_data.x);",
        " for(int i=0; i<4; ++i) {",
        "ao+=calAO(depth,  pw, ph);",
        "ao+=calAO(depth,  pw, -ph);",
        "ao+=calAO(depth,  -pw, ph);",
        "ao+=calAO(depth, -pw, -ph);",

        "ao+=calAO(depth,  pw*1.2, 0.0);",
        "ao+=calAO(depth, -pw*1.2, 0.0);",
        "ao+=calAO(depth,  0.0, ph*1.2);",
        "ao+=calAO(depth,  0.0, -ph*1.2);",

        "pw += random.x*0.00007;",
        "ph += random.y*0.00007;",

        "pw *= intensity;",
        "ph *= intensity;",
        "}",
//        "if(depth>0.42){",
//        "ao=1.0;",
//        "}",
        "vec3 finalAO = vec3(1.0-(ao/32.0));",

        "gl_FragColor = vec4(1.0-finalAO, 1.0 );",
        "}"
    ].
        join("\n"),

    uniforms: {
        canvasSize: [512, 512],
        far: 10.0,
        near: 1.0,
        gDisplace:0.2,
        radius_Gauss:2.0,
        intensity:2.2

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
