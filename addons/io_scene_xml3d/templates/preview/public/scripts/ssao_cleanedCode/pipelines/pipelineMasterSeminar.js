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
//                this.mainPass.addPrePass(blurPassY);
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


    function setRenderPipeline(renderInterface) {
        var ssaoRenderTree = new MySSAORenderTree(renderInterface, true);
        renderInterface.setRenderPipeline(ssaoRenderTree);
    }

    window.addEventListener("load", function () {
        var xml3dElement = document.getElementById("myXML3D");
        xml3dElement.addEventListener("load", function () {
            var renderInterface = xml3dElement.getRenderInterface();
            setRenderPipeline(renderInterface);
        });

    });
})(XML3D.webgl);



