(function (webgl) {

    "use strict";

    var GaussianBlurPassY = function (renderInterface, output, opt) {
        webgl.BaseRenderPass.call(this, renderInterface, output, opt);
        this._program = this.renderInterface.context.programFactory.getProgramByName("gaussianBlurY");
        this._screenQuad = new XML3D.webgl.FullscreenQuad(this.renderInterface.context);
        this._uniformsDirty = true;
    };

    XML3D.createClass(GaussianBlurPassY, webgl.BaseRenderPass);

    XML3D.extend(GaussianBlurPassY.prototype, {
        render: (function () {
            return function () {
                var gl = this.renderInterface.context.gl;
                var target = this.output;
                var c_data = new Uint8Array(target.width * target.height * 4);

                target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.disable(gl.DEPTH_TEST);

                this._program.bind();
                this._setNonVolatileShaderUniforms();

                this._screenQuad.draw(this._program);

                this._program.unbind();
                target.unbind();

            }
        }()),

        _setNonVolatileShaderUniforms: (function () {
            var uniforms = {};
            var uniformNames = ["canvasSize", "RTBlurH", "blurOffset"];

            return function () {
                if (!this._uniformsDirty)
                    return;

                var program = this._program;
                var target = this.output;

                uniforms["canvasSize"] = [target.width, target.height];
                uniforms["RTBlurH"] = [this.inputs.bufferH.colorTarget.handle];
                uniforms["blurOffset"] = [1.0, 1.0];
                program.setSystemUniformVariables(uniformNames, uniforms);

//                this._uniformsDirty = false;
            }
        })()
    });

    webgl.GaussianBlurPassY = GaussianBlurPassY;

}(XML3D.webgl));
