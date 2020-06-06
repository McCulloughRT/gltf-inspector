import { EXTENSIONS } from "../constants"
import * as THREE from "three"

/**
 * Specular-Glossiness Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness
 */
export class GLTFMaterialsPbrSpecularGlossinessExtension {
    public name: string = EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS
    public specularGlossinessParams: string[] = [
        'color',
        'map',
        'lightMap',
        'lightMapIntensity',
        'aoMap',
        'aoMapIntensity',
        'emissive',
        'emissiveIntensity',
        'emissiveMap',
        'bumpMap',
        'bumpScale',
        'normalMap',
        'displacementMap',
        'displacementScale',
        'displacementBias',
        'specularMap',
        'specular',
        'glossinessMap',
        'glossiness',
        'alphaMap',
        'envMap',
        'envMapIntensity',
        'refractionRatio',
    ]

    public getMaterialType = () => THREE.ShaderMaterial

    public extendParams = (materialParams: any, materialDef: any, parser: any) => {
        const pbrSpecularGlossiness = materialDef.extensions[ this.name ]
        const shader = THREE.ShaderLib[ 'standard' ]
        const uniforms = THREE.UniformsUtils.clone( shader.uniforms )

        const specularMapParsFragmentChunk = [
            '#ifdef USE_SPECULARMAP',
            '	uniform sampler2D specularMap;',
            '#endif'
        ].join( '\n' )

        const glossinessMapParsFragmentChunk = [
            '#ifdef USE_GLOSSINESSMAP',
            '	uniform sampler2D glossinessMap;',
            '#endif'
        ].join( '\n' )

        const specularMapFragmentChunk = [
            'vec3 specularFactor = specular;',
            '#ifdef USE_SPECULARMAP',
            '	vec4 texelSpecular = texture2D( specularMap, vUv );',
            '	texelSpecular = sRGBToLinear( texelSpecular );',
            '	// reads channel RGB, compatible with a glTF Specular-Glossiness (RGBA) texture',
            '	specularFactor *= texelSpecular.rgb;',
            '#endif'
        ].join( '\n' )

        const glossinessMapFragmentChunk = [
            'float glossinessFactor = glossiness;',
            '#ifdef USE_GLOSSINESSMAP',
            '	vec4 texelGlossiness = texture2D( glossinessMap, vUv );',
            '	// reads channel A, compatible with a glTF Specular-Glossiness (RGBA) texture',
            '	glossinessFactor *= texelGlossiness.a;',
            '#endif'
        ].join( '\n' )

        const lightPhysicalFragmentChunk = [
            'PhysicalMaterial material;',
            'material.diffuseColor = diffuseColor.rgb;',
            'material.specularRoughness = clamp( 1.0 - glossinessFactor, 0.04, 1.0 );',
            'material.specularColor = specularFactor.rgb;',
        ].join( '\n' )

        const fragmentShader = shader.fragmentShader
            .replace( 'uniform float roughness;', 'uniform vec3 specular;' )
            .replace( 'uniform float metalness;', 'uniform float glossiness;' )
            .replace( '#include <roughnessmap_pars_fragment>', specularMapParsFragmentChunk )
            .replace( '#include <metalnessmap_pars_fragment>', glossinessMapParsFragmentChunk )
            .replace( '#include <roughnessmap_fragment>', specularMapFragmentChunk )
            .replace( '#include <metalnessmap_fragment>', glossinessMapFragmentChunk )
            .replace( '#include <lights_physical_fragment>', lightPhysicalFragmentChunk )

        delete uniforms.roughness
        delete uniforms.metalness
        delete uniforms.roughnessMap
        delete uniforms.metalnessMap

        uniforms.specular = { value: new THREE.Color().setHex( 0x111111 ) }
        uniforms.glossiness = { value: 0.5 }
        uniforms.specularMap = { value: null }
        uniforms.glossinessMap = { value: null }

        materialParams.vertexShader = shader.vertexShader
        materialParams.fragmentShader = fragmentShader
        materialParams.uniforms = uniforms
        materialParams.defines = { 'STANDARD': '' }

        materialParams.color = new THREE.Color( 1.0, 1.0, 1.0 )
        materialParams.opacity = 1.0

        const pending = []

        if ( Array.isArray( pbrSpecularGlossiness.diffuseFactor ) ) {
            const array = pbrSpecularGlossiness.diffuseFactor
            materialParams.color.fromArray( array )
            materialParams.opacity = array[ 3 ]
        }

        if ( pbrSpecularGlossiness.diffuseTexture !== undefined ) {
            pending.push( parser.assignTexture( materialParams, 'map', pbrSpecularGlossiness.diffuseTexture ) )
        }

        materialParams.emissive = new THREE.Color( 0.0, 0.0, 0.0 )
        materialParams.glossiness = pbrSpecularGlossiness.glossinessFactor !== undefined ? pbrSpecularGlossiness.glossinessFactor : 1.0
        materialParams.specular = new THREE.Color( 1.0, 1.0, 1.0 )

        if ( Array.isArray( pbrSpecularGlossiness.specularFactor ) ) {
            materialParams.specular.fromArray( pbrSpecularGlossiness.specularFactor )
        }

        if ( pbrSpecularGlossiness.specularGlossinessTexture !== undefined ) {
            const specGlossMapDef = pbrSpecularGlossiness.specularGlossinessTexture
            pending.push( parser.assignTexture( materialParams, 'glossinessMap', specGlossMapDef ) )
            pending.push( parser.assignTexture( materialParams, 'specularMap', specGlossMapDef ) )
        }

        return Promise.all( pending )
    }

