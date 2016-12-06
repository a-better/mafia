(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = PIXI.lights = {
//    LitSprite: require('./light_1/LitSprite'),
//    LightingRenderer: require('./light_1/webgl/LightingRenderer')

    Light:                  require('./lights/light/Light'),
    LightShader:            require('./lights/light/LightShader'),

    AmbientLight:           require('./lights/ambientLight/AmbientLight'),
    AmbientLightShader:     require('./lights/ambientLight/AmbientLightShader'),

    PointLight:             require('./lights/pointLight/PointLight'),
    PointLightShader:       require('./lights/pointLight/PointLightShader'),

    DirectionalLight:             require('./lights/directionalLight/DirectionalLight'),
    DirectionalLightShader:       require('./lights/directionalLight/DirectionalLightShader'),

    LightRenderer:          require('./renderers/LightRenderer'),
    WebGLDeferredRenderer:  require('./renderers/WebGLDeferredRenderer'),

    WireframeShader:        require('./lights/WireframeShader')
};

require('./lightSpriteMixin');
require('./shapeMeshMixin');

},{"./lightSpriteMixin":2,"./lights/WireframeShader":3,"./lights/ambientLight/AmbientLight":4,"./lights/ambientLight/AmbientLightShader":5,"./lights/directionalLight/DirectionalLight":6,"./lights/directionalLight/DirectionalLightShader":7,"./lights/light/Light":8,"./lights/light/LightShader":9,"./lights/pointLight/PointLight":10,"./lights/pointLight/PointLightShader":11,"./renderers/LightRenderer":12,"./renderers/WebGLDeferredRenderer":13,"./shapeMeshMixin":14}],2:[function(require,module,exports){
var tempTexture = null;

 /**
 * Renders the object using the WebGL renderer
 *
 * @param renderer {WebGLRenderer}
 * @private
 */
PIXI.Sprite.prototype._renderWebGL = function (renderer)
{
    if (!this._originalTexture) {
        this._originalTexture = this._texture;
    }

    // unlit render pass
    if (renderer.renderingUnlit)
    {
        // if it has a normal texture it is considered "lit", so skip it
        if (this.normalTexture)
        {
            return;
        }
        // otherwise do a normal draw for unlit pass
        else
        {
            this._texture = this._originalTexture;
        }
    }
    // normals render pass
    else if (renderer.renderingNormals)
    {
        // if it has no normal texture it is considered "unlit", so skip it
        if (!this.normalTexture)
        {
            return;
        }
        else
        {
            this._texture = this.normalTexture;
        }
    }
    // diffuse render pass, always just draw the texture
    else
    {
        this._texture = this._originalTexture;
    }

    renderer.setObjectRenderer(renderer.plugins.sprite);
    renderer.plugins.sprite.render(this);
};

},{}],3:[function(require,module,exports){


/**
 * @class
 * @extends PIXI.Shader
 * @memberof PIXI.lights
 * @param shaderManager {ShaderManager} The WebGL shader manager this shader works for.
 */
function WireframeShader(shaderManager) {
    PIXI.Shader.call(this,
        shaderManager,
        // vertex shader
        [
            'precision lowp float;',

            'attribute vec2 aVertexPosition;',

            'uniform mat3 projectionMatrix;',

            'void main(void) {',
            '    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
            '}'
        ].join('\n'),
        // fragment shader
        [
            'void main() {',
            '    gl_FragColor = vec4(0, 0, 0, 1);',
            '}'
        ].join('\n'),
        // uniforms
        {
            translationMatrix:  { type: 'mat3', value: new Float32Array(9) },
            projectionMatrix:   { type: 'mat3', value: new Float32Array(9) }
        },
        // attributes
        {
            aVertexPosition: 0
        }
    );
}

WireframeShader.prototype = Object.create(PIXI.Shader.prototype);
WireframeShader.prototype.constructor = WireframeShader;
module.exports = WireframeShader;

PIXI.ShaderManager.registerPlugin('wireframeShader', WireframeShader);

},{}],4:[function(require,module,exports){
var Light = require('../light/Light');

/**
 * @class
 * @extends PIXI.lights.Light
 * @memberof PIXI.lights
 *
 * @param [color=0xFFFFFF] {number} The color of the light.
 * @param [brightness=0.5] {number} The brightness of the light.
 */
function AmbientLight(color, brightness) {
    // ambient light is drawn using a full-screen quad
    Light.call(this, color, brightness);

    this.shaderName = 'ambientLightShader';
}

AmbientLight.prototype = Object.create(Light.prototype);
AmbientLight.prototype.constructor = AmbientLight;
module.exports = AmbientLight;

AmbientLight.prototype.renderWebGL = function (renderer)
{
    // add lights to their renderer on the normals pass
    if (!renderer.renderingNormals) {
        return;
    }

    // I actually don't want to interrupt the current batch, so don't set light as the current object renderer.
    // Light renderer works a bit differently in that lights are draw individually on flush (called by WebGLDeferredRenderer).
    //renderer.setObjectRenderer(renderer.plugins.lights);

    renderer.plugins.lights.render(this);
};

},{"../light/Light":8}],5:[function(require,module,exports){
var LightShader = require('../light/LightShader');


/**
 * @class
 * @extends PIXI.Shader
 * @memberof PIXI.lights
 * @param shaderManager {ShaderManager} The WebGL shader manager this shader works for.
 */
function AmbientLightShader(shaderManager) {
    LightShader.call(this,
        shaderManager,
        // vertex shader
        null,
        // fragment shader
        "precision lowp float;\n#define GLSLIFY 1\n\nuniform sampler2D uSampler;\nuniform sampler2D uNormalSampler;\n\nuniform mat3 translationMatrix;\n\nuniform vec2 uViewSize;     // size of the viewport\n\nuniform vec4 uLightColor;   // light color, alpha channel used for intensity.\nuniform vec3 uLightFalloff; // light attenuation coefficients (constant, linear, quadratic)\nuniform float uLightHeight; // light height above the viewport\n\n\nvoid main(void)\n{\nvec2 texCoord = gl_FragCoord.xy / uViewSize;\ntexCoord.y = 1.0 - texCoord.y; // FBOs positions are flipped.\n\nvec4 normalColor = texture2D(uNormalSampler, texCoord);\nnormalColor.g = 1.0 - normalColor.g; // Green layer is flipped Y coords.\n\n// bail out early when normal has no data\nif (normalColor.a == 0.0) discard;\n\n\n    // simplified lambert shading that makes assumptions for ambient color\n\n    // compute Distance\n    float D = 1.0;\n    \n    // normalize vectors\n    vec3 N = normalize(normalColor.xyz * 2.0 - 1.0);\n    vec3 L = vec3(1.0, 1.0, 1.0);\n    \n    // pre-multiply light color with intensity\n    // then perform \"N dot L\" to determine our diffuse\n    vec3 diffuse = (uLightColor.rgb * uLightColor.a) * max(dot(N, L), 0.0);\n\n    vec4 diffuseColor = texture2D(uSampler, texCoord);\n    vec3 finalColor = diffuseColor.rgb * diffuse;\n\n    gl_FragColor = vec4(finalColor, diffuseColor.a);\n}\n"
    );
}

AmbientLightShader.prototype = Object.create(LightShader.prototype);
AmbientLightShader.prototype.constructor = AmbientLightShader;
module.exports = AmbientLightShader;

PIXI.ShaderManager.registerPlugin('ambientLightShader', AmbientLightShader);

},{"../light/LightShader":9}],6:[function(require,module,exports){
var Light = require('../light/Light');

/**
 * @class
 * @extends PIXI.lights.Light
 * @memberof PIXI.lights
 *
 * @param [color=0xFFFFFF] {number} The color of the light.
 * @param [brightness=1] {number} The intensity of the light.
 * @param [target] {PIXI.DisplayObject|PIXI.Point} The object in the scene to target.
 */
function DirectionalLight(color, brightness, target) {
    Light.call(this, color, brightness);

    this.target = target;
    this._directionVector = new PIXI.Point();

    this._updateTransform = Light.prototype.updateTransform;
    this._syncShader = Light.prototype.syncShader;

    this.shaderName = 'directionalLightShader';
}

DirectionalLight.prototype = Object.create(Light.prototype);
DirectionalLight.prototype.constructor = DirectionalLight;
module.exports = DirectionalLight;

DirectionalLight.prototype.updateTransform = function () {
    this._updateTransform();

    var vec = this._directionVector,
        wt = this.worldTransform,
        tx = this.target.worldTransform ? this.target.worldTransform.tx : this.target.x,
        ty = this.target.worldTransform ? this.target.worldTransform.ty : this.target.y;

    // calculate direction from this light to the target
    vec.x = wt.tx - tx;
    vec.y = wt.ty - ty;

    // normalize
    var len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    vec.x /= len;
    vec.y /= len;
};

DirectionalLight.prototype.syncShader = function (shader) {
    this._syncShader(shader);

    shader.uniforms.uLightDirection.value[0] = this._directionVector.x;
    shader.uniforms.uLightDirection.value[1] = this._directionVector.y;
};

},{"../light/Light":8}],7:[function(require,module,exports){
var LightShader = require('../light/LightShader');


/**
 * @class
 * @extends PIXI.Shader
 * @memberof PIXI.lights
 * @param shaderManager {ShaderManager} The WebGL shader manager this shader works for.
 */
function DirectionalLightShader(shaderManager) {
    LightShader.call(this,
        shaderManager,
        // vertex shader
        null,
        // fragment shader
        "precision lowp float;\n#define GLSLIFY 1\n\n// imports the common uniforms like samplers, and ambient/light color\nuniform sampler2D uSampler;\nuniform sampler2D uNormalSampler;\n\nuniform mat3 translationMatrix;\n\nuniform vec2 uViewSize;     // size of the viewport\n\nuniform vec4 uLightColor;   // light color, alpha channel used for intensity.\nuniform vec3 uLightFalloff; // light attenuation coefficients (constant, linear, quadratic)\nuniform float uLightHeight; // light height above the viewport\n\n\nuniform vec2 uLightDirection;\n\nvoid main()\n{\nvec2 texCoord = gl_FragCoord.xy / uViewSize;\ntexCoord.y = 1.0 - texCoord.y; // FBOs positions are flipped.\n\nvec4 normalColor = texture2D(uNormalSampler, texCoord);\nnormalColor.g = 1.0 - normalColor.g; // Green layer is flipped Y coords.\n\n// bail out early when normal has no data\nif (normalColor.a == 0.0) discard;\n\n\n    // the directional vector of the light\n    vec3 lightVector = vec3(uLightDirection, uLightHeight);\n\n    // compute Distance\n    float D = length(lightVector);\n\n// normalize vectors\nvec3 N = normalize(normalColor.xyz * 2.0 - 1.0);\nvec3 L = normalize(lightVector);\n\n// pre-multiply light color with intensity\n// then perform \"N dot L\" to determine our diffuse\nvec3 diffuse = (uLightColor.rgb * uLightColor.a) * max(dot(N, L), 0.0);\n\n\n    // calculate attenuation\n    float attenuation = 1.0;\n\n// calculate final intesity and color, then combine\nvec3 intensity = diffuse * attenuation;\nvec4 diffuseColor = texture2D(uSampler, texCoord);\nvec3 finalColor = diffuseColor.rgb * intensity;\n\ngl_FragColor = vec4(finalColor, diffuseColor.a);\n\n}\n",
        // custom uniforms
        {
            // the directional vector of the light
            uLightDirection: { type: '2f', value: new Float32Array(2) }
        }
    );
}

DirectionalLightShader.prototype = Object.create(LightShader.prototype);
DirectionalLightShader.prototype.constructor = DirectionalLightShader;
module.exports = DirectionalLightShader;

PIXI.ShaderManager.registerPlugin('directionalLightShader', DirectionalLightShader);

},{"../light/LightShader":9}],8:[function(require,module,exports){
/**
 * Excuse the mess, haven't cleaned this up yet!
 */



/**
 * @class
 * @extends PIXI.DisplayObject
 * @memberof PIXI.lights
 *
 * @param [color=0xFFFFFF] {number} The color of the light.
 * @param [brightness=1] {number} The brightness of the light, in range [0, 1].
 */
function Light(color, brightness, vertices, indices) {
    if (this.constructor === Light) {
        throw new Error('Light is an abstract base class, it should not be created directly!');
    }
    
    PIXI.DisplayObject.call(this);

    /**
     * An array of vertices
     *
     * @member {Float32Array}
     */
    this.vertices = vertices || new Float32Array(8);

    /**
     * An array containing the indices of the vertices
     *
     * @member {Uint16Array}
     */
    this.indices = indices || new Uint16Array([0,1,2, 0,2,3]);

    /**
     * The blend mode to be applied to the light.
     *
     * @member {number}
     * @default CONST.BLEND_MODES.ADD;
     */
    this.blendMode = PIXI.BLEND_MODES.ADD;

    /**
     * The draw mode to be applied to the light geometry.
     *
     * @member {number}
     * @default CONST.DRAW_MODES.TRIANGLES;
     */
    this.drawMode = PIXI.DRAW_MODES.TRIANGLES;

    /**
     * When set, the renderer will reupload the geometry data.
     * 
     * @member {boolean}
     */
    this.needsUpdate = true;

    /**
     * The height of the light from the viewport.
     *
     * @member {number}
     * @default 0.075
     */
    this.height = 0.075;

    /**
     * The falloff attenuation coeficients.
     *
     * @member {number[]}
     * @default [0.75, 3, 20]
     */
    this.falloff = [0.75, 3, 20];

    /**
     * The name of the shader plugin to use.
     *
     * @member {string}
     */
    this.shaderName = null;

    /**
     * By default the light uses a viewport sized quad as the mesh.
     */
    this.useViewportQuad = true;

    this.visible = false;

    // webgl buffers
    this._vertexBuffer = null;
    this._indexBuffer = null;

    // color and brightness are exposed through setters
    this._color = 0x4d4d59;
    this._colorRgba = [0.3, 0.3, 0.35, 0.8];

    //original position x/y  
    this.originalX;
    this.originalY;

    // run the color setter
    if (color || color === 0) {
        this.color = color;
    }

    // run the brightness setter
    if (brightness || brightness === 0) {

        this.brightness = brightness;
    }
}

Light.prototype = Object.create(PIXI.DisplayObject.prototype);
Light.prototype.constructor = Light;
module.exports = Light;

Object.defineProperties(Light.prototype, {
    /**
     * The color of the lighting.
     *
     * @member {number}
     * @memberof Light#
     */
    color: {
        get: function ()
        {
            return this._color;
        },
        set: function (val)
        {
            this._color = val;
            PIXI.utils.hex2rgb(val, this._colorRgba);
        }
    },

    /**
     * The brightness of this lighting. Normalized in the range [0, 1].
     *
     * @member {number}
     * @memberof Light#
     */
    brightness: {
        get: function ()
        {
            return this._colorRgba[3];
        },
        set: function (val)
        {
            this._colorRgba[3] = val;
        }
    }
});

Light.prototype.syncShader = function (shader) {
    shader.uniforms.uUseViewportQuad.value = this.useViewportQuad;

    shader.uniforms.uLightColor.value[0] = this._colorRgba[0];
    shader.uniforms.uLightColor.value[1] = this._colorRgba[1];
    shader.uniforms.uLightColor.value[2] = this._colorRgba[2];
    shader.uniforms.uLightColor.value[3] = this._colorRgba[3];

    shader.uniforms.uLightHeight.value = this.height;

    shader.uniforms.uLightFalloff.value[0] = this.falloff[0];
    shader.uniforms.uLightFalloff.value[1] = this.falloff[1] * 3;
    shader.uniforms.uLightFalloff.value[2] = this.falloff[2] * 3;
};

Light.prototype.renderWebGL = function (renderer)
{
    // add lights to their renderer on the normals pass
    if (!renderer.renderingNormals) {
        return;
    }

    // I actually don't want to interrupt the current batch, so don't set light as the current object renderer.
    // Light renderer works a bit differently in that lights are draw individually on flush (called by WebGLDeferredRenderer).
    //renderer.setObjectRenderer(renderer.plugins.lights);

    renderer.plugins.lights.render(this);
};

Light.prototype.destroy = function ()
{
    PIXI.DisplayObject.prototype.destroy.call(this);

    // TODO: Destroy buffers!
};

Light.DRAW_MODES = {
    
};

},{}],9:[function(require,module,exports){


/**
 * @class
 * @extends PIXI.Shader
 * @memberof PIXI.lights
 * @param shaderManager {ShaderManager} The WebGL shader manager this shader works for.
 */
function LightShader(shaderManager, vertexSrc, fragmentSrc, customUniforms, customAttributes) {
    var uniforms = {
        translationMatrix:  { type: 'mat3', value: new Float32Array(9) },
        projectionMatrix:   { type: 'mat3', value: new Float32Array(9) },

        // textures from the previously rendered FBOs
        uSampler:       { type: 'sampler2D', value: null },
        uNormalSampler: { type: 'sampler2D', value: null },

        // should we apply the translation matrix or not.
        uUseViewportQuad: { type: 'bool', value: true },

        // size of the renderer viewport
        uViewSize:      { type: '2f', value: new Float32Array(2) },

        // light color, alpha channel used for intensity.
        uLightColor:    { type: '4f', value: new Float32Array([1, 1, 1, 1]) },

        // light falloff attenuation coefficients
        uLightFalloff:  { type: '3f', value: new Float32Array([0, 0, 0]) },

        // height of the light above the viewport
        uLightHeight: { type: '1f', value: 0.075 }
    };

    if (customUniforms)
    {
        for (var u in customUniforms)
        {
            uniforms[u] = customUniforms[u];
        }
    }

    var attributes = {
        aVertexPosition: 0
    };

    if (customAttributes)
    {
        for (var a in customAttributes)
        {
            attributes[a] = customAttributes[a];
        }
    }

    PIXI.Shader.call(this, shaderManager, vertexSrc || LightShader.defaultVertexSrc, fragmentSrc, uniforms, attributes);
}

LightShader.prototype = Object.create(PIXI.Shader.prototype);
LightShader.prototype.constructor = LightShader;
module.exports = LightShader;

LightShader.defaultVertexSrc = "precision lowp float;\n#define GLSLIFY 1\n\nattribute vec2 aVertexPosition;\n\nuniform bool uUseViewportQuad;\nuniform mat3 translationMatrix;\nuniform mat3 projectionMatrix;\n\nvoid main(void) {\n    if (uUseViewportQuad) {\n        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    }\n    else\n    {\n        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    }\n}\n";

},{}],10:[function(require,module,exports){
var Light = require('../light/Light');

/**
 * @class
 * @extends PIXI.lights.Light
 * @memberof PIXI.lights
 *
 * @param [color=0xFFFFFF] {number} The color of the light.
 * @param [brightness=1] {number} The intensity of the light.
 * @param [radius=Infinity] {number} The distance the light reaches. You will likely need
 *  to change the falloff of the light as well if you change this value. Infinity will
 *  use the entire viewport as the drawing surface.
 */
function PointLight(color, brightness, radius) {
    radius = radius || Infinity;

    if (radius !== Infinity) {
        //  var shape = new PIXI.Circle(0, 0, radius),
        var shape = new PIXI.Ellipse(0,0, 1*radius, 0.8*radius),
            mesh = shape.getMesh();

        Light.call(this, color, brightness, mesh.vertices, mesh.indices);

        this.useViewportQuad = false;
        this.drawMode = PIXI.DRAW_MODES.TRIANGLE_FAN;
    }
    else {
        Light.call(this, color, brightness);
    }

    this._syncShader = Light.prototype.syncShader;

    this.radius = radius;
    this.shaderName = 'pointLightShader';
}

PointLight.prototype = Object.create(Light.prototype);
PointLight.prototype.constructor = PointLight;
module.exports = PointLight;

PointLight.prototype.syncShader = function (shader) {
    this._syncShader(shader);

    shader.uniforms.uLightRadius.value = this.radius;
}

},{"../light/Light":8}],11:[function(require,module,exports){
var LightShader = require('../light/LightShader');


/**
 * @class
 * @extends PIXI.Shader
 * @memberof PIXI.lights
 * @param shaderManager {ShaderManager} The WebGL shader manager this shader works for.
 */
function PointLightShader(shaderManager) {
    LightShader.call(this,
        shaderManager,
        // vertex shader
        null,
        // fragment shader
        "precision lowp float;\n#define GLSLIFY 1\n\n// imports the common uniforms like samplers, and ambient color\nuniform sampler2D uSampler;\nuniform sampler2D uNormalSampler;\n\nuniform mat3 translationMatrix;\n\nuniform vec2 uViewSize;     // size of the viewport\n\nuniform vec4 uLightColor;   // light color, alpha channel used for intensity.\nuniform vec3 uLightFalloff; // light attenuation coefficients (constant, linear, quadratic)\nuniform float uLightHeight; // light height above the viewport\n\n\nuniform float uLightRadius;\n\nvoid main()\n{\nvec2 texCoord = gl_FragCoord.xy / uViewSize;\ntexCoord.y = 1.0 - texCoord.y; // FBOs positions are flipped.\n\nvec4 normalColor = texture2D(uNormalSampler, texCoord);\nnormalColor.g = 1.0 - normalColor.g; // Green layer is flipped Y coords.\n\n// bail out early when normal has no data\nif (normalColor.a == 0.0) discard;\n\n\n    vec2 lightPosition = translationMatrix[2].xy / uViewSize;\n\n    // the directional vector of the light\n    vec3 lightVector = vec3(lightPosition - texCoord, uLightHeight);\n\n    // correct for aspect ratio\n    lightVector.x *= uViewSize.x / uViewSize.y;\n\n    // compute Distance\n    float D = length(lightVector);\n\n    // bail out early when pixel outside of light sphere\n    if (D > uLightRadius) discard;\n\n// normalize vectors\nvec3 N = normalize(normalColor.xyz * 2.0 - 1.0);\nvec3 L = normalize(lightVector);\n\n// pre-multiply light color with intensity\n// then perform \"N dot L\" to determine our diffuse\nvec3 diffuse = (uLightColor.rgb * uLightColor.a) * max(dot(N, L), 0.0);\n\n\n    // calculate attenuation\n    float attenuation = 2.0 / (uLightFalloff.x + (uLightFalloff.y * D) + (uLightFalloff.z * D * D));\n\n// calculate final intesity and color, then combine\nvec3 intensity = diffuse * attenuation;\nvec4 diffuseColor = texture2D(uSampler, texCoord);\nvec3 finalColor = diffuseColor.rgb * intensity;\n\ngl_FragColor = vec4(finalColor, diffuseColor.a);\n\n}",
        // custom uniforms
        {
            // height of the light above the viewport
            uLightRadius:   { type: '1f', value: 1 }
        }
    );
}

PointLightShader.prototype = Object.create(LightShader.prototype);
PointLightShader.prototype.constructor = PointLightShader;
module.exports = PointLightShader;

PIXI.ShaderManager.registerPlugin('pointLightShader', PointLightShader);

},{"../light/LightShader":9}],12:[function(require,module,exports){
/**
 *
 * @class
 * @private
 * @memberof PIXI.lights
 * @extends PIXI.ObjectRenderer
 * @param renderer {WebGLRenderer} The renderer this sprite batch works for.
 */
function LightRenderer(renderer)
{

    PIXI.ObjectRenderer.call(this, renderer);

    // the total number of indices in our batch, there are 6 points per quad.
    var numIndices = LightRenderer.MAX_LIGHTS * 6;

    /**
     * Holds the indices
     *
     * @member {Uint16Array}
     */
    this.indices = new Uint16Array(numIndices);

    //TODO this could be a single buffer shared amongst all renderers as we reuse this set up in most renderers
    for (var i = 0, j = 0; i < numIndices; i += 6, j += 4)
    {
        this.indices[i + 0] = j + 0;
        this.indices[i + 1] = j + 1;
        this.indices[i + 2] = j + 2;
        this.indices[i + 3] = j + 0;
        this.indices[i + 4] = j + 2;
        this.indices[i + 5] = j + 3;
    }

    /**
     * The current size of the batch, each render() call adds to this number.
     *
     * @member {number}
     */
    this.currentBatchSize = 0;

    /**
     * The current lights in the batch.
     *
     * @member {Light[]}
     */
    this.lights = [];
}

LightRenderer.MAX_LIGHTS = 500;

LightRenderer.prototype = Object.create(PIXI.ObjectRenderer.prototype);
LightRenderer.prototype.constructor = LightRenderer;
module.exports = LightRenderer;

PIXI.WebGLRenderer.registerPlugin('lights', LightRenderer);

/**
 * Renders the light object.
 *
 * @param light {Light} the light to render
 */
LightRenderer.prototype.render = function (light)
{
    //console.log(light.x + '/'+ light.y);
    //light.position.x = light.oringinalX * light.parent.parent.scale.x;
    //light.position.y = light.oringinalY * light.parent.parent.scale.y;
    //console.log(light.scale);
    this.lights[this.currentBatchSize++] = light;
    
};

LightRenderer.prototype.flush = function ()
{
    var renderer = this.renderer,
        gl = renderer.gl,
        diffuseTexture = renderer.diffuseTexture,
        normalsTexture = renderer.normalsTexture,
        lastShader = null;

    for (var i = 0; i < this.currentBatchSize; ++i)
    {
        var light = this.lights[i],
            shader = light.shader || this.renderer.shaderManager.plugins[light.shaderName];

        if (!light._vertexBuffer)
        {
            this._initWebGL(light);
        }

        // set shader if needed
        if (shader !== lastShader) {
            lastShader = shader;
            renderer.shaderManager.setShader(shader);
        }

        renderer.blendModeManager.setBlendMode(light.blendMode);

        // set uniforms, can do some optimizations here.
        shader.uniforms.uViewSize.value[0] = renderer.width;
        shader.uniforms.uViewSize.value[1] = renderer.height;

        light.worldTransform.toArray(true, shader.uniforms.translationMatrix.value);
        renderer.currentRenderTarget.projectionMatrix.toArray(true, shader.uniforms.projectionMatrix.value);

        if (light.useViewportQuad) {
            // update verts to ensure it is a fullscreen quad even if the renderer is resized. This should be optimized
            light.vertices[2] = light.vertices[4] = renderer.width;
            light.vertices[5] = light.vertices[7] = renderer.height;
        }

        light.syncShader(shader);

        shader.syncUniforms();

        // have to set these manually due to the way pixi base shader makes assumptions about texture units
        gl.uniform1i(shader.uniforms.uSampler._location, 0);
        gl.uniform1i(shader.uniforms.uNormalSampler._location, 1);

        if (!light.needsUpdate)
        {
            // update vertex data
            gl.bindBuffer(gl.ARRAY_BUFFER, light._vertexBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, light.vertices);
            gl.vertexAttribPointer(shader.attributes.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

            // bind diffuse texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, diffuseTexture.baseTexture._glTextures[gl.id]);

            // bind normal texture
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, normalsTexture.baseTexture._glTextures[gl.id]);

            // update indices
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, light._indexBuffer);
            gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, light.indices);
        }
        else
        {
            light.needsUpdate = false;

            // upload vertex data
            gl.bindBuffer(gl.ARRAY_BUFFER, light._vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, light.vertices, gl.STATIC_DRAW);
            gl.vertexAttribPointer(shader.attributes.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

            // bind diffuse texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, diffuseTexture.baseTexture._glTextures[gl.id]);

            // bind normal texture
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, normalsTexture.baseTexture._glTextures[gl.id]);

            // static upload of index buffer
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, light._indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, light.indices, gl.STATIC_DRAW);
        }

        gl.drawElements(renderer.drawModes[light.drawMode], light.indices.length, gl.UNSIGNED_SHORT, 0);
        renderer.drawCount++;
    }

    this.currentBatchSize = 0;
};

