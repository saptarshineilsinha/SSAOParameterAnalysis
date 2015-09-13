XML3D.shaders.register("starCraftII", {
    vertex: [
        "attribute vec2 position;",
        "varying vec2 uv;",
        "void main(void) {",
        "  gl_Position = vec4(position,0.0, 1.0);",
        "  uv =(vec2( gl_Position.x, gl_Position.y ) + vec2( 1.0, 1.0 ) ) * 0.5;",
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
        "uniform float radius_starCraft,strength,falloff;",
        "uniform float  near, far;",
        "uniform mat4 viewMatrix,projectionMatrix;",
        "uniform sampler2D sDepthTexture,sPositionTex;",
        "varying vec2 uv;",
        "float cameraFarPlusNear = (far + near);",
        "float cameraFarMinusNear =(far - near);",
        "float cameraCoef = float(near);",
        "const float invSamples =1.0/10.0;",
        "const int NUM_SAMPLES = 10;",

        "float linearDepth(float d) {",
        "return cameraCoef / (cameraFarPlusNear - (d * cameraFarMinusNear));",
        "}",

        "vec3 getPosition(vec2 uv) {",
        "return texture2D(sPositionTex, uv).xyz;",
        "}",

        "vec3 getPositionViewSpace(vec2 texCoordinate) {",
        "vec3 originWS=texture2D(sPositionTex, texCoordinate).xyz;",
        "vec3 originVS=(viewMatrix*vec4(originWS,1.0)).xyz;;",
        "return originVS;",
        "}",

        //http://www.gamerendering.com/2009/01/14/ssao/
        "void main(void) {",
        "float ao=0.0;",
        "vec3 pSphere[10];",
        "pSphere[0] = vec3(0.13790712, 0.24864247, 0.44301823);",
        "pSphere[1] = vec3(0.33715037, 0.56794053, -0.005789503);",
        "pSphere[2] = vec3(0.06896307, -0.15983082, -0.85477847);",
        "pSphere[3] = vec3(-0.014653638, 0.14027752, 0.0762037);",
        "pSphere[4] = vec3(0.010019933, -0.1924225, -0.034443386);",
        "pSphere[5] = vec3(-0.35775623, -0.5301969, -0.43581226);",
        "pSphere[6] = vec3(-0.3169221, 0.106360726, 0.015860917);",
        "pSphere[7] = vec3(0.010350345, -0.58698344, 0.0046293875);",
        "pSphere[8] = vec3(-0.053382345, 0.059675813, -0.5411899);",
        "pSphere[9] = vec3(0.035267662, -0.063188605, 0.54602677);",
        "vec4 current_depth_data = texture2D(sDepthTexture, uv);",
        "float currentPixelDepth  =linearDepth(current_depth_data.x);",
        "vec3 norm = normalize(texture2D(sNormalTex, uv).xyz * 2.0 - 1.0 );",
        "vec3 fres = normalize(texture2D(sRandomNormals, gl_FragCoord.xy / uRandomTexSize).xyz * 2.0 - 1.0 );",
        "float occluderDepth, depthDifference;",
        "vec4 occluderFragment;",
        "vec3 ray;",
        " vec3 origin = getPosition(uv);",
        " float radiusD = radius_starCraft / (viewMatrix * vec4(origin, 1.0)).z;",

        "for(int sampleIndex=0; sampleIndex < NUM_SAMPLES; sampleIndex++){",
        "ray = radiusD*reflect(pSphere[sampleIndex],fres);",
        "vec2 something = uv + sign(dot(ray,norm) )*ray.xy;",
        "occluderFragment  = texture2D(sDepthTexture, something);",
        "depthDifference = currentPixelDepth-linearDepth(occluderFragment.x);",
        "ao += step(falloff,depthDifference)*(1.0-dot(occluderFragment.xyz,norm))*(1.0-smoothstep(falloff,strength,depthDifference));",
        "}",
        "ao=ao*invSamples;",
        "gl_FragColor = vec4(vec3(ao),1.0);",
        "}"
    ].
        join("\n"),

    uniforms: {
        canvasSize: [512, 512],
        radius_starCraft: 0.02,
        strength:15.0,
        falloff:0.00000002
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
