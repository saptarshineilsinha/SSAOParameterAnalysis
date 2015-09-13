XML3D.shaders.register("bilateralFilter", {
    vertex: [
        "attribute vec3 position;",

        "void main(void) {",
        "   gl_Position = vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragment: [
        "#define BSIGMA 0.1",
        "#define MSIZE 10",
        "uniform sampler2D RTScene;",
        "uniform vec2 canvasSize;",
        "uniform float sigma;",

        "float normpdf(in float x, in float sigma){",
        "return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;",
        "}",

        "float normpdf3(in vec3 v, in float sigma){",
        "return 0.39894*exp(-0.5*dot(v,v)/(sigma*sigma))/sigma;",
        "}",



        "void main(void) {",
        "vec2 texcoord = (gl_FragCoord.xy / canvasSize.xy);",
//        "texcoord.y=1.0-texcoord.y;",
        "vec3 c = texture2D(RTScene, texcoord).xyz;",
        "const int kSize = (MSIZE-1)/2;",
        "float kernel[MSIZE];",
        "vec3 final_colour = vec3(0.0);",

        "float Z = 0.0;",

        "for (int j = 0; j <= kSize; ++j){",
        "kernel[kSize+j] = kernel[kSize-j] = normpdf(float(j), sigma);",
        "}",

        "vec3 cc;",
        "float factor;",
        "float bZ = 1.0/normpdf(0.0, BSIGMA);",
        "for (int i=-kSize; i <= kSize; ++i){",
            "for (int j=-kSize; j <= kSize; ++j)",
            "{",
            "vec2 tt = (gl_FragCoord.xy+vec2(float(i),float(j))) / canvasSize.xy;",
//            "tt.y = 1.0-tt.y;",
            "cc = texture2D(RTScene, tt).xyz;",
            "factor = normpdf3(cc-c, BSIGMA)*bZ*kernel[kSize+j]*kernel[kSize+i];",
            "Z+= factor;",
            "final_colour += factor*cc;",
            "}",
        "}",
        "gl_FragColor = vec4(final_colour/Z, 1.0);",
        "}"
    ].join("\n"),

    uniforms: {
        canvasSize: [512, 512],
        sigma: 0.33
    },

    samplers: {
        RTScene: null
    }
});