    public createMaterial = (params: any) => {
        // setup material properties based on MeshStandardMaterial for Specular-Glossiness
        const material = new THREE.ShaderMaterial( {
            defines: params.defines,
            vertexShader: params.vertexShader,
            fragmentShader: params.fragmentShader,
            uniforms: params.uniforms,
            fog: true,
            lights: true,
            opacity: params.opacity,
            transparent: params.transparent
        } ) as any

        material.isGLTFSpecularGlossinessMaterial = true;
        material.color = params.color;
        material.map = params.map === undefined ? null : params.map;

        material.lightMap = null;
        material.lightMapIntensity = 1.0;

        material.aoMap = params.aoMap === undefined ? null : params.aoMap;
        material.aoMapIntensity = 1.0;

        material.emissive = params.emissive;
        material.emissiveIntensity = 1.0;
        material.emissiveMap = params.emissiveMap === undefined ? null : params.emissiveMap;

        material.bumpMap = params.bumpMap === undefined ? null : params.bumpMap;
        material.bumpScale = 1;

        material.normalMap = params.normalMap === undefined ? null : params.normalMap;

        if (params.normalScale) material.normalScale = params.normalScale;

        material.displacementMap = null;
        material.displacementScale = 1;
        material.displacementBias = 0;

        material.specularMap = params.specularMap === undefined ? null : params.specularMap;
        material.specular = params.specular;

        material.glossinessMap = params.glossinessMap === undefined ? null : params.glossinessMap;
        material.glossiness = params.glossiness;

        material.alphaMap = null;

        material.envMap = params.envMap === undefined ? null : params.envMap;
        material.envMapIntensity = 1.0;

        material.refractionRatio = 0.98;

        material.extensions.derivatives = true;

        return material;
    }

    /**
     * Clones a GLTFSpecularGlossinessMaterial instance. The ShaderMaterial.copy() method can
     * copy only properties it knows about or inherits, and misses many properties that would
     * normally be defined by MeshStandardMaterial.
     *
     * This method allows GLTFSpecularGlossinessMaterials to be cloned in the process of
     * loading a glTF model, but cloning later (e.g. by the user) would require these changes
     * AND also updating `.onBeforeRender` on the parent mesh.
     *
     * @param  {THREE.ShaderMaterial} source
     * @return {THREE.ShaderMaterial}
     */
    public cloneMaterial = (source: THREE.ShaderMaterial): THREE.ShaderMaterial => {
        var target = source.clone() as any
        target.isGLTFSpecularGlossinessMaterial = true;
        var params = this.specularGlossinessParams;

        for ( var i = 0, il = params.length; i < il; i ++ ) {
            var value = (source as any)[ params[ i ] ];
            target[ params[ i ] ] = ( value && value.isColor ) ? value.clone() : value;
        }

        return target;
    }

