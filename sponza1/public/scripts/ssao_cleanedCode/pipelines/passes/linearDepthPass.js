(function (webgl) {

    var LinearDepthPass = function (renderInterface, output, opt) {
        webgl.BaseRenderPass.call(this, renderInterface, output, opt);
        this._program = this.renderInterface.context.programFactory.getProgramByName(opt.programName);
    };

    XML3D.createClass(LinearDepthPass, webgl.SceneRenderPass);

    XML3D.extend(LinearDepthPass.prototype, {
        render: (function () {
            return function () {
                var gl = this.renderInterface.context.gl;
                var target = this.output;

                target.bind();
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.disable(gl.DEPTH_TEST);

                this._program.bind();
                this._setNonVolatileShaderUniforms();

//                this._screenQuad.draw(this._program);

                this._program.unbind();
                target.unbind();
            }
        }()),

        _setNonVolatileShaderUniforms: (function(scene) {
            var uniforms = {};
            var uniformNames = ["far", "near"];

            return function() {
                if (!this._uniformsDirty)
                    return;

                var program = this._program;
                var target = this.output;

                uniforms["far"] = scene.activeView.getClippingPlanes().far;
                uniforms["near"] = scene.activeView.getClippingPlanes().near;

            }})
    });

    webgl.LinearDepthPass = LinearDepthPass;

}(XML3D.webgl));