/**
 * Prepares all the buffers to render this light.
 *
 * @param light {Light} The light object to prepare for rendering.
 */
LightRenderer.prototype._initWebGL = function (light)
{
    var gl = this.renderer.gl;

    // create the buffers
    light._vertexBuffer = gl.createBuffer();
    light._indexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, light._vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, light.vertices, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, light._indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, light.indices, gl.STATIC_DRAW);
};

LightRenderer.prototype.destroy = function ()
{
    
};

},{}],13:[function(require,module,exports){
/**
 * The WebGLDeferredRenderer draws the scene and all its content onto a webGL enabled canvas. This renderer
 * should be used for browsers that support webGL. This Render works by automatically managing webGLBatchs.
 * So no need for Sprite Batches or Sprite Clouds.
 * Don't forget to add the view to your DOM or you will not see anything :)
 *
 * @class
 * @memberof PIXI.lights
 * @extends PIXI.SystemRenderer
 * @param [width=0] {number} the width of the canvas view
 * @param [height=0] {number} the height of the canvas view
 * @param [options] {object} The optional renderer parameters
 * @param [options.view] {HTMLCanvasElement} the canvas to use as a view, optional
 * @param [options.transparent=false] {boolean} If the render view is transparent, default false
 * @param [options.autoResize=false] {boolean} If the render view is automatically resized, default false
 * @param [options.antialias=false] {boolean} sets antialias. If not available natively then FXAA antialiasing is used
 * @param [options.forceFXAA=false] {boolean} forces FXAA antialiasing to be used over native. FXAA is faster, but may not always lok as great
 * @param [options.resolution=1] {number} the resolution of the renderer retina would be 2
 * @param [options.clearBeforeRender=true] {boolean} This sets if the CanvasRenderer will clear the canvas or
 *      not before the new render pass.
 * @param [options.preserveDrawingBuffer=false] {boolean} enables drawing buffer preservation, enable this if
 *      you need to call toDataUrl on the webgl context.
 */
function WebGLDeferredRenderer(width, height, options)
{
    options = options || {};

    this.renderingNormals = false;
    this.renderingUnlit = false;
    this._forwardRender = PIXI.WebGLRenderer.prototype.render;

    PIXI.WebGLRenderer.call(this, width, height, options);
}

WebGLDeferredRenderer.prototype = Object.create(PIXI.WebGLRenderer.prototype);
WebGLDeferredRenderer.prototype.constructor = WebGLDeferredRenderer;
module.exports = WebGLDeferredRenderer;

/** @lends PIXI.DisplayObject# */
Object.assign(WebGLDeferredRenderer.prototype, {
    /**
     * Initializes the context and necessary framebuffers.
     */
    _initContext: function ()
    {
        // call parent init
        PIXI.WebGLRenderer.prototype._initContext.call(this);

        // first create our render targets.
        this.diffuseTexture = new PIXI.RenderTexture(this, this.width, this.height, null, this.resolution);
        this.normalsTexture = new PIXI.RenderTexture(this, this.width, this.height, null, this.resolution);
    },

    // TODO Optimizations:
    // Only call `updateTransform` once, right now it is call each render pass.
    // Optimize render texture rendering to reduce duplication, or use render targets directly.
    // Cache tree transversal, cache elements to use for each render pass?

    render: function (object, renderLight)
    {
        // no point rendering if our context has been blown up!
        if (this.gl.isContextLost())
        {
            return;
        }

        this.drawCount = 0;

        this._lastObjectRendered = object;

        /////////////
        //  Rendering
        this.renderingUnlit = false;

        // render diffuse
        this.renderingNormals = false;
        this.diffuseTexture.render(object);

        // render normals

        this.renderingNormals = true;
        this.normalsTexture.render(object);
        
        

        // render lights
        
        this.setRenderTarget(this.renderTarget);
        this.setObjectRenderer(this.plugins.lights);
        this.plugins.lights.flush();
        
        // forward render unlit objects (no normal texture)
        var cbr = this.clearBeforeRender,
            draws = this.drawCount;

        this.renderingNormals = false;
        this.renderingUnlit = true;
        this.clearBeforeRender = false;

        this._forwardRender(object);
        this.clearBeforeRender = cbr;
        this.drawCount += draws;
        /////////////
    }
});

},{}],14:[function(require,module,exports){
/**
 * Creates vertices and indices arrays to describe this circle.
 * 
 * @param [totalSegments=40] {number} Total segments to build for the circle mesh.
 * @param [verticesOutput] {Float32Array} An array to output the vertices into. Length must be
 *  `((totalSegments + 2) * 2)` or more. If not passed it is created for you.
 * @param [indicesOutput] {Uint16Array} An array to output the indices into, in gl.TRIANGLE_FAN format. Length must
 *  be `(totalSegments + 3)` or more. If not passed it is created for you.
 */
PIXI.Circle.prototype.getMesh = function (totalSegments, vertices, indices)
{
    totalSegments = totalSegments || 40;

    vertices = vertices || new Float32Array((totalSegments + 1) * 2);
    indices = indices || new Uint16Array(totalSegments + 1);

    var seg = (Math.PI * 2) / totalSegments,
        indicesIndex = -1;

    indices[++indicesIndex] = indicesIndex;

    for (var i = 0; i <= totalSegments; ++i)
    {
        var index = i*2;
        var angle = seg * i;

        vertices[index] = Math.cos(angle) * this.radius;
        vertices[index+1] = Math.sin(angle) * this.radius;

        indices[++indicesIndex] = indicesIndex;
    }

    indices[indicesIndex] = 1;

    return {
        vertices: vertices,
        indices: indices
    };
};

PIXI.Ellipse.prototype.getMesh = function(totalSegments, vertices, indices){
    totalSegments = totalSegments || 40;

    vertices = vertices || new Float32Array((totalSegments + 1) * 2);
    indices = indices || new Uint16Array(totalSegments + 1);

    var seg = (Math.PI * 2) / totalSegments,
    indicesIndex = -1;

    indices[++indicesIndex] = indicesIndex;

    for (var i = 0; i <= totalSegments; ++i)
    {
        var index = i*2;
        var angle = seg * i;

        vertices[index] = Math.cos(angle) * this.width/2;
        vertices[index+1] = Math.sin(angle) * this.height/2;

        indices[++indicesIndex] = indicesIndex;
    }

    indices[indicesIndex] = 1;

    return {
        vertices: vertices,
        indices: indices
    };
}

},{}]},{},[1])