    public refreshUniforms = (renderer: any, scene: any, camera: any, geometry: any, material: any) => {
        if ( material.isGLTFSpecularGlossinessMaterial !== true ) {
            return
        }

        var uniforms = material.uniforms
        var defines = material.defines

        uniforms.opacity.value = material.opacity

        uniforms.diffuse.value.copy( material.color )
        uniforms.emissive.value.copy( material.emissive ).multiplyScalar( material.emissiveIntensity )

        uniforms.map.value = material.map
        uniforms.specularMap.value = material.specularMap
        uniforms.alphaMap.value = material.alphaMap

        uniforms.lightMap.value = material.lightMap
        uniforms.lightMapIntensity.value = material.lightMapIntensity

        uniforms.aoMap.value = material.aoMap
        uniforms.aoMapIntensity.value = material.aoMapIntensity

        // uv repeat and offset setting priorities
        // 1. color map
        // 2. specular map
        // 3. normal map
        // 4. bump map
        // 5. alpha map
        // 6. emissive map

        var uvScaleMap

        if ( material.map ) {
            uvScaleMap = material.map
        } else if ( material.specularMap ) {
            uvScaleMap = material.specularMap
        } else if ( material.displacementMap ) {
            uvScaleMap = material.displacementMap
        } else if ( material.normalMap ) {
            uvScaleMap = material.normalMap
        } else if ( material.bumpMap ) {
            uvScaleMap = material.bumpMap
        } else if ( material.glossinessMap ) {
            uvScaleMap = material.glossinessMap
        } else if ( material.alphaMap ) {
            uvScaleMap = material.alphaMap
        } else if ( material.emissiveMap ) {
            uvScaleMap = material.emissiveMap
        }

        if ( uvScaleMap !== undefined ) {
            // backwards compatibility
            if ( uvScaleMap.isWebGLRenderTarget ) {
                uvScaleMap = uvScaleMap.texture
            }
            if ( uvScaleMap.matrixAutoUpdate === true ) {
                uvScaleMap.updateMatrix()
            }
            uniforms.uvTransform.value.copy( uvScaleMap.matrix )
        }

        if ( material.envMap ) {
            uniforms.envMap.value = material.envMap
            uniforms.envMapIntensity.value = material.envMapIntensity

            // don't flip CubeTexture envMaps, flip everything else:
            //  WebGLRenderTargetCube will be flipped for backwards compatibility
            //  WebGLRenderTargetCube.texture will be flipped because it's a Texture and NOT a CubeTexture
            // this check must be handled differently, or removed entirely, if WebGLRenderTargetCube uses a CubeTexture in the future
            uniforms.flipEnvMap.value = material.envMap.isCubeTexture ? - 1 : 1

            uniforms.reflectivity.value = material.reflectivity
            uniforms.refractionRatio.value = material.refractionRatio

            uniforms.maxMipLevel.value = renderer.properties.get( material.envMap ).__maxMipLevel
        }

        uniforms.specular.value.copy( material.specular )
        uniforms.glossiness.value = material.glossiness

        uniforms.glossinessMap.value = material.glossinessMap

        uniforms.emissiveMap.value = material.emissiveMap
        uniforms.bumpMap.value = material.bumpMap
        uniforms.normalMap.value = material.normalMap

        uniforms.displacementMap.value = material.displacementMap
        uniforms.displacementScale.value = material.displacementScale
        uniforms.displacementBias.value = material.displacementBias

        if ( uniforms.glossinessMap.value !== null && defines.USE_GLOSSINESSMAP === undefined ) {
            defines.USE_GLOSSINESSMAP = ''
            // set USE_ROUGHNESSMAP to enable vUv
            defines.USE_ROUGHNESSMAP = ''
        }

        if ( uniforms.glossinessMap.value === null && defines.USE_GLOSSINESSMAP !== undefined ) {
            delete defines.USE_GLOSSINESSMAP
            delete defines.USE_ROUGHNESSMAP
        }
    }
}