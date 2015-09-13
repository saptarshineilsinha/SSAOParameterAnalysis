(function (webgl) {


    //SSAO Render tree implementation
    var MySSAORenderTree = function (renderInterface, enableSSAO) {
        webgl.BaseRenderTree.call(this, renderInterface);
        var scene = renderInterface.scene;
        scene.addEventListener(webgl.Scene.EVENT_TYPE.LIGHT_STRUCTURE_CHANGED, this.onLightStructureChange.bind(this));
        scene.addEventListener(webgl.Scene.EVENT_TYPE.LIGHT_VALUE_CHANGED, this.onLightValueChange.bind(this));
        scene.addEventListener(webgl.Scene.EVENT_TYPE.SCENE_SHAPE_CHANGED, this.onSceneShapeChange.bind(this));
        scene.addEventListener(webgl.ShaderComposerFactory.EVENT_TYPE.MATERIAL_INITIALIZED, this.onShaderChange.bind(this));
        this._enableSSAO = enableSSAO;
        this.mainPass = null;
        this.createMainPass();
    };

    XML3D.createClass(MySSAORenderTree, webgl.BaseRenderTree);

    XML3D.extend(MySSAORenderTree.prototype, {
        onLightStructureChange: function (evt) {
            var light = evt.light;
            if (evt.removed) {
                // TODO: Proper clean up ShadowPass
                light.userData = null;
            }
            else {
                if (light.light.type == "spot")
                    light.userData = this.createLightPass(light)
            }
            this.reassignLightPasses(evt.target);
        },
        onLightValueChange: function (evt) {
            // TODO: Would be great to check of the light position or orientation specifically changed
            // We don't need to invalidate the lightPass otherwise
            if (evt.light.castShadow) {
                evt.light.userData && evt.light.userData.setProcessed(false);
            }
        },
        onSceneShapeChange: function (evt) {
            var scene = evt.target;
            for (var i = 0; i < scene.lights.spot.length; i++) {
                var spotLight = scene.lights.spot[i];
                if (spotLight.castShadow)
                    spotLight.userData && spotLight.userData.setProcessed(false);
            }
        },
        onShaderChange: function (evt) {
            this.reassignLightPasses(evt.target);
        },

        createLightPass: function (light) {
            var context = this.renderInterface.context
            var dimension = Math.max(context.canvasTarget.width, context.canvasTarget.height) * 2;
            var lightFramebuffer = new webgl.GLRenderTarget(context, {
                width: dimension,
                height: dimension,
                colorFormat: context.gl.RGBA,
                depthFormat: context.gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });
            var lightPass = new webgl.LightPass(this.renderInterface, lightFramebuffer, light);
            lightPass.init(context);
            return lightPass;
        },

        reassignLightPasses: function (scene) {
            var context = this.renderInterface.context;

            this.mainPass.clearLightPasses();
            for (var i = 0; i < scene.lights.spot.length; i++) {
                var spotLight = scene.lights.spot[i];
                this.mainPass.addLightPass("spotLightShadowMap", spotLight.userData);
            }
        },

        createMainPass: function () {
            var outputTarget = this.renderInterface.context.canvasTarget;
            if (this._enableSSAO) {
                XML3D.options.setValue("renderer-ssao", true);
                var positionPass = this.createVertexAttributePass("render-position");
                var normalPass = this.createVertexAttributePass(window.renderNormal);
                var depthPass = this.createVertexAttributePass("render-depth");
                var ssaoPass = this.createSSAOPass(positionPass.output, normalPass.output, depthPass.output);
                ssaoPass.addPrePass(positionPass);
                ssaoPass.addPrePass(normalPass);
                ssaoPass.addPrePass(depthPass);
                var blurPassX = this.createBlurPassX(ssaoPass.output);
                blurPassX.addPrePass(ssaoPass);
                var blurPassY = this.createBlurPassY(blurPassX.output);
                blurPassY.addPrePass(blurPassX);
                this._blurPassX = blurPassX;
                this._blurPassY = blurPassY;
                this._ssaoPass = ssaoPass;
                this._positionPass = positionPass;
                this._normalPass = normalPass;
                this._depthPass = depthPass;
                this.mainPass = new webgl.ForwardRenderPass(this.renderInterface, outputTarget, {
                    inputs: {
                        ssaoMap: blurPassY.output
                    }
                });
                //this.mainPass.addPrePass(blurPassY);
            } else {
                this.mainPass = new webgl.ForwardRenderPass(this.renderInterface, outputTarget);
            }
            this.mainRenderPass = this._blurPassY;
        },

        createVertexAttributePass: function (programName) {
            var context = this.renderInterface.context;
            var buffer = new webgl.GLRenderTarget(context, {
                width: context.canvasTarget.width,
                height: context.canvasTarget.height,
                colorFormat: context.gl.RGBA,
                colorType: context.gl.FLOAT,
                depthFormat: context.gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });
            return new webgl.VertexAttributePass(this.renderInterface, buffer, {
                programName: programName
            });
        },

//        createLinearDepthPass: function (programName) {
//            var context = this.renderInterface.context;
//            var depthBuffer = new webgl.GLRenderTarget(context, {
//                width: context.canvasTarget.width,
//                height: context.canvasTarget.height,
//                colorFormat: context.gl.RGBA,
//                colorType: context.gl.FLOAT,
//                depthFormat: context.gl.DEPTH_COMPONENT16,
//                stencilFormat: null,
//                depthAsRenderbuffer: true
//            });
//            return new webgl.LinearDepthPass(this.renderInterface,depthBuffer , {
//                programName: programName
//            });
//        },

        createSSAOPass: function (positionBuffer, normalBuffer, depthBuffer) {
            var context = this.renderInterface.context;
            var ssaoBuffer = new webgl.GLRenderTarget(context, {
                width: context.canvasTarget.width,
                height: context.canvasTarget.height,
                colorFormat: context.gl.RGBA,
                depthFormat: context.gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });

            return new webgl.SSAORenderPass(this.renderInterface, ssaoBuffer, {

                inputs: {
                    positionBuffer: positionBuffer,
                    normalBuffer: normalBuffer,
                    depthBuffer: depthBuffer
                }
            });
        },

        createBlurPassX: function (inputBuffer) {
            var context = this.renderInterface.context;
            var blurBufferX = new webgl.GLRenderTarget(context, {
                width: inputBuffer.width,
                height: inputBuffer.height,
                colorFormat: context.gl.RGBA,
                depthFormat: context.gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });

            return new webgl.GaussianBlurPassX(this.renderInterface, blurBufferX, {
                inputs: {
                    buffer: inputBuffer
                }
            });
        },

        createBlurPassY: function (blurHorizontalBuffer) {
            var context = this.renderInterface.context;
            var blurBufferY = new webgl.GLRenderTarget(context, {
                width: blurHorizontalBuffer.width,
                height: blurHorizontalBuffer.height,
                colorFormat: context.gl.RGBA,
                depthFormat: context.gl.DEPTH_COMPONENT16,
                stencilFormat: null,
                depthAsRenderbuffer: true
            });

            return new webgl.GaussianBlurPassY(this.renderInterface, context.canvasTarget, {
                inputs: {
                    bufferH: blurHorizontalBuffer
                }
            });
        },

        render: function (scene) {
            if (this._enableSSAO) {
                this._positionPass.setProcessed(false);
                this._normalPass.setProcessed(false);
                this._depthPass.setProcessed(false);
                this._ssaoPass.setProcessed(false);
                this._blurPassX.setProcessed(false);
                this._blurPassY.setProcessed(false);
            }
            this.mainRenderPass.setProcessed(false);
            webgl.BaseRenderTree.prototype.render.call(this, scene);
        },

        getRenderStats: function () {
            return this.mainPass.getRenderStats();
        }
    });

    function readBackFrameBuffer(xml3dElement, renderInterface, algorithm, parameter) {
        var target = renderInterface.context.canvasTarget;
        var c_data = new Uint8Array(target.width * target.height * 4);
        var gl = renderInterface.context.gl;
        gl.readPixels(0, 0, target.width, target.height, gl.RGBA, gl.UNSIGNED_BYTE, c_data);

        var canvas = document.createElement('canvas');
        canvas.width = target.width;
        canvas.height = target.height;
        var context1 = canvas.getContext('2d');
        // Copy the pixels to a 2D canvas
        var imageData = context1.createImageData(canvas.width, canvas.height);
        imageData.data.set(c_data);
        context1.putImageData(imageData, 0, 0);
        var img = new Image();
        img.src = canvas.toDataURL();
        img.onload = function () {
            var formData = {frame: algorithm +'bias3SAO_'+ parameter, data: img.src};
            $.ajax({
                url: 'http://localhost:8080',
                data: formData,
                type: 'POST',
                jsonpCallback: 'callback',
                success: function () {
                    console.log('Success: ')
                },
                error: function (xhr, status, error) {
                    console.log('Error: ' + error.message);
                }
            });
        }
    }

    function setRenderPipeline(renderInterface) {
        var ssaoRenderTree = new MySSAORenderTree(renderInterface, true);
        renderInterface.setRenderPipeline(ssaoRenderTree);
    }

    window.addEventListener("load", function () {
        var xml3dElement = document.getElementById("Scene");
        xml3dElement.addEventListener("load", function () {
            var renderInterface = xml3dElement.getRenderInterface();
            if (window.ssao_type == "sao" || window.ssao_type == "hbao") {
                window.renderNormal = "render-normalViewSpace";
            } else {
                window.renderNormal = "render-normal";
            }
//habo
//            window.radius_hbao=0.543;
//            window.angleBias=0.13;
// alchemy
//        window.radius_alchemy = 0.668344;
//            window.alchemy_beta = 0.0001;
//            window.alchemy_sigma = 0.3;
// xml3d
//            window.radius_ssao = 0.28;
//            window.uscale = 0.64;
//            window.bias = 0.12;
//            window.intensity = 1.086;
//sao
            window.radius_sao=1.0;
            window.bias_sao=0.01;
//            window.intensity_sao=0.9;
            xml3dElement.addEventListener("framedrawn", function c() {
                if (window.bias_sao !=0.01) {
                    readBackFrameBuffer(xml3dElement, renderInterface, window.ssao_type, window.bias_sao);
                }
                if (window.bias_sao < 0.18) {
                    setRenderPipeline(renderInterface);
                    var a = window.bias_sao + 0.01;
                    a = a.toFixed(2);
                    window.bias_sao = parseFloat(a);
                    renderInterface.context.requestRedraw();
                }
            });
        });
    });
})(XML3D.webgl);