//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvc3JjL2luZGV4IiwiY2xpZW50L3NyYy9saWdodFNwcml0ZU1peGluLmpzIiwiY2xpZW50L3NyYy9saWdodHMvV2lyZWZyYW1lU2hhZGVyLmpzIiwiY2xpZW50L3NyYy9saWdodHMvYW1iaWVudExpZ2h0L0FtYmllbnRMaWdodC5qcyIsImNsaWVudC9zcmMvbGlnaHRzL2FtYmllbnRMaWdodC9BbWJpZW50TGlnaHRTaGFkZXIuanMiLCJjbGllbnQvc3JjL2xpZ2h0cy9kaXJlY3Rpb25hbExpZ2h0L0RpcmVjdGlvbmFsTGlnaHQuanMiLCJjbGllbnQvc3JjL2xpZ2h0cy9kaXJlY3Rpb25hbExpZ2h0L0RpcmVjdGlvbmFsTGlnaHRTaGFkZXIuanMiLCJjbGllbnQvc3JjL2xpZ2h0cy9saWdodC9MaWdodC5qcyIsImNsaWVudC9zcmMvbGlnaHRzL2xpZ2h0L0xpZ2h0U2hhZGVyLmpzIiwiY2xpZW50L3NyYy9saWdodHMvcG9pbnRMaWdodC9Qb2ludExpZ2h0LmpzIiwiY2xpZW50L3NyYy9saWdodHMvcG9pbnRMaWdodC9Qb2ludExpZ2h0U2hhZGVyLmpzIiwiY2xpZW50L3NyYy9yZW5kZXJlcnMvTGlnaHRSZW5kZXJlci5qcyIsImNsaWVudC9zcmMvcmVuZGVyZXJzL1dlYkdMRGVmZXJyZWRSZW5kZXJlci5qcyIsImNsaWVudC9zcmMvc2hhcGVNZXNoTWl4aW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gUElYSS5saWdodHMgPSB7XHJcbi8vICAgIExpdFNwcml0ZTogcmVxdWlyZSgnLi9saWdodF8xL0xpdFNwcml0ZScpLFxyXG4vLyAgICBMaWdodGluZ1JlbmRlcmVyOiByZXF1aXJlKCcuL2xpZ2h0XzEvd2ViZ2wvTGlnaHRpbmdSZW5kZXJlcicpXHJcblxyXG4gICAgTGlnaHQ6ICAgICAgICAgICAgICAgICAgcmVxdWlyZSgnLi9saWdodHMvbGlnaHQvTGlnaHQnKSxcclxuICAgIExpZ2h0U2hhZGVyOiAgICAgICAgICAgIHJlcXVpcmUoJy4vbGlnaHRzL2xpZ2h0L0xpZ2h0U2hhZGVyJyksXHJcblxyXG4gICAgQW1iaWVudExpZ2h0OiAgICAgICAgICAgcmVxdWlyZSgnLi9saWdodHMvYW1iaWVudExpZ2h0L0FtYmllbnRMaWdodCcpLFxyXG4gICAgQW1iaWVudExpZ2h0U2hhZGVyOiAgICAgcmVxdWlyZSgnLi9saWdodHMvYW1iaWVudExpZ2h0L0FtYmllbnRMaWdodFNoYWRlcicpLFxyXG5cclxuICAgIFBvaW50TGlnaHQ6ICAgICAgICAgICAgIHJlcXVpcmUoJy4vbGlnaHRzL3BvaW50TGlnaHQvUG9pbnRMaWdodCcpLFxyXG4gICAgUG9pbnRMaWdodFNoYWRlcjogICAgICAgcmVxdWlyZSgnLi9saWdodHMvcG9pbnRMaWdodC9Qb2ludExpZ2h0U2hhZGVyJyksXHJcblxyXG4gICAgRGlyZWN0aW9uYWxMaWdodDogICAgICAgICAgICAgcmVxdWlyZSgnLi9saWdodHMvZGlyZWN0aW9uYWxMaWdodC9EaXJlY3Rpb25hbExpZ2h0JyksXHJcbiAgICBEaXJlY3Rpb25hbExpZ2h0U2hhZGVyOiAgICAgICByZXF1aXJlKCcuL2xpZ2h0cy9kaXJlY3Rpb25hbExpZ2h0L0RpcmVjdGlvbmFsTGlnaHRTaGFkZXInKSxcclxuXHJcbiAgICBMaWdodFJlbmRlcmVyOiAgICAgICAgICByZXF1aXJlKCcuL3JlbmRlcmVycy9MaWdodFJlbmRlcmVyJyksXHJcbiAgICBXZWJHTERlZmVycmVkUmVuZGVyZXI6ICByZXF1aXJlKCcuL3JlbmRlcmVycy9XZWJHTERlZmVycmVkUmVuZGVyZXInKSxcclxuXHJcbiAgICBXaXJlZnJhbWVTaGFkZXI6ICAgICAgICByZXF1aXJlKCcuL2xpZ2h0cy9XaXJlZnJhbWVTaGFkZXInKVxyXG59O1xyXG5cclxucmVxdWlyZSgnLi9saWdodFNwcml0ZU1peGluJyk7XHJcbnJlcXVpcmUoJy4vc2hhcGVNZXNoTWl4aW4nKTtcclxuIiwidmFyIHRlbXBUZXh0dXJlID0gbnVsbDtcclxuXHJcbiAvKipcclxuICogUmVuZGVycyB0aGUgb2JqZWN0IHVzaW5nIHRoZSBXZWJHTCByZW5kZXJlclxyXG4gKlxyXG4gKiBAcGFyYW0gcmVuZGVyZXIge1dlYkdMUmVuZGVyZXJ9XHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5QSVhJLlNwcml0ZS5wcm90b3R5cGUuX3JlbmRlcldlYkdMID0gZnVuY3Rpb24gKHJlbmRlcmVyKVxyXG57XHJcbiAgICBpZiAoIXRoaXMuX29yaWdpbmFsVGV4dHVyZSkge1xyXG4gICAgICAgIHRoaXMuX29yaWdpbmFsVGV4dHVyZSA9IHRoaXMuX3RleHR1cmU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdW5saXQgcmVuZGVyIHBhc3NcclxuICAgIGlmIChyZW5kZXJlci5yZW5kZXJpbmdVbmxpdClcclxuICAgIHtcclxuICAgICAgICAvLyBpZiBpdCBoYXMgYSBub3JtYWwgdGV4dHVyZSBpdCBpcyBjb25zaWRlcmVkIFwibGl0XCIsIHNvIHNraXAgaXRcclxuICAgICAgICBpZiAodGhpcy5ub3JtYWxUZXh0dXJlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBvdGhlcndpc2UgZG8gYSBub3JtYWwgZHJhdyBmb3IgdW5saXQgcGFzc1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX3RleHR1cmUgPSB0aGlzLl9vcmlnaW5hbFRleHR1cmU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gbm9ybWFscyByZW5kZXIgcGFzc1xyXG4gICAgZWxzZSBpZiAocmVuZGVyZXIucmVuZGVyaW5nTm9ybWFscylcclxuICAgIHtcclxuICAgICAgICAvLyBpZiBpdCBoYXMgbm8gbm9ybWFsIHRleHR1cmUgaXQgaXMgY29uc2lkZXJlZCBcInVubGl0XCIsIHNvIHNraXAgaXRcclxuICAgICAgICBpZiAoIXRoaXMubm9ybWFsVGV4dHVyZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fdGV4dHVyZSA9IHRoaXMubm9ybWFsVGV4dHVyZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBkaWZmdXNlIHJlbmRlciBwYXNzLCBhbHdheXMganVzdCBkcmF3IHRoZSB0ZXh0dXJlXHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fdGV4dHVyZSA9IHRoaXMuX29yaWdpbmFsVGV4dHVyZTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXJlci5zZXRPYmplY3RSZW5kZXJlcihyZW5kZXJlci5wbHVnaW5zLnNwcml0ZSk7XHJcbiAgICByZW5kZXJlci5wbHVnaW5zLnNwcml0ZS5yZW5kZXIodGhpcyk7XHJcbn07XHJcbiIsIlxyXG5cclxuLyoqXHJcbiAqIEBjbGFzc1xyXG4gKiBAZXh0ZW5kcyBQSVhJLlNoYWRlclxyXG4gKiBAbWVtYmVyb2YgUElYSS5saWdodHNcclxuICogQHBhcmFtIHNoYWRlck1hbmFnZXIge1NoYWRlck1hbmFnZXJ9IFRoZSBXZWJHTCBzaGFkZXIgbWFuYWdlciB0aGlzIHNoYWRlciB3b3JrcyBmb3IuXHJcbiAqL1xyXG5mdW5jdGlvbiBXaXJlZnJhbWVTaGFkZXIoc2hhZGVyTWFuYWdlcikge1xyXG4gICAgUElYSS5TaGFkZXIuY2FsbCh0aGlzLFxyXG4gICAgICAgIHNoYWRlck1hbmFnZXIsXHJcbiAgICAgICAgLy8gdmVydGV4IHNoYWRlclxyXG4gICAgICAgIFtcclxuICAgICAgICAgICAgJ3ByZWNpc2lvbiBsb3dwIGZsb2F0OycsXHJcblxyXG4gICAgICAgICAgICAnYXR0cmlidXRlIHZlYzIgYVZlcnRleFBvc2l0aW9uOycsXHJcblxyXG4gICAgICAgICAgICAndW5pZm9ybSBtYXQzIHByb2plY3Rpb25NYXRyaXg7JyxcclxuXHJcbiAgICAgICAgICAgICd2b2lkIG1haW4odm9pZCkgeycsXHJcbiAgICAgICAgICAgICcgICAgZ2xfUG9zaXRpb24gPSB2ZWM0KChwcm9qZWN0aW9uTWF0cml4ICogdmVjMyhhVmVydGV4UG9zaXRpb24sIDEuMCkpLnh5LCAwLjAsIDEuMCk7JyxcclxuICAgICAgICAgICAgJ30nXHJcbiAgICAgICAgXS5qb2luKCdcXG4nKSxcclxuICAgICAgICAvLyBmcmFnbWVudCBzaGFkZXJcclxuICAgICAgICBbXHJcbiAgICAgICAgICAgICd2b2lkIG1haW4oKSB7JyxcclxuICAgICAgICAgICAgJyAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KDAsIDAsIDAsIDEpOycsXHJcbiAgICAgICAgICAgICd9J1xyXG4gICAgICAgIF0uam9pbignXFxuJyksXHJcbiAgICAgICAgLy8gdW5pZm9ybXNcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRyYW5zbGF0aW9uTWF0cml4OiAgeyB0eXBlOiAnbWF0MycsIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KDkpIH0sXHJcbiAgICAgICAgICAgIHByb2plY3Rpb25NYXRyaXg6ICAgeyB0eXBlOiAnbWF0MycsIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KDkpIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIGF0dHJpYnV0ZXNcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGFWZXJ0ZXhQb3NpdGlvbjogMFxyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuXHJcbldpcmVmcmFtZVNoYWRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBJWEkuU2hhZGVyLnByb3RvdHlwZSk7XHJcbldpcmVmcmFtZVNoYWRlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBXaXJlZnJhbWVTaGFkZXI7XHJcbm1vZHVsZS5leHBvcnRzID0gV2lyZWZyYW1lU2hhZGVyO1xyXG5cclxuUElYSS5TaGFkZXJNYW5hZ2VyLnJlZ2lzdGVyUGx1Z2luKCd3aXJlZnJhbWVTaGFkZXInLCBXaXJlZnJhbWVTaGFkZXIpO1xyXG4iLCJ2YXIgTGlnaHQgPSByZXF1aXJlKCcuLi9saWdodC9MaWdodCcpO1xyXG5cclxuLyoqXHJcbiAqIEBjbGFzc1xyXG4gKiBAZXh0ZW5kcyBQSVhJLmxpZ2h0cy5MaWdodFxyXG4gKiBAbWVtYmVyb2YgUElYSS5saWdodHNcclxuICpcclxuICogQHBhcmFtIFtjb2xvcj0weEZGRkZGRl0ge251bWJlcn0gVGhlIGNvbG9yIG9mIHRoZSBsaWdodC5cclxuICogQHBhcmFtIFticmlnaHRuZXNzPTAuNV0ge251bWJlcn0gVGhlIGJyaWdodG5lc3Mgb2YgdGhlIGxpZ2h0LlxyXG4gKi9cclxuZnVuY3Rpb24gQW1iaWVudExpZ2h0KGNvbG9yLCBicmlnaHRuZXNzKSB7XHJcbiAgICAvLyBhbWJpZW50IGxpZ2h0IGlzIGRyYXduIHVzaW5nIGEgZnVsbC1zY3JlZW4gcXVhZFxyXG4gICAgTGlnaHQuY2FsbCh0aGlzLCBjb2xvciwgYnJpZ2h0bmVzcyk7XHJcblxyXG4gICAgdGhpcy5zaGFkZXJOYW1lID0gJ2FtYmllbnRMaWdodFNoYWRlcic7XHJcbn1cclxuXHJcbkFtYmllbnRMaWdodC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKExpZ2h0LnByb3RvdHlwZSk7XHJcbkFtYmllbnRMaWdodC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBBbWJpZW50TGlnaHQ7XHJcbm1vZHVsZS5leHBvcnRzID0gQW1iaWVudExpZ2h0O1xyXG5cclxuQW1iaWVudExpZ2h0LnByb3RvdHlwZS5yZW5kZXJXZWJHTCA9IGZ1bmN0aW9uIChyZW5kZXJlcilcclxue1xyXG4gICAgLy8gYWRkIGxpZ2h0cyB0byB0aGVpciByZW5kZXJlciBvbiB0aGUgbm9ybWFscyBwYXNzXHJcbiAgICBpZiAoIXJlbmRlcmVyLnJlbmRlcmluZ05vcm1hbHMpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSSBhY3R1YWxseSBkb24ndCB3YW50IHRvIGludGVycnVwdCB0aGUgY3VycmVudCBiYXRjaCwgc28gZG9uJ3Qgc2V0IGxpZ2h0IGFzIHRoZSBjdXJyZW50IG9iamVjdCByZW5kZXJlci5cclxuICAgIC8vIExpZ2h0IHJlbmRlcmVyIHdvcmtzIGEgYml0IGRpZmZlcmVudGx5IGluIHRoYXQgbGlnaHRzIGFyZSBkcmF3IGluZGl2aWR1YWxseSBvbiBmbHVzaCAoY2FsbGVkIGJ5IFdlYkdMRGVmZXJyZWRSZW5kZXJlcikuXHJcbiAgICAvL3JlbmRlcmVyLnNldE9iamVjdFJlbmRlcmVyKHJlbmRlcmVyLnBsdWdpbnMubGlnaHRzKTtcclxuXHJcbiAgICByZW5kZXJlci5wbHVnaW5zLmxpZ2h0cy5yZW5kZXIodGhpcyk7XHJcbn07XHJcbiIsInZhciBMaWdodFNoYWRlciA9IHJlcXVpcmUoJy4uL2xpZ2h0L0xpZ2h0U2hhZGVyJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEBjbGFzc1xyXG4gKiBAZXh0ZW5kcyBQSVhJLlNoYWRlclxyXG4gKiBAbWVtYmVyb2YgUElYSS5saWdodHNcclxuICogQHBhcmFtIHNoYWRlck1hbmFnZXIge1NoYWRlck1hbmFnZXJ9IFRoZSBXZWJHTCBzaGFkZXIgbWFuYWdlciB0aGlzIHNoYWRlciB3b3JrcyBmb3IuXHJcbiAqL1xyXG5mdW5jdGlvbiBBbWJpZW50TGlnaHRTaGFkZXIoc2hhZGVyTWFuYWdlcikge1xyXG4gICAgTGlnaHRTaGFkZXIuY2FsbCh0aGlzLFxyXG4gICAgICAgIHNoYWRlck1hbmFnZXIsXHJcbiAgICAgICAgLy8gdmVydGV4IHNoYWRlclxyXG4gICAgICAgIG51bGwsXHJcbiAgICAgICAgLy8gZnJhZ21lbnQgc2hhZGVyXHJcbiAgICAgICAgXCJwcmVjaXNpb24gbG93cCBmbG9hdDtcXG4jZGVmaW5lIEdMU0xJRlkgMVxcblxcbnVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1xcbnVuaWZvcm0gc2FtcGxlcjJEIHVOb3JtYWxTYW1wbGVyO1xcblxcbnVuaWZvcm0gbWF0MyB0cmFuc2xhdGlvbk1hdHJpeDtcXG5cXG51bmlmb3JtIHZlYzIgdVZpZXdTaXplOyAgICAgLy8gc2l6ZSBvZiB0aGUgdmlld3BvcnRcXG5cXG51bmlmb3JtIHZlYzQgdUxpZ2h0Q29sb3I7ICAgLy8gbGlnaHQgY29sb3IsIGFscGhhIGNoYW5uZWwgdXNlZCBmb3IgaW50ZW5zaXR5LlxcbnVuaWZvcm0gdmVjMyB1TGlnaHRGYWxsb2ZmOyAvLyBsaWdodCBhdHRlbnVhdGlvbiBjb2VmZmljaWVudHMgKGNvbnN0YW50LCBsaW5lYXIsIHF1YWRyYXRpYylcXG51bmlmb3JtIGZsb2F0IHVMaWdodEhlaWdodDsgLy8gbGlnaHQgaGVpZ2h0IGFib3ZlIHRoZSB2aWV3cG9ydFxcblxcblxcbnZvaWQgbWFpbih2b2lkKVxcbntcXG52ZWMyIHRleENvb3JkID0gZ2xfRnJhZ0Nvb3JkLnh5IC8gdVZpZXdTaXplO1xcbnRleENvb3JkLnkgPSAxLjAgLSB0ZXhDb29yZC55OyAvLyBGQk9zIHBvc2l0aW9ucyBhcmUgZmxpcHBlZC5cXG5cXG52ZWM0IG5vcm1hbENvbG9yID0gdGV4dHVyZTJEKHVOb3JtYWxTYW1wbGVyLCB0ZXhDb29yZCk7XFxubm9ybWFsQ29sb3IuZyA9IDEuMCAtIG5vcm1hbENvbG9yLmc7IC8vIEdyZWVuIGxheWVyIGlzIGZsaXBwZWQgWSBjb29yZHMuXFxuXFxuLy8gYmFpbCBvdXQgZWFybHkgd2hlbiBub3JtYWwgaGFzIG5vIGRhdGFcXG5pZiAobm9ybWFsQ29sb3IuYSA9PSAwLjApIGRpc2NhcmQ7XFxuXFxuXFxuICAgIC8vIHNpbXBsaWZpZWQgbGFtYmVydCBzaGFkaW5nIHRoYXQgbWFrZXMgYXNzdW1wdGlvbnMgZm9yIGFtYmllbnQgY29sb3JcXG5cXG4gICAgLy8gY29tcHV0ZSBEaXN0YW5jZVxcbiAgICBmbG9hdCBEID0gMS4wO1xcbiAgICBcXG4gICAgLy8gbm9ybWFsaXplIHZlY3RvcnNcXG4gICAgdmVjMyBOID0gbm9ybWFsaXplKG5vcm1hbENvbG9yLnh5eiAqIDIuMCAtIDEuMCk7XFxuICAgIHZlYzMgTCA9IHZlYzMoMS4wLCAxLjAsIDEuMCk7XFxuICAgIFxcbiAgICAvLyBwcmUtbXVsdGlwbHkgbGlnaHQgY29sb3Igd2l0aCBpbnRlbnNpdHlcXG4gICAgLy8gdGhlbiBwZXJmb3JtIFxcXCJOIGRvdCBMXFxcIiB0byBkZXRlcm1pbmUgb3VyIGRpZmZ1c2VcXG4gICAgdmVjMyBkaWZmdXNlID0gKHVMaWdodENvbG9yLnJnYiAqIHVMaWdodENvbG9yLmEpICogbWF4KGRvdChOLCBMKSwgMC4wKTtcXG5cXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHRleENvb3JkKTtcXG4gICAgdmVjMyBmaW5hbENvbG9yID0gZGlmZnVzZUNvbG9yLnJnYiAqIGRpZmZ1c2U7XFxuXFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoZmluYWxDb2xvciwgZGlmZnVzZUNvbG9yLmEpO1xcbn1cXG5cIlxyXG4gICAgKTtcclxufVxyXG5cclxuQW1iaWVudExpZ2h0U2hhZGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTGlnaHRTaGFkZXIucHJvdG90eXBlKTtcclxuQW1iaWVudExpZ2h0U2hhZGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEFtYmllbnRMaWdodFNoYWRlcjtcclxubW9kdWxlLmV4cG9ydHMgPSBBbWJpZW50TGlnaHRTaGFkZXI7XHJcblxyXG5QSVhJLlNoYWRlck1hbmFnZXIucmVnaXN0ZXJQbHVnaW4oJ2FtYmllbnRMaWdodFNoYWRlcicsIEFtYmllbnRMaWdodFNoYWRlcik7XHJcbiIsInZhciBMaWdodCA9IHJlcXVpcmUoJy4uL2xpZ2h0L0xpZ2h0Jyk7XHJcblxyXG4vKipcclxuICogQGNsYXNzXHJcbiAqIEBleHRlbmRzIFBJWEkubGlnaHRzLkxpZ2h0XHJcbiAqIEBtZW1iZXJvZiBQSVhJLmxpZ2h0c1xyXG4gKlxyXG4gKiBAcGFyYW0gW2NvbG9yPTB4RkZGRkZGXSB7bnVtYmVyfSBUaGUgY29sb3Igb2YgdGhlIGxpZ2h0LlxyXG4gKiBAcGFyYW0gW2JyaWdodG5lc3M9MV0ge251bWJlcn0gVGhlIGludGVuc2l0eSBvZiB0aGUgbGlnaHQuXHJcbiAqIEBwYXJhbSBbdGFyZ2V0XSB7UElYSS5EaXNwbGF5T2JqZWN0fFBJWEkuUG9pbnR9IFRoZSBvYmplY3QgaW4gdGhlIHNjZW5lIHRvIHRhcmdldC5cclxuICovXHJcbmZ1bmN0aW9uIERpcmVjdGlvbmFsTGlnaHQoY29sb3IsIGJyaWdodG5lc3MsIHRhcmdldCkge1xyXG4gICAgTGlnaHQuY2FsbCh0aGlzLCBjb2xvciwgYnJpZ2h0bmVzcyk7XHJcblxyXG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XHJcbiAgICB0aGlzLl9kaXJlY3Rpb25WZWN0b3IgPSBuZXcgUElYSS5Qb2ludCgpO1xyXG5cclxuICAgIHRoaXMuX3VwZGF0ZVRyYW5zZm9ybSA9IExpZ2h0LnByb3RvdHlwZS51cGRhdGVUcmFuc2Zvcm07XHJcbiAgICB0aGlzLl9zeW5jU2hhZGVyID0gTGlnaHQucHJvdG90eXBlLnN5bmNTaGFkZXI7XHJcblxyXG4gICAgdGhpcy5zaGFkZXJOYW1lID0gJ2RpcmVjdGlvbmFsTGlnaHRTaGFkZXInO1xyXG59XHJcblxyXG5EaXJlY3Rpb25hbExpZ2h0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTGlnaHQucHJvdG90eXBlKTtcclxuRGlyZWN0aW9uYWxMaWdodC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEaXJlY3Rpb25hbExpZ2h0O1xyXG5tb2R1bGUuZXhwb3J0cyA9IERpcmVjdGlvbmFsTGlnaHQ7XHJcblxyXG5EaXJlY3Rpb25hbExpZ2h0LnByb3RvdHlwZS51cGRhdGVUcmFuc2Zvcm0gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLl91cGRhdGVUcmFuc2Zvcm0oKTtcclxuXHJcbiAgICB2YXIgdmVjID0gdGhpcy5fZGlyZWN0aW9uVmVjdG9yLFxyXG4gICAgICAgIHd0ID0gdGhpcy53b3JsZFRyYW5zZm9ybSxcclxuICAgICAgICB0eCA9IHRoaXMudGFyZ2V0LndvcmxkVHJhbnNmb3JtID8gdGhpcy50YXJnZXQud29ybGRUcmFuc2Zvcm0udHggOiB0aGlzLnRhcmdldC54LFxyXG4gICAgICAgIHR5ID0gdGhpcy50YXJnZXQud29ybGRUcmFuc2Zvcm0gPyB0aGlzLnRhcmdldC53b3JsZFRyYW5zZm9ybS50eSA6IHRoaXMudGFyZ2V0Lnk7XHJcblxyXG4gICAgLy8gY2FsY3VsYXRlIGRpcmVjdGlvbiBmcm9tIHRoaXMgbGlnaHQgdG8gdGhlIHRhcmdldFxyXG4gICAgdmVjLnggPSB3dC50eCAtIHR4O1xyXG4gICAgdmVjLnkgPSB3dC50eSAtIHR5O1xyXG5cclxuICAgIC8vIG5vcm1hbGl6ZVxyXG4gICAgdmFyIGxlbiA9IE1hdGguc3FydCh2ZWMueCAqIHZlYy54ICsgdmVjLnkgKiB2ZWMueSk7XHJcbiAgICB2ZWMueCAvPSBsZW47XHJcbiAgICB2ZWMueSAvPSBsZW47XHJcbn07XHJcblxyXG5EaXJlY3Rpb25hbExpZ2h0LnByb3RvdHlwZS5zeW5jU2hhZGVyID0gZnVuY3Rpb24gKHNoYWRlcikge1xyXG4gICAgdGhpcy5fc3luY1NoYWRlcihzaGFkZXIpO1xyXG5cclxuICAgIHNoYWRlci51bmlmb3Jtcy51TGlnaHREaXJlY3Rpb24udmFsdWVbMF0gPSB0aGlzLl9kaXJlY3Rpb25WZWN0b3IueDtcclxuICAgIHNoYWRlci51bmlmb3Jtcy51TGlnaHREaXJlY3Rpb24udmFsdWVbMV0gPSB0aGlzLl9kaXJlY3Rpb25WZWN0b3IueTtcclxufTtcclxuIiwidmFyIExpZ2h0U2hhZGVyID0gcmVxdWlyZSgnLi4vbGlnaHQvTGlnaHRTaGFkZXInKTtcclxuXHJcblxyXG4vKipcclxuICogQGNsYXNzXHJcbiAqIEBleHRlbmRzIFBJWEkuU2hhZGVyXHJcbiAqIEBtZW1iZXJvZiBQSVhJLmxpZ2h0c1xyXG4gKiBAcGFyYW0gc2hhZGVyTWFuYWdlciB7U2hhZGVyTWFuYWdlcn0gVGhlIFdlYkdMIHNoYWRlciBtYW5hZ2VyIHRoaXMgc2hhZGVyIHdvcmtzIGZvci5cclxuICovXHJcbmZ1bmN0aW9uIERpcmVjdGlvbmFsTGlnaHRTaGFkZXIoc2hhZGVyTWFuYWdlcikge1xyXG4gICAgTGlnaHRTaGFkZXIuY2FsbCh0aGlzLFxyXG4gICAgICAgIHNoYWRlck1hbmFnZXIsXHJcbiAgICAgICAgLy8gdmVydGV4IHNoYWRlclxyXG4gICAgICAgIG51bGwsXHJcbiAgICAgICAgLy8gZnJhZ21lbnQgc2hhZGVyXHJcbiAgICAgICAgXCJwcmVjaXNpb24gbG93cCBmbG9hdDtcXG4jZGVmaW5lIEdMU0xJRlkgMVxcblxcbi8vIGltcG9ydHMgdGhlIGNvbW1vbiB1bmlmb3JtcyBsaWtlIHNhbXBsZXJzLCBhbmQgYW1iaWVudC9saWdodCBjb2xvclxcbnVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1xcbnVuaWZvcm0gc2FtcGxlcjJEIHVOb3JtYWxTYW1wbGVyO1xcblxcbnVuaWZvcm0gbWF0MyB0cmFuc2xhdGlvbk1hdHJpeDtcXG5cXG51bmlmb3JtIHZlYzIgdVZpZXdTaXplOyAgICAgLy8gc2l6ZSBvZiB0aGUgdmlld3BvcnRcXG5cXG51bmlmb3JtIHZlYzQgdUxpZ2h0Q29sb3I7ICAgLy8gbGlnaHQgY29sb3IsIGFscGhhIGNoYW5uZWwgdXNlZCBmb3IgaW50ZW5zaXR5LlxcbnVuaWZvcm0gdmVjMyB1TGlnaHRGYWxsb2ZmOyAvLyBsaWdodCBhdHRlbnVhdGlvbiBjb2VmZmljaWVudHMgKGNvbnN0YW50LCBsaW5lYXIsIHF1YWRyYXRpYylcXG51bmlmb3JtIGZsb2F0IHVMaWdodEhlaWdodDsgLy8gbGlnaHQgaGVpZ2h0IGFib3ZlIHRoZSB2aWV3cG9ydFxcblxcblxcbnVuaWZvcm0gdmVjMiB1TGlnaHREaXJlY3Rpb247XFxuXFxudm9pZCBtYWluKClcXG57XFxudmVjMiB0ZXhDb29yZCA9IGdsX0ZyYWdDb29yZC54eSAvIHVWaWV3U2l6ZTtcXG50ZXhDb29yZC55ID0gMS4wIC0gdGV4Q29vcmQueTsgLy8gRkJPcyBwb3NpdGlvbnMgYXJlIGZsaXBwZWQuXFxuXFxudmVjNCBub3JtYWxDb2xvciA9IHRleHR1cmUyRCh1Tm9ybWFsU2FtcGxlciwgdGV4Q29vcmQpO1xcbm5vcm1hbENvbG9yLmcgPSAxLjAgLSBub3JtYWxDb2xvci5nOyAvLyBHcmVlbiBsYXllciBpcyBmbGlwcGVkIFkgY29vcmRzLlxcblxcbi8vIGJhaWwgb3V0IGVhcmx5IHdoZW4gbm9ybWFsIGhhcyBubyBkYXRhXFxuaWYgKG5vcm1hbENvbG9yLmEgPT0gMC4wKSBkaXNjYXJkO1xcblxcblxcbiAgICAvLyB0aGUgZGlyZWN0aW9uYWwgdmVjdG9yIG9mIHRoZSBsaWdodFxcbiAgICB2ZWMzIGxpZ2h0VmVjdG9yID0gdmVjMyh1TGlnaHREaXJlY3Rpb24sIHVMaWdodEhlaWdodCk7XFxuXFxuICAgIC8vIGNvbXB1dGUgRGlzdGFuY2VcXG4gICAgZmxvYXQgRCA9IGxlbmd0aChsaWdodFZlY3Rvcik7XFxuXFxuLy8gbm9ybWFsaXplIHZlY3RvcnNcXG52ZWMzIE4gPSBub3JtYWxpemUobm9ybWFsQ29sb3IueHl6ICogMi4wIC0gMS4wKTtcXG52ZWMzIEwgPSBub3JtYWxpemUobGlnaHRWZWN0b3IpO1xcblxcbi8vIHByZS1tdWx0aXBseSBsaWdodCBjb2xvciB3aXRoIGludGVuc2l0eVxcbi8vIHRoZW4gcGVyZm9ybSBcXFwiTiBkb3QgTFxcXCIgdG8gZGV0ZXJtaW5lIG91ciBkaWZmdXNlXFxudmVjMyBkaWZmdXNlID0gKHVMaWdodENvbG9yLnJnYiAqIHVMaWdodENvbG9yLmEpICogbWF4KGRvdChOLCBMKSwgMC4wKTtcXG5cXG5cXG4gICAgLy8gY2FsY3VsYXRlIGF0dGVudWF0aW9uXFxuICAgIGZsb2F0IGF0dGVudWF0aW9uID0gMS4wO1xcblxcbi8vIGNhbGN1bGF0ZSBmaW5hbCBpbnRlc2l0eSBhbmQgY29sb3IsIHRoZW4gY29tYmluZVxcbnZlYzMgaW50ZW5zaXR5ID0gZGlmZnVzZSAqIGF0dGVudWF0aW9uO1xcbnZlYzQgZGlmZnVzZUNvbG9yID0gdGV4dHVyZTJEKHVTYW1wbGVyLCB0ZXhDb29yZCk7XFxudmVjMyBmaW5hbENvbG9yID0gZGlmZnVzZUNvbG9yLnJnYiAqIGludGVuc2l0eTtcXG5cXG5nbF9GcmFnQ29sb3IgPSB2ZWM0KGZpbmFsQ29sb3IsIGRpZmZ1c2VDb2xvci5hKTtcXG5cXG59XFxuXCIsXHJcbiAgICAgICAgLy8gY3VzdG9tIHVuaWZvcm1zXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLyB0aGUgZGlyZWN0aW9uYWwgdmVjdG9yIG9mIHRoZSBsaWdodFxyXG4gICAgICAgICAgICB1TGlnaHREaXJlY3Rpb246IHsgdHlwZTogJzJmJywgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoMikgfVxyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuXHJcbkRpcmVjdGlvbmFsTGlnaHRTaGFkZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShMaWdodFNoYWRlci5wcm90b3R5cGUpO1xyXG5EaXJlY3Rpb25hbExpZ2h0U2hhZGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERpcmVjdGlvbmFsTGlnaHRTaGFkZXI7XHJcbm1vZHVsZS5leHBvcnRzID0gRGlyZWN0aW9uYWxMaWdodFNoYWRlcjtcclxuXHJcblBJWEkuU2hhZGVyTWFuYWdlci5yZWdpc3RlclBsdWdpbignZGlyZWN0aW9uYWxMaWdodFNoYWRlcicsIERpcmVjdGlvbmFsTGlnaHRTaGFkZXIpO1xyXG4iLCIvKipcclxuICogRXhjdXNlIHRoZSBtZXNzLCBoYXZlbid0IGNsZWFuZWQgdGhpcyB1cCB5ZXQhXHJcbiAqL1xyXG5cclxuXHJcblxyXG4vKipcclxuICogQGNsYXNzXHJcbiAqIEBleHRlbmRzIFBJWEkuRGlzcGxheU9iamVjdFxyXG4gKiBAbWVtYmVyb2YgUElYSS5saWdodHNcclxuICpcclxuICogQHBhcmFtIFtjb2xvcj0weEZGRkZGRl0ge251bWJlcn0gVGhlIGNvbG9yIG9mIHRoZSBsaWdodC5cclxuICogQHBhcmFtIFticmlnaHRuZXNzPTFdIHtudW1iZXJ9IFRoZSBicmlnaHRuZXNzIG9mIHRoZSBsaWdodCwgaW4gcmFuZ2UgWzAsIDFdLlxyXG4gKi9cclxuZnVuY3Rpb24gTGlnaHQoY29sb3IsIGJyaWdodG5lc3MsIHZlcnRpY2VzLCBpbmRpY2VzKSB7XHJcbiAgICBpZiAodGhpcy5jb25zdHJ1Y3RvciA9PT0gTGlnaHQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpZ2h0IGlzIGFuIGFic3RyYWN0IGJhc2UgY2xhc3MsIGl0IHNob3VsZCBub3QgYmUgY3JlYXRlZCBkaXJlY3RseSEnKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgUElYSS5EaXNwbGF5T2JqZWN0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBbiBhcnJheSBvZiB2ZXJ0aWNlc1xyXG4gICAgICpcclxuICAgICAqIEBtZW1iZXIge0Zsb2F0MzJBcnJheX1cclxuICAgICAqL1xyXG4gICAgdGhpcy52ZXJ0aWNlcyA9IHZlcnRpY2VzIHx8IG5ldyBGbG9hdDMyQXJyYXkoOCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBbiBhcnJheSBjb250YWluaW5nIHRoZSBpbmRpY2VzIG9mIHRoZSB2ZXJ0aWNlc1xyXG4gICAgICpcclxuICAgICAqIEBtZW1iZXIge1VpbnQxNkFycmF5fVxyXG4gICAgICovXHJcbiAgICB0aGlzLmluZGljZXMgPSBpbmRpY2VzIHx8IG5ldyBVaW50MTZBcnJheShbMCwxLDIsIDAsMiwzXSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgYmxlbmQgbW9kZSB0byBiZSBhcHBsaWVkIHRvIHRoZSBsaWdodC5cclxuICAgICAqXHJcbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCBDT05TVC5CTEVORF9NT0RFUy5BREQ7XHJcbiAgICAgKi9cclxuICAgIHRoaXMuYmxlbmRNb2RlID0gUElYSS5CTEVORF9NT0RFUy5BREQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZHJhdyBtb2RlIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGxpZ2h0IGdlb21ldHJ5LlxyXG4gICAgICpcclxuICAgICAqIEBtZW1iZXIge251bWJlcn1cclxuICAgICAqIEBkZWZhdWx0IENPTlNULkRSQVdfTU9ERVMuVFJJQU5HTEVTO1xyXG4gICAgICovXHJcbiAgICB0aGlzLmRyYXdNb2RlID0gUElYSS5EUkFXX01PREVTLlRSSUFOR0xFUztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZW4gc2V0LCB0aGUgcmVuZGVyZXIgd2lsbCByZXVwbG9hZCB0aGUgZ2VvbWV0cnkgZGF0YS5cclxuICAgICAqIFxyXG4gICAgICogQG1lbWJlciB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5uZWVkc1VwZGF0ZSA9IHRydWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgaGVpZ2h0IG9mIHRoZSBsaWdodCBmcm9tIHRoZSB2aWV3cG9ydC5cclxuICAgICAqXHJcbiAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XHJcbiAgICAgKiBAZGVmYXVsdCAwLjA3NVxyXG4gICAgICovXHJcbiAgICB0aGlzLmhlaWdodCA9IDAuMDc1O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGZhbGxvZmYgYXR0ZW51YXRpb24gY29lZmljaWVudHMuXHJcbiAgICAgKlxyXG4gICAgICogQG1lbWJlciB7bnVtYmVyW119XHJcbiAgICAgKiBAZGVmYXVsdCBbMC43NSwgMywgMjBdXHJcbiAgICAgKi9cclxuICAgIHRoaXMuZmFsbG9mZiA9IFswLjc1LCAzLCAyMF07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbmFtZSBvZiB0aGUgc2hhZGVyIHBsdWdpbiB0byB1c2UuXHJcbiAgICAgKlxyXG4gICAgICogQG1lbWJlciB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnNoYWRlck5hbWUgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQnkgZGVmYXVsdCB0aGUgbGlnaHQgdXNlcyBhIHZpZXdwb3J0IHNpemVkIHF1YWQgYXMgdGhlIG1lc2guXHJcbiAgICAgKi9cclxuICAgIHRoaXMudXNlVmlld3BvcnRRdWFkID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcclxuXHJcbiAgICAvLyB3ZWJnbCBidWZmZXJzXHJcbiAgICB0aGlzLl92ZXJ0ZXhCdWZmZXIgPSBudWxsO1xyXG4gICAgdGhpcy5faW5kZXhCdWZmZXIgPSBudWxsO1xyXG5cclxuICAgIC8vIGNvbG9yIGFuZCBicmlnaHRuZXNzIGFyZSBleHBvc2VkIHRocm91Z2ggc2V0dGVyc1xyXG4gICAgdGhpcy5fY29sb3IgPSAweDRkNGQ1OTtcclxuICAgIHRoaXMuX2NvbG9yUmdiYSA9IFswLjMsIDAuMywgMC4zNSwgMC44XTtcclxuXHJcbiAgICAvL29yaWdpbmFsIHBvc2l0aW9uIHgveSAgXHJcbiAgICB0aGlzLm9yaWdpbmFsWDtcclxuICAgIHRoaXMub3JpZ2luYWxZO1xyXG5cclxuICAgIC8vIHJ1biB0aGUgY29sb3Igc2V0dGVyXHJcbiAgICBpZiAoY29sb3IgfHwgY29sb3IgPT09IDApIHtcclxuICAgICAgICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcnVuIHRoZSBicmlnaHRuZXNzIHNldHRlclxyXG4gICAgaWYgKGJyaWdodG5lc3MgfHwgYnJpZ2h0bmVzcyA9PT0gMCkge1xyXG5cclxuICAgICAgICB0aGlzLmJyaWdodG5lc3MgPSBicmlnaHRuZXNzO1xyXG4gICAgfVxyXG59XHJcblxyXG5MaWdodC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBJWEkuRGlzcGxheU9iamVjdC5wcm90b3R5cGUpO1xyXG5MaWdodC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMaWdodDtcclxubW9kdWxlLmV4cG9ydHMgPSBMaWdodDtcclxuXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKExpZ2h0LnByb3RvdHlwZSwge1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY29sb3Igb2YgdGhlIGxpZ2h0aW5nLlxyXG4gICAgICpcclxuICAgICAqIEBtZW1iZXIge251bWJlcn1cclxuICAgICAqIEBtZW1iZXJvZiBMaWdodCNcclxuICAgICAqL1xyXG4gICAgY29sb3I6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29sb3I7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9jb2xvciA9IHZhbDtcclxuICAgICAgICAgICAgUElYSS51dGlscy5oZXgycmdiKHZhbCwgdGhpcy5fY29sb3JSZ2JhKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGJyaWdodG5lc3Mgb2YgdGhpcyBsaWdodGluZy4gTm9ybWFsaXplZCBpbiB0aGUgcmFuZ2UgWzAsIDFdLlxyXG4gICAgICpcclxuICAgICAqIEBtZW1iZXIge251bWJlcn1cclxuICAgICAqIEBtZW1iZXJvZiBMaWdodCNcclxuICAgICAqL1xyXG4gICAgYnJpZ2h0bmVzczoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb2xvclJnYmFbM107XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9jb2xvclJnYmFbM10gPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxuXHJcbkxpZ2h0LnByb3RvdHlwZS5zeW5jU2hhZGVyID0gZnVuY3Rpb24gKHNoYWRlcikge1xyXG4gICAgc2hhZGVyLnVuaWZvcm1zLnVVc2VWaWV3cG9ydFF1YWQudmFsdWUgPSB0aGlzLnVzZVZpZXdwb3J0UXVhZDtcclxuXHJcbiAgICBzaGFkZXIudW5pZm9ybXMudUxpZ2h0Q29sb3IudmFsdWVbMF0gPSB0aGlzLl9jb2xvclJnYmFbMF07XHJcbiAgICBzaGFkZXIudW5pZm9ybXMudUxpZ2h0Q29sb3IudmFsdWVbMV0gPSB0aGlzLl9jb2xvclJnYmFbMV07XHJcbiAgICBzaGFkZXIudW5pZm9ybXMudUxpZ2h0Q29sb3IudmFsdWVbMl0gPSB0aGlzLl9jb2xvclJnYmFbMl07XHJcbiAgICBzaGFkZXIudW5pZm9ybXMudUxpZ2h0Q29sb3IudmFsdWVbM10gPSB0aGlzLl9jb2xvclJnYmFbM107XHJcblxyXG4gICAgc2hhZGVyLnVuaWZvcm1zLnVMaWdodEhlaWdodC52YWx1ZSA9IHRoaXMuaGVpZ2h0O1xyXG5cclxuICAgIHNoYWRlci51bmlmb3Jtcy51TGlnaHRGYWxsb2ZmLnZhbHVlWzBdID0gdGhpcy5mYWxsb2ZmWzBdO1xyXG4gICAgc2hhZGVyLnVuaWZvcm1zLnVMaWdodEZhbGxvZmYudmFsdWVbMV0gPSB0aGlzLmZhbGxvZmZbMV0gKiAzO1xyXG4gICAgc2hhZGVyLnVuaWZvcm1zLnVMaWdodEZhbGxvZmYudmFsdWVbMl0gPSB0aGlzLmZhbGxvZmZbMl0gKiAzO1xyXG59O1xyXG5cclxuTGlnaHQucHJvdG90eXBlLnJlbmRlcldlYkdMID0gZnVuY3Rpb24gKHJlbmRlcmVyKVxyXG57XHJcbiAgICAvLyBhZGQgbGlnaHRzIHRvIHRoZWlyIHJlbmRlcmVyIG9uIHRoZSBub3JtYWxzIHBhc3NcclxuICAgIGlmICghcmVuZGVyZXIucmVuZGVyaW5nTm9ybWFscykge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJIGFjdHVhbGx5IGRvbid0IHdhbnQgdG8gaW50ZXJydXB0IHRoZSBjdXJyZW50IGJhdGNoLCBzbyBkb24ndCBzZXQgbGlnaHQgYXMgdGhlIGN1cnJlbnQgb2JqZWN0IHJlbmRlcmVyLlxyXG4gICAgLy8gTGlnaHQgcmVuZGVyZXIgd29ya3MgYSBiaXQgZGlmZmVyZW50bHkgaW4gdGhhdCBsaWdodHMgYXJlIGRyYXcgaW5kaXZpZHVhbGx5IG9uIGZsdXNoIChjYWxsZWQgYnkgV2ViR0xEZWZlcnJlZFJlbmRlcmVyKS5cclxuICAgIC8vcmVuZGVyZXIuc2V0T2JqZWN0UmVuZGVyZXIocmVuZGVyZXIucGx1Z2lucy5saWdodHMpO1xyXG5cclxuICAgIHJlbmRlcmVyLnBsdWdpbnMubGlnaHRzLnJlbmRlcih0aGlzKTtcclxufTtcclxuXHJcbkxpZ2h0LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKClcclxue1xyXG4gICAgUElYSS5EaXNwbGF5T2JqZWN0LnByb3RvdHlwZS5kZXN0cm95LmNhbGwodGhpcyk7XHJcblxyXG4gICAgLy8gVE9ETzogRGVzdHJveSBidWZmZXJzIVxyXG59O1xyXG5cclxuTGlnaHQuRFJBV19NT0RFUyA9IHtcclxuICAgIFxyXG59O1xyXG4iLCJcclxuXHJcbi8qKlxyXG4gKiBAY2xhc3NcclxuICogQGV4dGVuZHMgUElYSS5TaGFkZXJcclxuICogQG1lbWJlcm9mIFBJWEkubGlnaHRzXHJcbiAqIEBwYXJhbSBzaGFkZXJNYW5hZ2VyIHtTaGFkZXJNYW5hZ2VyfSBUaGUgV2ViR0wgc2hhZGVyIG1hbmFnZXIgdGhpcyBzaGFkZXIgd29ya3MgZm9yLlxyXG4gKi9cclxuZnVuY3Rpb24gTGlnaHRTaGFkZXIoc2hhZGVyTWFuYWdlciwgdmVydGV4U3JjLCBmcmFnbWVudFNyYywgY3VzdG9tVW5pZm9ybXMsIGN1c3RvbUF0dHJpYnV0ZXMpIHtcclxuICAgIHZhciB1bmlmb3JtcyA9IHtcclxuICAgICAgICB0cmFuc2xhdGlvbk1hdHJpeDogIHsgdHlwZTogJ21hdDMnLCB2YWx1ZTogbmV3IEZsb2F0MzJBcnJheSg5KSB9LFxyXG4gICAgICAgIHByb2plY3Rpb25NYXRyaXg6ICAgeyB0eXBlOiAnbWF0MycsIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KDkpIH0sXHJcblxyXG4gICAgICAgIC8vIHRleHR1cmVzIGZyb20gdGhlIHByZXZpb3VzbHkgcmVuZGVyZWQgRkJPc1xyXG4gICAgICAgIHVTYW1wbGVyOiAgICAgICB7IHR5cGU6ICdzYW1wbGVyMkQnLCB2YWx1ZTogbnVsbCB9LFxyXG4gICAgICAgIHVOb3JtYWxTYW1wbGVyOiB7IHR5cGU6ICdzYW1wbGVyMkQnLCB2YWx1ZTogbnVsbCB9LFxyXG5cclxuICAgICAgICAvLyBzaG91bGQgd2UgYXBwbHkgdGhlIHRyYW5zbGF0aW9uIG1hdHJpeCBvciBub3QuXHJcbiAgICAgICAgdVVzZVZpZXdwb3J0UXVhZDogeyB0eXBlOiAnYm9vbCcsIHZhbHVlOiB0cnVlIH0sXHJcblxyXG4gICAgICAgIC8vIHNpemUgb2YgdGhlIHJlbmRlcmVyIHZpZXdwb3J0XHJcbiAgICAgICAgdVZpZXdTaXplOiAgICAgIHsgdHlwZTogJzJmJywgdmFsdWU6IG5ldyBGbG9hdDMyQXJyYXkoMikgfSxcclxuXHJcbiAgICAgICAgLy8gbGlnaHQgY29sb3IsIGFscGhhIGNoYW5uZWwgdXNlZCBmb3IgaW50ZW5zaXR5LlxyXG4gICAgICAgIHVMaWdodENvbG9yOiAgICB7IHR5cGU6ICc0ZicsIHZhbHVlOiBuZXcgRmxvYXQzMkFycmF5KFsxLCAxLCAxLCAxXSkgfSxcclxuXHJcbiAgICAgICAgLy8gbGlnaHQgZmFsbG9mZiBhdHRlbnVhdGlvbiBjb2VmZmljaWVudHNcclxuICAgICAgICB1TGlnaHRGYWxsb2ZmOiAgeyB0eXBlOiAnM2YnLCB2YWx1ZTogbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMF0pIH0sXHJcblxyXG4gICAgICAgIC8vIGhlaWdodCBvZiB0aGUgbGlnaHQgYWJvdmUgdGhlIHZpZXdwb3J0XHJcbiAgICAgICAgdUxpZ2h0SGVpZ2h0OiB7IHR5cGU6ICcxZicsIHZhbHVlOiAwLjA3NSB9XHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChjdXN0b21Vbmlmb3JtcylcclxuICAgIHtcclxuICAgICAgICBmb3IgKHZhciB1IGluIGN1c3RvbVVuaWZvcm1zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdW5pZm9ybXNbdV0gPSBjdXN0b21Vbmlmb3Jtc1t1XTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGF0dHJpYnV0ZXMgPSB7XHJcbiAgICAgICAgYVZlcnRleFBvc2l0aW9uOiAwXHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChjdXN0b21BdHRyaWJ1dGVzKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAodmFyIGEgaW4gY3VzdG9tQXR0cmlidXRlcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGF0dHJpYnV0ZXNbYV0gPSBjdXN0b21BdHRyaWJ1dGVzW2FdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBQSVhJLlNoYWRlci5jYWxsKHRoaXMsIHNoYWRlck1hbmFnZXIsIHZlcnRleFNyYyB8fCBMaWdodFNoYWRlci5kZWZhdWx0VmVydGV4U3JjLCBmcmFnbWVudFNyYywgdW5pZm9ybXMsIGF0dHJpYnV0ZXMpO1xyXG59XHJcblxyXG5MaWdodFNoYWRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBJWEkuU2hhZGVyLnByb3RvdHlwZSk7XHJcbkxpZ2h0U2hhZGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExpZ2h0U2hhZGVyO1xyXG5tb2R1bGUuZXhwb3J0cyA9IExpZ2h0U2hhZGVyO1xyXG5cclxuTGlnaHRTaGFkZXIuZGVmYXVsdFZlcnRleFNyYyA9IFwicHJlY2lzaW9uIGxvd3AgZmxvYXQ7XFxuI2RlZmluZSBHTFNMSUZZIDFcXG5cXG5hdHRyaWJ1dGUgdmVjMiBhVmVydGV4UG9zaXRpb247XFxuXFxudW5pZm9ybSBib29sIHVVc2VWaWV3cG9ydFF1YWQ7XFxudW5pZm9ybSBtYXQzIHRyYW5zbGF0aW9uTWF0cml4O1xcbnVuaWZvcm0gbWF0MyBwcm9qZWN0aW9uTWF0cml4O1xcblxcbnZvaWQgbWFpbih2b2lkKSB7XFxuICAgIGlmICh1VXNlVmlld3BvcnRRdWFkKSB7XFxuICAgICAgICBnbF9Qb3NpdGlvbiA9IHZlYzQoKHByb2plY3Rpb25NYXRyaXggKiB2ZWMzKGFWZXJ0ZXhQb3NpdGlvbiwgMS4wKSkueHksIDAuMCwgMS4wKTtcXG4gICAgfVxcbiAgICBlbHNlXFxuICAgIHtcXG4gICAgICAgIGdsX1Bvc2l0aW9uID0gdmVjNCgocHJvamVjdGlvbk1hdHJpeCAqIHRyYW5zbGF0aW9uTWF0cml4ICogdmVjMyhhVmVydGV4UG9zaXRpb24sIDEuMCkpLnh5LCAwLjAsIDEuMCk7XFxuICAgIH1cXG59XFxuXCI7XHJcbiIsInZhciBMaWdodCA9IHJlcXVpcmUoJy4uL2xpZ2h0L0xpZ2h0Jyk7XHJcblxyXG4vKipcclxuICogQGNsYXNzXHJcbiAqIEBleHRlbmRzIFBJWEkubGlnaHRzLkxpZ2h0XHJcbiAqIEBtZW1iZXJvZiBQSVhJLmxpZ2h0c1xyXG4gKlxyXG4gKiBAcGFyYW0gW2NvbG9yPTB4RkZGRkZGXSB7bnVtYmVyfSBUaGUgY29sb3Igb2YgdGhlIGxpZ2h0LlxyXG4gKiBAcGFyYW0gW2JyaWdodG5lc3M9MV0ge251bWJlcn0gVGhlIGludGVuc2l0eSBvZiB0aGUgbGlnaHQuXHJcbiAqIEBwYXJhbSBbcmFkaXVzPUluZmluaXR5XSB7bnVtYmVyfSBUaGUgZGlzdGFuY2UgdGhlIGxpZ2h0IHJlYWNoZXMuIFlvdSB3aWxsIGxpa2VseSBuZWVkXHJcbiAqICB0byBjaGFuZ2UgdGhlIGZhbGxvZmYgb2YgdGhlIGxpZ2h0IGFzIHdlbGwgaWYgeW91IGNoYW5nZSB0aGlzIHZhbHVlLiBJbmZpbml0eSB3aWxsXHJcbiAqICB1c2UgdGhlIGVudGlyZSB2aWV3cG9ydCBhcyB0aGUgZHJhd2luZyBzdXJmYWNlLlxyXG4gKi9cclxuZnVuY3Rpb24gUG9pbnRMaWdodChjb2xvciwgYnJpZ2h0bmVzcywgcmFkaXVzKSB7XHJcbiAgICByYWRpdXMgPSByYWRpdXMgfHwgSW5maW5pdHk7XHJcblxyXG4gICAgaWYgKHJhZGl1cyAhPT0gSW5maW5pdHkpIHtcclxuICAgICAgICAvLyAgdmFyIHNoYXBlID0gbmV3IFBJWEkuQ2lyY2xlKDAsIDAsIHJhZGl1cyksXHJcbiAgICAgICAgdmFyIHNoYXBlID0gbmV3IFBJWEkuRWxsaXBzZSgwLDAsIDEqcmFkaXVzLCAwLjgqcmFkaXVzKSxcclxuICAgICAgICAgICAgbWVzaCA9IHNoYXBlLmdldE1lc2goKTtcclxuXHJcbiAgICAgICAgTGlnaHQuY2FsbCh0aGlzLCBjb2xvciwgYnJpZ2h0bmVzcywgbWVzaC52ZXJ0aWNlcywgbWVzaC5pbmRpY2VzKTtcclxuXHJcbiAgICAgICAgdGhpcy51c2VWaWV3cG9ydFF1YWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRyYXdNb2RlID0gUElYSS5EUkFXX01PREVTLlRSSUFOR0xFX0ZBTjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIExpZ2h0LmNhbGwodGhpcywgY29sb3IsIGJyaWdodG5lc3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3N5bmNTaGFkZXIgPSBMaWdodC5wcm90b3R5cGUuc3luY1NoYWRlcjtcclxuXHJcbiAgICB0aGlzLnJhZGl1cyA9IHJhZGl1cztcclxuICAgIHRoaXMuc2hhZGVyTmFtZSA9ICdwb2ludExpZ2h0U2hhZGVyJztcclxufVxyXG5cclxuUG9pbnRMaWdodC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKExpZ2h0LnByb3RvdHlwZSk7XHJcblBvaW50TGlnaHQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9pbnRMaWdodDtcclxubW9kdWxlLmV4cG9ydHMgPSBQb2ludExpZ2h0O1xyXG5cclxuUG9pbnRMaWdodC5wcm90b3R5cGUuc3luY1NoYWRlciA9IGZ1bmN0aW9uIChzaGFkZXIpIHtcclxuICAgIHRoaXMuX3N5bmNTaGFkZXIoc2hhZGVyKTtcclxuXHJcbiAgICBzaGFkZXIudW5pZm9ybXMudUxpZ2h0UmFkaXVzLnZhbHVlID0gdGhpcy5yYWRpdXM7XHJcbn1cclxuIiwidmFyIExpZ2h0U2hhZGVyID0gcmVxdWlyZSgnLi4vbGlnaHQvTGlnaHRTaGFkZXInKTtcclxuXHJcblxyXG4vKipcclxuICogQGNsYXNzXHJcbiAqIEBleHRlbmRzIFBJWEkuU2hhZGVyXHJcbiAqIEBtZW1iZXJvZiBQSVhJLmxpZ2h0c1xyXG4gKiBAcGFyYW0gc2hhZGVyTWFuYWdlciB7U2hhZGVyTWFuYWdlcn0gVGhlIFdlYkdMIHNoYWRlciBtYW5hZ2VyIHRoaXMgc2hhZGVyIHdvcmtzIGZvci5cclxuICovXHJcbmZ1bmN0aW9uIFBvaW50TGlnaHRTaGFkZXIoc2hhZGVyTWFuYWdlcikge1xyXG4gICAgTGlnaHRTaGFkZXIuY2FsbCh0aGlzLFxyXG4gICAgICAgIHNoYWRlck1hbmFnZXIsXHJcbiAgICAgICAgLy8gdmVydGV4IHNoYWRlclxyXG4gICAgICAgIG51bGwsXHJcbiAgICAgICAgLy8gZnJhZ21lbnQgc2hhZGVyXHJcbiAgICAgICAgXCJwcmVjaXNpb24gbG93cCBmbG9hdDtcXG4jZGVmaW5lIEdMU0xJRlkgMVxcblxcbi8vIGltcG9ydHMgdGhlIGNvbW1vbiB1bmlmb3JtcyBsaWtlIHNhbXBsZXJzLCBhbmQgYW1iaWVudCBjb2xvclxcbnVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1xcbnVuaWZvcm0gc2FtcGxlcjJEIHVOb3JtYWxTYW1wbGVyO1xcblxcbnVuaWZvcm0gbWF0MyB0cmFuc2xhdGlvbk1hdHJpeDtcXG5cXG51bmlmb3JtIHZlYzIgdVZpZXdTaXplOyAgICAgLy8gc2l6ZSBvZiB0aGUgdmlld3BvcnRcXG5cXG51bmlmb3JtIHZlYzQgdUxpZ2h0Q29sb3I7ICAgLy8gbGlnaHQgY29sb3IsIGFscGhhIGNoYW5uZWwgdXNlZCBmb3IgaW50ZW5zaXR5LlxcbnVuaWZvcm0gdmVjMyB1TGlnaHRGYWxsb2ZmOyAvLyBsaWdodCBhdHRlbnVhdGlvbiBjb2VmZmljaWVudHMgKGNvbnN0YW50LCBsaW5lYXIsIHF1YWRyYXRpYylcXG51bmlmb3JtIGZsb2F0IHVMaWdodEhlaWdodDsgLy8gbGlnaHQgaGVpZ2h0IGFib3ZlIHRoZSB2aWV3cG9ydFxcblxcblxcbnVuaWZvcm0gZmxvYXQgdUxpZ2h0UmFkaXVzO1xcblxcbnZvaWQgbWFpbigpXFxue1xcbnZlYzIgdGV4Q29vcmQgPSBnbF9GcmFnQ29vcmQueHkgLyB1Vmlld1NpemU7XFxudGV4Q29vcmQueSA9IDEuMCAtIHRleENvb3JkLnk7IC8vIEZCT3MgcG9zaXRpb25zIGFyZSBmbGlwcGVkLlxcblxcbnZlYzQgbm9ybWFsQ29sb3IgPSB0ZXh0dXJlMkQodU5vcm1hbFNhbXBsZXIsIHRleENvb3JkKTtcXG5ub3JtYWxDb2xvci5nID0gMS4wIC0gbm9ybWFsQ29sb3IuZzsgLy8gR3JlZW4gbGF5ZXIgaXMgZmxpcHBlZCBZIGNvb3Jkcy5cXG5cXG4vLyBiYWlsIG91dCBlYXJseSB3aGVuIG5vcm1hbCBoYXMgbm8gZGF0YVxcbmlmIChub3JtYWxDb2xvci5hID09IDAuMCkgZGlzY2FyZDtcXG5cXG5cXG4gICAgdmVjMiBsaWdodFBvc2l0aW9uID0gdHJhbnNsYXRpb25NYXRyaXhbMl0ueHkgLyB1Vmlld1NpemU7XFxuXFxuICAgIC8vIHRoZSBkaXJlY3Rpb25hbCB2ZWN0b3Igb2YgdGhlIGxpZ2h0XFxuICAgIHZlYzMgbGlnaHRWZWN0b3IgPSB2ZWMzKGxpZ2h0UG9zaXRpb24gLSB0ZXhDb29yZCwgdUxpZ2h0SGVpZ2h0KTtcXG5cXG4gICAgLy8gY29ycmVjdCBmb3IgYXNwZWN0IHJhdGlvXFxuICAgIGxpZ2h0VmVjdG9yLnggKj0gdVZpZXdTaXplLnggLyB1Vmlld1NpemUueTtcXG5cXG4gICAgLy8gY29tcHV0ZSBEaXN0YW5jZVxcbiAgICBmbG9hdCBEID0gbGVuZ3RoKGxpZ2h0VmVjdG9yKTtcXG5cXG4gICAgLy8gYmFpbCBvdXQgZWFybHkgd2hlbiBwaXhlbCBvdXRzaWRlIG9mIGxpZ2h0IHNwaGVyZVxcbiAgICBpZiAoRCA+IHVMaWdodFJhZGl1cykgZGlzY2FyZDtcXG5cXG4vLyBub3JtYWxpemUgdmVjdG9yc1xcbnZlYzMgTiA9IG5vcm1hbGl6ZShub3JtYWxDb2xvci54eXogKiAyLjAgLSAxLjApO1xcbnZlYzMgTCA9IG5vcm1hbGl6ZShsaWdodFZlY3Rvcik7XFxuXFxuLy8gcHJlLW11bHRpcGx5IGxpZ2h0IGNvbG9yIHdpdGggaW50ZW5zaXR5XFxuLy8gdGhlbiBwZXJmb3JtIFxcXCJOIGRvdCBMXFxcIiB0byBkZXRlcm1pbmUgb3VyIGRpZmZ1c2VcXG52ZWMzIGRpZmZ1c2UgPSAodUxpZ2h0Q29sb3IucmdiICogdUxpZ2h0Q29sb3IuYSkgKiBtYXgoZG90KE4sIEwpLCAwLjApO1xcblxcblxcbiAgICAvLyBjYWxjdWxhdGUgYXR0ZW51YXRpb25cXG4gICAgZmxvYXQgYXR0ZW51YXRpb24gPSAyLjAgLyAodUxpZ2h0RmFsbG9mZi54ICsgKHVMaWdodEZhbGxvZmYueSAqIEQpICsgKHVMaWdodEZhbGxvZmYueiAqIEQgKiBEKSk7XFxuXFxuLy8gY2FsY3VsYXRlIGZpbmFsIGludGVzaXR5IGFuZCBjb2xvciwgdGhlbiBjb21iaW5lXFxudmVjMyBpbnRlbnNpdHkgPSBkaWZmdXNlICogYXR0ZW51YXRpb247XFxudmVjNCBkaWZmdXNlQ29sb3IgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHRleENvb3JkKTtcXG52ZWMzIGZpbmFsQ29sb3IgPSBkaWZmdXNlQ29sb3IucmdiICogaW50ZW5zaXR5O1xcblxcbmdsX0ZyYWdDb2xvciA9IHZlYzQoZmluYWxDb2xvciwgZGlmZnVzZUNvbG9yLmEpO1xcblxcbn1cIixcclxuICAgICAgICAvLyBjdXN0b20gdW5pZm9ybXNcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIGhlaWdodCBvZiB0aGUgbGlnaHQgYWJvdmUgdGhlIHZpZXdwb3J0XHJcbiAgICAgICAgICAgIHVMaWdodFJhZGl1czogICB7IHR5cGU6ICcxZicsIHZhbHVlOiAxIH1cclxuICAgICAgICB9XHJcbiAgICApO1xyXG59XHJcblxyXG5Qb2ludExpZ2h0U2hhZGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTGlnaHRTaGFkZXIucHJvdG90eXBlKTtcclxuUG9pbnRMaWdodFNoYWRlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQb2ludExpZ2h0U2hhZGVyO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFBvaW50TGlnaHRTaGFkZXI7XHJcblxyXG5QSVhJLlNoYWRlck1hbmFnZXIucmVnaXN0ZXJQbHVnaW4oJ3BvaW50TGlnaHRTaGFkZXInLCBQb2ludExpZ2h0U2hhZGVyKTtcclxuIiwiLyoqXHJcbiAqXHJcbiAqIEBjbGFzc1xyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAbWVtYmVyb2YgUElYSS5saWdodHNcclxuICogQGV4dGVuZHMgUElYSS5PYmplY3RSZW5kZXJlclxyXG4gKiBAcGFyYW0gcmVuZGVyZXIge1dlYkdMUmVuZGVyZXJ9IFRoZSByZW5kZXJlciB0aGlzIHNwcml0ZSBiYXRjaCB3b3JrcyBmb3IuXHJcbiAqL1xyXG5mdW5jdGlvbiBMaWdodFJlbmRlcmVyKHJlbmRlcmVyKVxyXG57XHJcblxyXG4gICAgUElYSS5PYmplY3RSZW5kZXJlci5jYWxsKHRoaXMsIHJlbmRlcmVyKTtcclxuXHJcbiAgICAvLyB0aGUgdG90YWwgbnVtYmVyIG9mIGluZGljZXMgaW4gb3VyIGJhdGNoLCB0aGVyZSBhcmUgNiBwb2ludHMgcGVyIHF1YWQuXHJcbiAgICB2YXIgbnVtSW5kaWNlcyA9IExpZ2h0UmVuZGVyZXIuTUFYX0xJR0hUUyAqIDY7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIb2xkcyB0aGUgaW5kaWNlc1xyXG4gICAgICpcclxuICAgICAqIEBtZW1iZXIge1VpbnQxNkFycmF5fVxyXG4gICAgICovXHJcbiAgICB0aGlzLmluZGljZXMgPSBuZXcgVWludDE2QXJyYXkobnVtSW5kaWNlcyk7XHJcblxyXG4gICAgLy9UT0RPIHRoaXMgY291bGQgYmUgYSBzaW5nbGUgYnVmZmVyIHNoYXJlZCBhbW9uZ3N0IGFsbCByZW5kZXJlcnMgYXMgd2UgcmV1c2UgdGhpcyBzZXQgdXAgaW4gbW9zdCByZW5kZXJlcnNcclxuICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG51bUluZGljZXM7IGkgKz0gNiwgaiArPSA0KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaW5kaWNlc1tpICsgMF0gPSBqICsgMDtcclxuICAgICAgICB0aGlzLmluZGljZXNbaSArIDFdID0gaiArIDE7XHJcbiAgICAgICAgdGhpcy5pbmRpY2VzW2kgKyAyXSA9IGogKyAyO1xyXG4gICAgICAgIHRoaXMuaW5kaWNlc1tpICsgM10gPSBqICsgMDtcclxuICAgICAgICB0aGlzLmluZGljZXNbaSArIDRdID0gaiArIDI7XHJcbiAgICAgICAgdGhpcy5pbmRpY2VzW2kgKyA1XSA9IGogKyAzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGN1cnJlbnQgc2l6ZSBvZiB0aGUgYmF0Y2gsIGVhY2ggcmVuZGVyKCkgY2FsbCBhZGRzIHRvIHRoaXMgbnVtYmVyLlxyXG4gICAgICpcclxuICAgICAqIEBtZW1iZXIge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgdGhpcy5jdXJyZW50QmF0Y2hTaXplID0gMDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjdXJyZW50IGxpZ2h0cyBpbiB0aGUgYmF0Y2guXHJcbiAgICAgKlxyXG4gICAgICogQG1lbWJlciB7TGlnaHRbXX1cclxuICAgICAqL1xyXG4gICAgdGhpcy5saWdodHMgPSBbXTtcclxufVxyXG5cclxuTGlnaHRSZW5kZXJlci5NQVhfTElHSFRTID0gNTAwO1xyXG5cclxuTGlnaHRSZW5kZXJlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBJWEkuT2JqZWN0UmVuZGVyZXIucHJvdG90eXBlKTtcclxuTGlnaHRSZW5kZXJlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMaWdodFJlbmRlcmVyO1xyXG5tb2R1bGUuZXhwb3J0cyA9IExpZ2h0UmVuZGVyZXI7XHJcblxyXG5QSVhJLldlYkdMUmVuZGVyZXIucmVnaXN0ZXJQbHVnaW4oJ2xpZ2h0cycsIExpZ2h0UmVuZGVyZXIpO1xyXG5cclxuLyoqXHJcbiAqIFJlbmRlcnMgdGhlIGxpZ2h0IG9iamVjdC5cclxuICpcclxuICogQHBhcmFtIGxpZ2h0IHtMaWdodH0gdGhlIGxpZ2h0IHRvIHJlbmRlclxyXG4gKi9cclxuTGlnaHRSZW5kZXJlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKGxpZ2h0KVxyXG57XHJcbiAgICAvL2NvbnNvbGUubG9nKGxpZ2h0LnggKyAnLycrIGxpZ2h0LnkpO1xyXG4gICAgLy9saWdodC5wb3NpdGlvbi54ID0gbGlnaHQub3JpbmdpbmFsWCAqIGxpZ2h0LnBhcmVudC5wYXJlbnQuc2NhbGUueDtcclxuICAgIC8vbGlnaHQucG9zaXRpb24ueSA9IGxpZ2h0Lm9yaW5naW5hbFkgKiBsaWdodC5wYXJlbnQucGFyZW50LnNjYWxlLnk7XHJcbiAgICAvL2NvbnNvbGUubG9nKGxpZ2h0LnNjYWxlKTtcclxuICAgIHRoaXMubGlnaHRzW3RoaXMuY3VycmVudEJhdGNoU2l6ZSsrXSA9IGxpZ2h0O1xyXG4gICAgXHJcbn07XHJcblxyXG5MaWdodFJlbmRlcmVyLnByb3RvdHlwZS5mbHVzaCA9IGZ1bmN0aW9uICgpXHJcbntcclxuICAgIHZhciByZW5kZXJlciA9IHRoaXMucmVuZGVyZXIsXHJcbiAgICAgICAgZ2wgPSByZW5kZXJlci5nbCxcclxuICAgICAgICBkaWZmdXNlVGV4dHVyZSA9IHJlbmRlcmVyLmRpZmZ1c2VUZXh0dXJlLFxyXG4gICAgICAgIG5vcm1hbHNUZXh0dXJlID0gcmVuZGVyZXIubm9ybWFsc1RleHR1cmUsXHJcbiAgICAgICAgbGFzdFNoYWRlciA9IG51bGw7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmN1cnJlbnRCYXRjaFNpemU7ICsraSlcclxuICAgIHtcclxuICAgICAgICB2YXIgbGlnaHQgPSB0aGlzLmxpZ2h0c1tpXSxcclxuICAgICAgICAgICAgc2hhZGVyID0gbGlnaHQuc2hhZGVyIHx8IHRoaXMucmVuZGVyZXIuc2hhZGVyTWFuYWdlci5wbHVnaW5zW2xpZ2h0LnNoYWRlck5hbWVdO1xyXG5cclxuICAgICAgICBpZiAoIWxpZ2h0Ll92ZXJ0ZXhCdWZmZXIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9pbml0V2ViR0wobGlnaHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2V0IHNoYWRlciBpZiBuZWVkZWRcclxuICAgICAgICBpZiAoc2hhZGVyICE9PSBsYXN0U2hhZGVyKSB7XHJcbiAgICAgICAgICAgIGxhc3RTaGFkZXIgPSBzaGFkZXI7XHJcbiAgICAgICAgICAgIHJlbmRlcmVyLnNoYWRlck1hbmFnZXIuc2V0U2hhZGVyKHNoYWRlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXJlci5ibGVuZE1vZGVNYW5hZ2VyLnNldEJsZW5kTW9kZShsaWdodC5ibGVuZE1vZGUpO1xyXG5cclxuICAgICAgICAvLyBzZXQgdW5pZm9ybXMsIGNhbiBkbyBzb21lIG9wdGltaXphdGlvbnMgaGVyZS5cclxuICAgICAgICBzaGFkZXIudW5pZm9ybXMudVZpZXdTaXplLnZhbHVlWzBdID0gcmVuZGVyZXIud2lkdGg7XHJcbiAgICAgICAgc2hhZGVyLnVuaWZvcm1zLnVWaWV3U2l6ZS52YWx1ZVsxXSA9IHJlbmRlcmVyLmhlaWdodDtcclxuXHJcbiAgICAgICAgbGlnaHQud29ybGRUcmFuc2Zvcm0udG9BcnJheSh0cnVlLCBzaGFkZXIudW5pZm9ybXMudHJhbnNsYXRpb25NYXRyaXgudmFsdWUpO1xyXG4gICAgICAgIHJlbmRlcmVyLmN1cnJlbnRSZW5kZXJUYXJnZXQucHJvamVjdGlvbk1hdHJpeC50b0FycmF5KHRydWUsIHNoYWRlci51bmlmb3Jtcy5wcm9qZWN0aW9uTWF0cml4LnZhbHVlKTtcclxuXHJcbiAgICAgICAgaWYgKGxpZ2h0LnVzZVZpZXdwb3J0UXVhZCkge1xyXG4gICAgICAgICAgICAvLyB1cGRhdGUgdmVydHMgdG8gZW5zdXJlIGl0IGlzIGEgZnVsbHNjcmVlbiBxdWFkIGV2ZW4gaWYgdGhlIHJlbmRlcmVyIGlzIHJlc2l6ZWQuIFRoaXMgc2hvdWxkIGJlIG9wdGltaXplZFxyXG4gICAgICAgICAgICBsaWdodC52ZXJ0aWNlc1syXSA9IGxpZ2h0LnZlcnRpY2VzWzRdID0gcmVuZGVyZXIud2lkdGg7XHJcbiAgICAgICAgICAgIGxpZ2h0LnZlcnRpY2VzWzVdID0gbGlnaHQudmVydGljZXNbN10gPSByZW5kZXJlci5oZWlnaHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaWdodC5zeW5jU2hhZGVyKHNoYWRlcik7XHJcblxyXG4gICAgICAgIHNoYWRlci5zeW5jVW5pZm9ybXMoKTtcclxuXHJcbiAgICAgICAgLy8gaGF2ZSB0byBzZXQgdGhlc2UgbWFudWFsbHkgZHVlIHRvIHRoZSB3YXkgcGl4aSBiYXNlIHNoYWRlciBtYWtlcyBhc3N1bXB0aW9ucyBhYm91dCB0ZXh0dXJlIHVuaXRzXHJcbiAgICAgICAgZ2wudW5pZm9ybTFpKHNoYWRlci51bmlmb3Jtcy51U2FtcGxlci5fbG9jYXRpb24sIDApO1xyXG4gICAgICAgIGdsLnVuaWZvcm0xaShzaGFkZXIudW5pZm9ybXMudU5vcm1hbFNhbXBsZXIuX2xvY2F0aW9uLCAxKTtcclxuXHJcbiAgICAgICAgaWYgKCFsaWdodC5uZWVkc1VwZGF0ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIHVwZGF0ZSB2ZXJ0ZXggZGF0YVxyXG4gICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgbGlnaHQuX3ZlcnRleEJ1ZmZlcik7XHJcbiAgICAgICAgICAgIGdsLmJ1ZmZlclN1YkRhdGEoZ2wuQVJSQVlfQlVGRkVSLCAwLCBsaWdodC52ZXJ0aWNlcyk7XHJcbiAgICAgICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyLmF0dHJpYnV0ZXMuYVZlcnRleFBvc2l0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgLy8gYmluZCBkaWZmdXNlIHRleHR1cmVcclxuICAgICAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCk7XHJcbiAgICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIGRpZmZ1c2VUZXh0dXJlLmJhc2VUZXh0dXJlLl9nbFRleHR1cmVzW2dsLmlkXSk7XHJcblxyXG4gICAgICAgICAgICAvLyBiaW5kIG5vcm1hbCB0ZXh0dXJlXHJcbiAgICAgICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTEpO1xyXG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBub3JtYWxzVGV4dHVyZS5iYXNlVGV4dHVyZS5fZ2xUZXh0dXJlc1tnbC5pZF0pO1xyXG5cclxuICAgICAgICAgICAgLy8gdXBkYXRlIGluZGljZXNcclxuICAgICAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbGlnaHQuX2luZGV4QnVmZmVyKTtcclxuICAgICAgICAgICAgZ2wuYnVmZmVyU3ViRGF0YShnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgMCwgbGlnaHQuaW5kaWNlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxpZ2h0Lm5lZWRzVXBkYXRlID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAvLyB1cGxvYWQgdmVydGV4IGRhdGFcclxuICAgICAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGxpZ2h0Ll92ZXJ0ZXhCdWZmZXIpO1xyXG4gICAgICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbGlnaHQudmVydGljZXMsIGdsLlNUQVRJQ19EUkFXKTtcclxuICAgICAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXIuYXR0cmlidXRlcy5hVmVydGV4UG9zaXRpb24sIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcblxyXG4gICAgICAgICAgICAvLyBiaW5kIGRpZmZ1c2UgdGV4dHVyZVxyXG4gICAgICAgICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcclxuICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgZGlmZnVzZVRleHR1cmUuYmFzZVRleHR1cmUuX2dsVGV4dHVyZXNbZ2wuaWRdKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGJpbmQgbm9ybWFsIHRleHR1cmVcclxuICAgICAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMSk7XHJcbiAgICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG5vcm1hbHNUZXh0dXJlLmJhc2VUZXh0dXJlLl9nbFRleHR1cmVzW2dsLmlkXSk7XHJcblxyXG4gICAgICAgICAgICAvLyBzdGF0aWMgdXBsb2FkIG9mIGluZGV4IGJ1ZmZlclxyXG4gICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBsaWdodC5faW5kZXhCdWZmZXIpO1xyXG4gICAgICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBsaWdodC5pbmRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnbC5kcmF3RWxlbWVudHMocmVuZGVyZXIuZHJhd01vZGVzW2xpZ2h0LmRyYXdNb2RlXSwgbGlnaHQuaW5kaWNlcy5sZW5ndGgsIGdsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuICAgICAgICByZW5kZXJlci5kcmF3Q291bnQrKztcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmN1cnJlbnRCYXRjaFNpemUgPSAwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFByZXBhcmVzIGFsbCB0aGUgYnVmZmVycyB0byByZW5kZXIgdGhpcyBsaWdodC5cclxuICpcclxuICogQHBhcmFtIGxpZ2h0IHtMaWdodH0gVGhlIGxpZ2h0IG9iamVjdCB0byBwcmVwYXJlIGZvciByZW5kZXJpbmcuXHJcbiAqL1xyXG5MaWdodFJlbmRlcmVyLnByb3RvdHlwZS5faW5pdFdlYkdMID0gZnVuY3Rpb24gKGxpZ2h0KVxyXG57XHJcbiAgICB2YXIgZ2wgPSB0aGlzLnJlbmRlcmVyLmdsO1xyXG5cclxuICAgIC8vIGNyZWF0ZSB0aGUgYnVmZmVyc1xyXG4gICAgbGlnaHQuX3ZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgbGlnaHQuX2luZGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcblxyXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGxpZ2h0Ll92ZXJ0ZXhCdWZmZXIpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGxpZ2h0LnZlcnRpY2VzLCBnbC5EWU5BTUlDX0RSQVcpO1xyXG5cclxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGxpZ2h0Ll9pbmRleEJ1ZmZlcik7XHJcbiAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBsaWdodC5pbmRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XHJcbn07XHJcblxyXG5MaWdodFJlbmRlcmVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKClcclxue1xyXG4gICAgXHJcbn07XHJcbiIsIi8qKlxyXG4gKiBUaGUgV2ViR0xEZWZlcnJlZFJlbmRlcmVyIGRyYXdzIHRoZSBzY2VuZSBhbmQgYWxsIGl0cyBjb250ZW50IG9udG8gYSB3ZWJHTCBlbmFibGVkIGNhbnZhcy4gVGhpcyByZW5kZXJlclxyXG4gKiBzaG91bGQgYmUgdXNlZCBmb3IgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IHdlYkdMLiBUaGlzIFJlbmRlciB3b3JrcyBieSBhdXRvbWF0aWNhbGx5IG1hbmFnaW5nIHdlYkdMQmF0Y2hzLlxyXG4gKiBTbyBubyBuZWVkIGZvciBTcHJpdGUgQmF0Y2hlcyBvciBTcHJpdGUgQ2xvdWRzLlxyXG4gKiBEb24ndCBmb3JnZXQgdG8gYWRkIHRoZSB2aWV3IHRvIHlvdXIgRE9NIG9yIHlvdSB3aWxsIG5vdCBzZWUgYW55dGhpbmcgOilcclxuICpcclxuICogQGNsYXNzXHJcbiAqIEBtZW1iZXJvZiBQSVhJLmxpZ2h0c1xyXG4gKiBAZXh0ZW5kcyBQSVhJLlN5c3RlbVJlbmRlcmVyXHJcbiAqIEBwYXJhbSBbd2lkdGg9MF0ge251bWJlcn0gdGhlIHdpZHRoIG9mIHRoZSBjYW52YXMgdmlld1xyXG4gKiBAcGFyYW0gW2hlaWdodD0wXSB7bnVtYmVyfSB0aGUgaGVpZ2h0IG9mIHRoZSBjYW52YXMgdmlld1xyXG4gKiBAcGFyYW0gW29wdGlvbnNdIHtvYmplY3R9IFRoZSBvcHRpb25hbCByZW5kZXJlciBwYXJhbWV0ZXJzXHJcbiAqIEBwYXJhbSBbb3B0aW9ucy52aWV3XSB7SFRNTENhbnZhc0VsZW1lbnR9IHRoZSBjYW52YXMgdG8gdXNlIGFzIGEgdmlldywgb3B0aW9uYWxcclxuICogQHBhcmFtIFtvcHRpb25zLnRyYW5zcGFyZW50PWZhbHNlXSB7Ym9vbGVhbn0gSWYgdGhlIHJlbmRlciB2aWV3IGlzIHRyYW5zcGFyZW50LCBkZWZhdWx0IGZhbHNlXHJcbiAqIEBwYXJhbSBbb3B0aW9ucy5hdXRvUmVzaXplPWZhbHNlXSB7Ym9vbGVhbn0gSWYgdGhlIHJlbmRlciB2aWV3IGlzIGF1dG9tYXRpY2FsbHkgcmVzaXplZCwgZGVmYXVsdCBmYWxzZVxyXG4gKiBAcGFyYW0gW29wdGlvbnMuYW50aWFsaWFzPWZhbHNlXSB7Ym9vbGVhbn0gc2V0cyBhbnRpYWxpYXMuIElmIG5vdCBhdmFpbGFibGUgbmF0aXZlbHkgdGhlbiBGWEFBIGFudGlhbGlhc2luZyBpcyB1c2VkXHJcbiAqIEBwYXJhbSBbb3B0aW9ucy5mb3JjZUZYQUE9ZmFsc2VdIHtib29sZWFufSBmb3JjZXMgRlhBQSBhbnRpYWxpYXNpbmcgdG8gYmUgdXNlZCBvdmVyIG5hdGl2ZS4gRlhBQSBpcyBmYXN0ZXIsIGJ1dCBtYXkgbm90IGFsd2F5cyBsb2sgYXMgZ3JlYXRcclxuICogQHBhcmFtIFtvcHRpb25zLnJlc29sdXRpb249MV0ge251bWJlcn0gdGhlIHJlc29sdXRpb24gb2YgdGhlIHJlbmRlcmVyIHJldGluYSB3b3VsZCBiZSAyXHJcbiAqIEBwYXJhbSBbb3B0aW9ucy5jbGVhckJlZm9yZVJlbmRlcj10cnVlXSB7Ym9vbGVhbn0gVGhpcyBzZXRzIGlmIHRoZSBDYW52YXNSZW5kZXJlciB3aWxsIGNsZWFyIHRoZSBjYW52YXMgb3JcclxuICogICAgICBub3QgYmVmb3JlIHRoZSBuZXcgcmVuZGVyIHBhc3MuXHJcbiAqIEBwYXJhbSBbb3B0aW9ucy5wcmVzZXJ2ZURyYXdpbmdCdWZmZXI9ZmFsc2VdIHtib29sZWFufSBlbmFibGVzIGRyYXdpbmcgYnVmZmVyIHByZXNlcnZhdGlvbiwgZW5hYmxlIHRoaXMgaWZcclxuICogICAgICB5b3UgbmVlZCB0byBjYWxsIHRvRGF0YVVybCBvbiB0aGUgd2ViZ2wgY29udGV4dC5cclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMRGVmZXJyZWRSZW5kZXJlcih3aWR0aCwgaGVpZ2h0LCBvcHRpb25zKVxyXG57XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICB0aGlzLnJlbmRlcmluZ05vcm1hbHMgPSBmYWxzZTtcclxuICAgIHRoaXMucmVuZGVyaW5nVW5saXQgPSBmYWxzZTtcclxuICAgIHRoaXMuX2ZvcndhcmRSZW5kZXIgPSBQSVhJLldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlcjtcclxuXHJcbiAgICBQSVhJLldlYkdMUmVuZGVyZXIuY2FsbCh0aGlzLCB3aWR0aCwgaGVpZ2h0LCBvcHRpb25zKTtcclxufVxyXG5cclxuV2ViR0xEZWZlcnJlZFJlbmRlcmVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUElYSS5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZSk7XHJcbldlYkdMRGVmZXJyZWRSZW5kZXJlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBXZWJHTERlZmVycmVkUmVuZGVyZXI7XHJcbm1vZHVsZS5leHBvcnRzID0gV2ViR0xEZWZlcnJlZFJlbmRlcmVyO1xyXG5cclxuLyoqIEBsZW5kcyBQSVhJLkRpc3BsYXlPYmplY3QjICovXHJcbk9iamVjdC5hc3NpZ24oV2ViR0xEZWZlcnJlZFJlbmRlcmVyLnByb3RvdHlwZSwge1xyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgY29udGV4dCBhbmQgbmVjZXNzYXJ5IGZyYW1lYnVmZmVycy5cclxuICAgICAqL1xyXG4gICAgX2luaXRDb250ZXh0OiBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIC8vIGNhbGwgcGFyZW50IGluaXRcclxuICAgICAgICBQSVhJLldlYkdMUmVuZGVyZXIucHJvdG90eXBlLl9pbml0Q29udGV4dC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgICAvLyBmaXJzdCBjcmVhdGUgb3VyIHJlbmRlciB0YXJnZXRzLlxyXG4gICAgICAgIHRoaXMuZGlmZnVzZVRleHR1cmUgPSBuZXcgUElYSS5SZW5kZXJUZXh0dXJlKHRoaXMsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCBudWxsLCB0aGlzLnJlc29sdXRpb24pO1xyXG4gICAgICAgIHRoaXMubm9ybWFsc1RleHR1cmUgPSBuZXcgUElYSS5SZW5kZXJUZXh0dXJlKHRoaXMsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCBudWxsLCB0aGlzLnJlc29sdXRpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBUT0RPIE9wdGltaXphdGlvbnM6XHJcbiAgICAvLyBPbmx5IGNhbGwgYHVwZGF0ZVRyYW5zZm9ybWAgb25jZSwgcmlnaHQgbm93IGl0IGlzIGNhbGwgZWFjaCByZW5kZXIgcGFzcy5cclxuICAgIC8vIE9wdGltaXplIHJlbmRlciB0ZXh0dXJlIHJlbmRlcmluZyB0byByZWR1Y2UgZHVwbGljYXRpb24sIG9yIHVzZSByZW5kZXIgdGFyZ2V0cyBkaXJlY3RseS5cclxuICAgIC8vIENhY2hlIHRyZWUgdHJhbnN2ZXJzYWwsIGNhY2hlIGVsZW1lbnRzIHRvIHVzZSBmb3IgZWFjaCByZW5kZXIgcGFzcz9cclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uIChvYmplY3QsIHJlbmRlckxpZ2h0KVxyXG4gICAge1xyXG4gICAgICAgIC8vIG5vIHBvaW50IHJlbmRlcmluZyBpZiBvdXIgY29udGV4dCBoYXMgYmVlbiBibG93biB1cCFcclxuICAgICAgICBpZiAodGhpcy5nbC5pc0NvbnRleHRMb3N0KCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmRyYXdDb3VudCA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMuX2xhc3RPYmplY3RSZW5kZXJlZCA9IG9iamVjdDtcclxuXHJcbiAgICAgICAgLy8vLy8vLy8vLy8vL1xyXG4gICAgICAgIC8vICBSZW5kZXJpbmdcclxuICAgICAgICB0aGlzLnJlbmRlcmluZ1VubGl0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIHJlbmRlciBkaWZmdXNlXHJcbiAgICAgICAgdGhpcy5yZW5kZXJpbmdOb3JtYWxzID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kaWZmdXNlVGV4dHVyZS5yZW5kZXIob2JqZWN0KTtcclxuXHJcbiAgICAgICAgLy8gcmVuZGVyIG5vcm1hbHNcclxuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJpbmdOb3JtYWxzID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLm5vcm1hbHNUZXh0dXJlLnJlbmRlcihvYmplY3QpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICAvLyByZW5kZXIgbGlnaHRzXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zZXRSZW5kZXJUYXJnZXQodGhpcy5yZW5kZXJUYXJnZXQpO1xyXG4gICAgICAgIHRoaXMuc2V0T2JqZWN0UmVuZGVyZXIodGhpcy5wbHVnaW5zLmxpZ2h0cyk7XHJcbiAgICAgICAgdGhpcy5wbHVnaW5zLmxpZ2h0cy5mbHVzaCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGZvcndhcmQgcmVuZGVyIHVubGl0IG9iamVjdHMgKG5vIG5vcm1hbCB0ZXh0dXJlKVxyXG4gICAgICAgIHZhciBjYnIgPSB0aGlzLmNsZWFyQmVmb3JlUmVuZGVyLFxyXG4gICAgICAgICAgICBkcmF3cyA9IHRoaXMuZHJhd0NvdW50O1xyXG5cclxuICAgICAgICB0aGlzLnJlbmRlcmluZ05vcm1hbHMgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnJlbmRlcmluZ1VubGl0ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmNsZWFyQmVmb3JlUmVuZGVyID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuX2ZvcndhcmRSZW5kZXIob2JqZWN0KTtcclxuICAgICAgICB0aGlzLmNsZWFyQmVmb3JlUmVuZGVyID0gY2JyO1xyXG4gICAgICAgIHRoaXMuZHJhd0NvdW50ICs9IGRyYXdzO1xyXG4gICAgICAgIC8vLy8vLy8vLy8vLy9cclxuICAgIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVzIHZlcnRpY2VzIGFuZCBpbmRpY2VzIGFycmF5cyB0byBkZXNjcmliZSB0aGlzIGNpcmNsZS5cclxuICogXHJcbiAqIEBwYXJhbSBbdG90YWxTZWdtZW50cz00MF0ge251bWJlcn0gVG90YWwgc2VnbWVudHMgdG8gYnVpbGQgZm9yIHRoZSBjaXJjbGUgbWVzaC5cclxuICogQHBhcmFtIFt2ZXJ0aWNlc091dHB1dF0ge0Zsb2F0MzJBcnJheX0gQW4gYXJyYXkgdG8gb3V0cHV0IHRoZSB2ZXJ0aWNlcyBpbnRvLiBMZW5ndGggbXVzdCBiZVxyXG4gKiAgYCgodG90YWxTZWdtZW50cyArIDIpICogMilgIG9yIG1vcmUuIElmIG5vdCBwYXNzZWQgaXQgaXMgY3JlYXRlZCBmb3IgeW91LlxyXG4gKiBAcGFyYW0gW2luZGljZXNPdXRwdXRdIHtVaW50MTZBcnJheX0gQW4gYXJyYXkgdG8gb3V0cHV0IHRoZSBpbmRpY2VzIGludG8sIGluIGdsLlRSSUFOR0xFX0ZBTiBmb3JtYXQuIExlbmd0aCBtdXN0XHJcbiAqICBiZSBgKHRvdGFsU2VnbWVudHMgKyAzKWAgb3IgbW9yZS4gSWYgbm90IHBhc3NlZCBpdCBpcyBjcmVhdGVkIGZvciB5b3UuXHJcbiAqL1xyXG5QSVhJLkNpcmNsZS5wcm90b3R5cGUuZ2V0TWVzaCA9IGZ1bmN0aW9uICh0b3RhbFNlZ21lbnRzLCB2ZXJ0aWNlcywgaW5kaWNlcylcclxue1xyXG4gICAgdG90YWxTZWdtZW50cyA9IHRvdGFsU2VnbWVudHMgfHwgNDA7XHJcblxyXG4gICAgdmVydGljZXMgPSB2ZXJ0aWNlcyB8fCBuZXcgRmxvYXQzMkFycmF5KCh0b3RhbFNlZ21lbnRzICsgMSkgKiAyKTtcclxuICAgIGluZGljZXMgPSBpbmRpY2VzIHx8IG5ldyBVaW50MTZBcnJheSh0b3RhbFNlZ21lbnRzICsgMSk7XHJcblxyXG4gICAgdmFyIHNlZyA9IChNYXRoLlBJICogMikgLyB0b3RhbFNlZ21lbnRzLFxyXG4gICAgICAgIGluZGljZXNJbmRleCA9IC0xO1xyXG5cclxuICAgIGluZGljZXNbKytpbmRpY2VzSW5kZXhdID0gaW5kaWNlc0luZGV4O1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHRvdGFsU2VnbWVudHM7ICsraSlcclxuICAgIHtcclxuICAgICAgICB2YXIgaW5kZXggPSBpKjI7XHJcbiAgICAgICAgdmFyIGFuZ2xlID0gc2VnICogaTtcclxuXHJcbiAgICAgICAgdmVydGljZXNbaW5kZXhdID0gTWF0aC5jb3MoYW5nbGUpICogdGhpcy5yYWRpdXM7XHJcbiAgICAgICAgdmVydGljZXNbaW5kZXgrMV0gPSBNYXRoLnNpbihhbmdsZSkgKiB0aGlzLnJhZGl1cztcclxuXHJcbiAgICAgICAgaW5kaWNlc1srK2luZGljZXNJbmRleF0gPSBpbmRpY2VzSW5kZXg7XHJcbiAgICB9XHJcblxyXG4gICAgaW5kaWNlc1tpbmRpY2VzSW5kZXhdID0gMTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHZlcnRpY2VzOiB2ZXJ0aWNlcyxcclxuICAgICAgICBpbmRpY2VzOiBpbmRpY2VzXHJcbiAgICB9O1xyXG59O1xyXG5cclxuUElYSS5FbGxpcHNlLnByb3RvdHlwZS5nZXRNZXNoID0gZnVuY3Rpb24odG90YWxTZWdtZW50cywgdmVydGljZXMsIGluZGljZXMpe1xyXG4gICAgdG90YWxTZWdtZW50cyA9IHRvdGFsU2VnbWVudHMgfHwgNDA7XHJcblxyXG4gICAgdmVydGljZXMgPSB2ZXJ0aWNlcyB8fCBuZXcgRmxvYXQzMkFycmF5KCh0b3RhbFNlZ21lbnRzICsgMSkgKiAyKTtcclxuICAgIGluZGljZXMgPSBpbmRpY2VzIHx8IG5ldyBVaW50MTZBcnJheSh0b3RhbFNlZ21lbnRzICsgMSk7XHJcblxyXG4gICAgdmFyIHNlZyA9IChNYXRoLlBJICogMikgLyB0b3RhbFNlZ21lbnRzLFxyXG4gICAgaW5kaWNlc0luZGV4ID0gLTE7XHJcblxyXG4gICAgaW5kaWNlc1srK2luZGljZXNJbmRleF0gPSBpbmRpY2VzSW5kZXg7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gdG90YWxTZWdtZW50czsgKytpKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBpbmRleCA9IGkqMjtcclxuICAgICAgICB2YXIgYW5nbGUgPSBzZWcgKiBpO1xyXG5cclxuICAgICAgICB2ZXJ0aWNlc1tpbmRleF0gPSBNYXRoLmNvcyhhbmdsZSkgKiB0aGlzLndpZHRoLzI7XHJcbiAgICAgICAgdmVydGljZXNbaW5kZXgrMV0gPSBNYXRoLnNpbihhbmdsZSkgKiB0aGlzLmhlaWdodC8yO1xyXG5cclxuICAgICAgICBpbmRpY2VzWysraW5kaWNlc0luZGV4XSA9IGluZGljZXNJbmRleDtcclxuICAgIH1cclxuXHJcbiAgICBpbmRpY2VzW2luZGljZXNJbmRleF0gPSAxO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdmVydGljZXM6IHZlcnRpY2VzLFxyXG4gICAgICAgIGluZGljZXM6IGluZGljZXNcclxuICAgIH07XHJcbn1cclxuIl19