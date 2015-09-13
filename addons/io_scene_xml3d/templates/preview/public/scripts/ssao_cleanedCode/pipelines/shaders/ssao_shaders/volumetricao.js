XML3D.shaders.register("vao", {
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
        "uniform sampler2D sPositionTex;",
        "uniform vec2 uRandomTexSize;",
        "uniform sampler2D sRandomNormals;",
        "uniform float radius_vao,near, far,lower_bound,upper_bound;",
        "uniform mat4 viewMatrix;",
        "varying vec2 uv;",
        "float cameraFarPlusNear = far + near;",
        "float cameraFarMinusNear = far - near;",
        "float cameraCoef = near;",

        "const int NUM_BASE_SAMPLES= 60;",
        "const int NUM_MIN_SAMPLES = 0;",

        "vec3 getPositionViewSpace(vec2 texCoordinate) {",
        "vec3 originWS=texture2D(sPositionTex, texCoordinate).xyz;",
        "vec3 originVS=(viewMatrix*vec4(originWS,1.0)).xyz;",
        "return originVS;",
        "}",

        "float sphere_height(vec2 position,float radius1){",
        "return sqrt(radius1*radius1 - dot(position,position));",
        "}",

        "void main(void) {",
        "float ao=0.0;",
        "vec3 ec_position=getPositionViewSpace(uv);",
        "float ec_pos_depth=ec_position.z;",
        "float projectedRadius = radius_vao/ec_pos_depth;",
        "vec2 randomDirection=normalize(texture2D(sRandomNormals, gl_FragCoord.xy /uRandomTexSize).xy * 2.0 - 1.0);",
        "vec2 invertedRandomTexSize=1.0/uRandomTexSize.xy;",

        "for(int i=0;i<NUM_BASE_SAMPLES;i++){",
        "vec2 sample_random_direction=texture2D(sRandomNormals,vec2(float(i)*invertedRandomTexSize.x,(float(i)/uRandomTexSize.x)*invertedRandomTexSize.y)).xy;",
        "sample_random_direction=sample_random_direction*2.0-1.0;",
        "vec2 sample_random_direction_negated=-sample_random_direction;",
        "vec2 sample1_tex=uv+sample_random_direction*projectedRadius;",
        "vec2 sample2_tex=uv+sample_random_direction_negated*projectedRadius;",

        "float ec_depth1=getPositionViewSpace(sample1_tex).z;",
        "float ec_depth2=getPositionViewSpace(sample2_tex).z;",

        "float depth_difference_1=(ec_depth1-ec_pos_depth);",
        "float depth_difference_2=(ec_depth2-ec_pos_depth);",

        "float samples_sphere_height=sphere_height(sample1_tex,radius_vao);",
        "float sample_sphere_depth_inverted=1.0/(2.0*samples_sphere_height);",

        "float volume_ratio_1=(samples_sphere_height-depth_difference_1)*sample_sphere_depth_inverted;",
        "float volume_ratio_2=(samples_sphere_height-depth_difference_2)*sample_sphere_depth_inverted;",

        "bool sample_1_valid = lower_bound <= volume_ratio_1 && upper_bound >= volume_ratio_1;",
        "bool sample_2_valid = lower_bound <= volume_ratio_2 && upper_bound >= volume_ratio_2;",

        "if(sample_1_valid || sample_2_valid ){",
        "ao+=( sample_1_valid ) ?  volume_ratio_1 : (1.0-volume_ratio_2);",
        "ao+=( sample_2_valid ) ?  volume_ratio_2 : (1.0-volume_ratio_1);",
        "}",
        "else{",
        "ao+=1.0;",
        "}",
        "}",
        "ao/=float(NUM_BASE_SAMPLES);",
        "gl_FragColor = vec4(vec3(1.0-ao),1.0);",
        "}"
    ].
        join("\n"),

    uniforms: {
        canvasSize: [512, 512],
        radius_vao: 1.3,
        far: 10000,
        near: 0.1,
        lower_bound: 0.35,
        upper_bound: 1.0
    },

    samplers: {
        sPositionTex: null,
        sRandomNormals: null,
        sDepthTexture: null
    },

    attributes: {
    }
})
;