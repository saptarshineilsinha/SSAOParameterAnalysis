XML3D.shaders.register("starcraft", {
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
        "uniform sampler2D sNormalTex,sPositionTex;",
        "uniform vec2 uRandomTexSize;",
        "uniform sampler2D sRandomNormals;",
        "uniform float radius_starCraft,fieldOfView,epsilon,beta;",
        "uniform float near, far;",
        "uniform vec3 worldPosition;",
        "uniform sampler2D sDepthTexture;",
        "uniform mat4 projectionMatrix,viewMatrix;",
//        "varying vec2 uv;",
        "float cameraFarPlusNear = far + near;",
        "float cameraFarMinusNear = far - near;",
        "float cameraCoef = near;",

        "varying vec3 position1;",

        "const int NUM_SAMPLES = 10;",

        //linearized the depth
        "float linearDepth(float d) {",
        "return cameraCoef / (cameraFarPlusNear - (d * cameraFarMinusNear));",
        "}",

        "vec3 getPositionViewSpace(vec2 texCoordinate) {",
        "vec3 originWS=texture2D(sPositionTex, texCoordinate).xyz;",
        "vec3 originVS=(viewMatrix*vec4(originWS,1.0)).xyz;;",
        "return originVS;",
        "}",


        "void main(void) {",
        "float ao=0.0;",
        "vec2 uv = (gl_FragCoord.xy / canvasSize.xy);",
        "vec3 normal = normalize(texture2D(sNormalTex, uv).xyz * 2.0 - 1.0 );",
        "vec3 wc_position=texture2D(sPositionTex,uv).xyz;",
        "vec2 inverted_randomTexture_size=1.0/uRandomTexSize;",
        "vec3 random_direction = normalize(texture2D(sRandomNormals, gl_FragCoord.xy /uRandomTexSize).xyz * 2.0 - 1.0 );",
        "float projectedRadius = radius_starCraft*10.0;",
        "float depth_scene=texture2D(sDepthTexture, uv).x;",

        "for(int i=0; i < NUM_SAMPLES; i++){",
        "normal=faceforward(normal,-normal,worldPosition);",
        "vec3 sample_random_direction=texture2D(sRandomNormals,vec2(float(i)*inverted_randomTexture_size.x,(float(i)/uRandomTexSize.x)*inverted_randomTexture_size.y)).xyz;",
        "sample_random_direction=sample_random_direction*2.0-1.0;",
        "sample_random_direction=reflect(sample_random_direction,random_direction);",
        "sample_random_direction=faceforward(sample_random_direction,sample_random_direction,normal);",
        "vec3 wc_sample = wc_position + sample_random_direction*projectedRadius;",
        "vec3 ec_sample = (viewMatrix*vec4(wc_sample,1.0)).xyz;",
//        "ec_sample=normalize(ec_sample);",
        "vec4 cc_sample = projectionMatrix*vec4(ec_sample,1.0);",
        "vec3 ndc_sample = cc_sample.xyz/cc_sample.w;",
        "vec2 tc_sample = (ndc_sample.xy+vec2(1.0))*0.5;",
        " vec3 diff =ec_sample-getPositionViewSpace(uv);",
        " vec3 v = normalize(diff);",

        "float scene_sample_depth=texture2D(sDepthTexture, tc_sample).x;",
        "scene_sample_depth=linearDepth(scene_sample_depth);",
        "float sample_depth=ec_sample.z;",
        "float depth_difference=(scene_sample_depth-sample_depth);",
//        "if(depth_difference >0.0){",
        //cryEngine 2 rho
//        "float rho =(depth_difference < 0.0 || depth_difference > projectedRadius )? 1.0 : 0.0;",
         "float rho=clamp((depth_difference - projectedRadius)/depth_difference , 0.0 , 1.0);",
        "float occluded = sample_depth > scene_sample_depth ? 1.0 : 0.0;",
        "ao+=rho;",
//        "}",
        "}",
        "ao/=float(NUM_SAMPLES);",
        "ao = min(1.0, max(0.0, ao));",
        "gl_FragColor = vec4(vec3(1.0-ao),1.0);",
        "}"
    ].
        join("\n"),

    uniforms: {
        canvasSize: [512, 512],
        worldPosition: [512, 512, 512],
        radius_starCraft: 0.5,
        far: 10000,
        near: 0.1,
        epsilon: 0.01,
        beta: 0.2
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
