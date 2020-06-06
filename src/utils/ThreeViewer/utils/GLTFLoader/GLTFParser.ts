import * as THREE from 'three'
import { GLTFRegistery } from './GLTFLoader'
import { EXTENSIONS, WEBGL_TYPE_SIZES, WEBGL_COMPONENT_TYPES, MIME_TYPE_FORMATS, WEBGL_FILTERS, WEBGL_WRAPPINGS, ALPHA_MODES, ATTRIBUTES, WEBGL_CONSTANTS } from './constants'
import { resolveURL, assignExtrasToUserData, addUnknownExtensionsToUserData, addMorphTargets, createPrimitiveKey, createDefaultMaterial } from './functions'
import { IGLTFPrimitive, IGLTF } from './types'

type DependencyTypes = 'scene' | 'node' | 'mesh' | 'accessor' | 'bufferView' | 'buffer' | 'material' | 'texture' | 'skin' | 'animation' | 'camera' | 'light'

export default class GLTFParser {
    public json: {[key:string]: any}
    public extensions: {[key:string]: any}
    public options: {[key:string]: any}

    // loader object cache
    public cache: GLTFRegistery = new GLTFRegistery()

    // BufferGeometry caching
    public primitiveCache: {[key:string]: any} = {}

    public textureLoader: THREE.TextureLoader
    public fileLoader: THREE.FileLoader

    constructor(json?: any, extensions?: any, options?: any) {
        this.json = json || {}
        this.extensions = extensions || {}
        this.options = options || {}

        this.textureLoader = new THREE.TextureLoader(this.options?.manager)
        this.textureLoader.setCrossOrigin(this.options?.setCrossOrigin)

        this.fileLoader = new THREE.FileLoader(this.options?.manager)
        this.fileLoader.setResponseType('arraybuffer')

        if (this.options?.crossOrigin === 'use-credentials') {
            this.fileLoader.setWithCredentials(true)
        }
    }

    public parse = async (onLoad: Function, onError: Function) => {
        // clear the loader cache
        this.cache.removeAll()

        // mark the special nodes/meshes in json for efficient parse
        this.markDefs()

        await Promise.all([
            this.getDependencies('scene'),
            // this.getDependencies('animation'),
            // this.getDependencies('camera'),
        ]).then(dependencies => {
			// console.log('Parser.parse returned')
            let result = {
				scene: dependencies[ 0 ][ this.json.scene || 0 ],
				scenes: dependencies[ 0 ],
				animations: dependencies[ 1 ],
				cameras: dependencies[ 2 ],
				asset: this.json.asset,
				parser: this,
				userData: {}
			};
			delete this.cache
			delete this.primitiveCache
			
			addUnknownExtensionsToUserData( this.extensions, result, this.json );
			assignExtrasToUserData( result, this.json );
			onLoad( result );
        })
    }

    /**
     * Marks the special nodes/meshes in json for efficient parsing
     * RTM - mesh instancing is handled here, but its pretty unclear how,
     * do more testing on this method.
     */
    private markDefs = () => {
        const nodeDefs = this.json.nodes || []
        // const skinDefs = this.json.skins || []
        // const meshDefs = this.json.meshes || []

        const meshReferences: {[key:string]: any} = {}
        const meshUses: {[key:string]: any} = {}

        // TODO: Turned off skinning and bone support
		// Nothing in the node definition indicates whether it is a Bone or an
		// Object3D. Use the skins' joint references to mark bones.
		// for ( var skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex ++ ) {
		// 	var joints = skinDefs[ skinIndex ].joints;
		// 	for ( var i = 0, il = joints.length; i < il; i ++ ) {
		// 		nodeDefs[ joints[ i ] ].isBone = true;
		// 	}
        // }
        
        // Meshes can (and should) be reused by multiple nodes in a glTF asset. To
		// avoid having more than one THREE.Mesh with the same name, count
		// references and rename instances below.
		// Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
		for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {
			let nodeDef = nodeDefs[ nodeIndex ];
			if ( nodeDef.mesh !== undefined ) {
				if ( meshReferences[ nodeDef.mesh ] === undefined ) {
					meshReferences[ nodeDef.mesh ] = meshUses[ nodeDef.mesh ] = 0;
				}

				meshReferences[ nodeDef.mesh ] ++;

                // TODO: Turned off skinning and bone support
				// Nothing in the mesh definition indicates whether it is
				// a SkinnedMesh or Mesh. Use the node's mesh reference
				// to mark SkinnedMesh if node has skin.
				// if ( nodeDef.skin !== undefined ) {
				// 	meshDefs[ nodeDef.mesh ].isSkinnedMesh = true;
				// }
			}
        }
        
        this.json.meshReferences = meshReferences
        this.json.meshUses = meshUses
	}
	
		/**
	 * Requests all dependencies of the specified type asynchronously, with caching.
	 * @param {string} type
	 * @return {Promise<Array<Object>>}
	 */
    private getDependencies = async (type: string): Promise<Array<Object>> => {
        let dependencies = this.cache.get(type)

        if (!dependencies) {
            const defs = this.json[type + (type === 'mesh' ? 'es' : 's')] || []

            dependencies = await Promise.all(defs.map((def: any, index: number) => {
                return this.getDependency(type, index)
            }))
            this.cache.add(type, dependencies)
		}

        return Promise.resolve(dependencies)
	}
	

	private getDependency_test = async (type: DependencyTypes, index: number) => {
		const cacheKey = type + ':' + index
		switch(type) {
			case 'scene': {
				const dep = this.cache.get(cacheKey) as THREE.Scene
				if (dep) return dep

				return this.loadScene(index)
			}
		}
	}

    /**
	 * Requests the specified dependency asynchronously, with caching.
	 * @param {string} type
	 * @param {number} index
	 * @return {Promise<THREE.Object3D|THREE.Material|THREE.Texture|THREE.AnimationClip|ArrayBuffer|Object>}
	 */
    private getDependency = async (type: string, index: number): Promise<THREE.Object3D|THREE.Material|THREE.Texture|THREE.AnimationClip|ArrayBuffer|Object|null|undefined> => {
		// console.log(`Getting dep of type: ${type}`)
        const cacheKey = type + ':' + index
        let dependency: Promise<THREE.Object3D|THREE.Material|THREE.Texture|THREE.AnimationClip|ArrayBuffer|THREE.BufferAttribute|THREE.InterleavedBufferAttribute|Object|null|undefined>
             = this.cache.get(cacheKey)

        if (!dependency) {
            switch(type) {
                case 'scene':
					dependency = this.loadScene( index );
					break;
				case 'node':
					dependency = this.loadNode( index );
					break;
				case 'mesh':
					dependency = this.loadMesh( index );
					break;
				case 'accessor':
					dependency = this.loadAccessor( index );
					break;
				case 'bufferView':
					dependency = this.loadBufferView( index );
					break;
				case 'buffer':
					dependency = this.loadBuffer( index );
					break;
				case 'material':
					dependency = this.loadMaterial( index );
					break;
				case 'texture':
					dependency = this.loadTexture( index );
					break;
				case 'skin':
                    // TODO: Disabled skin support
					// dependency = this.loadSkin( index );
					break;
				case 'animation':
                    // TODO: Disabled animation support
					// dependency = this.loadAnimation( index );
					break;
				case 'camera':
					dependency = this.loadCamera( index );
					break;
				case 'light':
					dependency = this.extensions[ EXTENSIONS.KHR_LIGHTS_PUNCTUAL ].loadLight( index );
					break;
				default:
                    throw new Error( 'Unknown type: ' + type );
                    
            }
            this.cache.add(cacheKey, dependency)
        }
        return await dependency
    }

    /**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferIndex
	 * @return {Promise<ArrayBuffer>}
	 */
    private loadBuffer = (bufferIndex: number): Promise<ArrayBuffer> => {
        const bufferDef = this.json.buffers[bufferIndex]
        const loader = this.fileLoader

        if (bufferDef.type && bufferDef.type !== 'arraybuffer') {
            throw new Error( 'THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.' );
        }

        // If present, GLB container is required to be the first buffer.
        if (bufferDef.uri === undefined && bufferIndex === 0) {
            return Promise.resolve(this.extensions[EXTENSIONS.KHR_BINARY_GLTF].body)
        }

        const options = this.options

        return new Promise((resolve,reject) => {
            loader.load(resolveURL(bufferDef.uri, options.path), (resolve as any), undefined, () => {
                reject( new Error( 'THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".' ) );
            })
        })
    }

    /**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferViewIndex
	 * @return {Promise<ArrayBuffer>}
	 */
    private loadBufferView = (bufferViewIndex: number): Promise<ArrayBuffer> => {
        const bufferViewDef = this.json.bufferViews[bufferViewIndex]

        return this.getDependency('buffer', bufferViewDef.buffer).then(buffer => {
            const byteLength = bufferViewDef.byteLength || 0
            const byteOffset = bufferViewDef.byteOffset || 0
            return (buffer as ArrayBuffer).slice(byteOffset, byteOffset + byteLength)
        })
    }

    /**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
	 * @param {number} accessorIndex
	 * @return {Promise<THREE.BufferAttribute|THREE.InterleavedBufferAttribute>}
	 */
    private loadAccessor = async (accessorIndex: number) => {
        const accessorDef = this.json.accessors[accessorIndex]

        if (accessorDef.bufferView === undefined && accessorDef.sparse === undefined) {
            // Ignore empty accessor, which may be used to declare runtime
            // information about attributes coming from another source (e.g. Draco
            // compression extension).
            return Promise.resolve(null)
        }

        const pendingBufferViews = []

        if (accessorDef.bufferView !== undefined) {
            pendingBufferViews.push(this.getDependency('bufferView', accessorDef.bufferView))
        } else {
            pendingBufferViews.push(null)
        }

        if (accessorDef.sparse !== undefined) {
            pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.indices.bufferView ) )
			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.values.bufferView ) )
        }

        return await Promise.all(pendingBufferViews).then(bufferViews => {
            const bufferView = bufferViews[0]

            const itemSize = (WEBGL_TYPE_SIZES as any)[accessorDef.type]
            const TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType]

            // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
            const elementBytes = TypedArray.BYTES_PER_ELEMENT
            const itemBytes = elementBytes * itemSize
            const byteOffset = accessorDef.byteOffset || 0
            const byteStride = accessorDef.bufferView !== undefined ? this.json.bufferViews[accessorDef.bufferView].byteStride : undefined
            const normalized = accessorDef.normalized === true
            let array, bufferAttribute

            // The buffer is not interleaved if the stride is the item size in bytes.
            if (byteStride && byteStride !== itemBytes) {
                // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
                // This makes sure that IBA.count reflects accessor.count propertly
                const ibSlice = Math.floor(byteOffset / byteStride)
                const ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType + ':' + ibSlice + ':' + accessorDef.count
                let ib = this.cache.get(ibCacheKey)

                if (!ib) {
                    array = new TypedArray(bufferView, ibSlice * byteStride, accessorDef.count * byteStride / elementBytes)

                    // Integer parameters to IB/IBA are in array elements, not bytes.
                    ib = new THREE.InterleavedBuffer(array, byteStride / elementBytes)
                    this.cache.add(ibCacheKey, ib)
                }

                bufferAttribute = new THREE.InterleavedBufferAttribute(ib, itemSize, (byteOffset % byteStride) / elementBytes, normalized)
            } else {
                if (bufferView === null) {
                    array = new TypedArray(accessorDef.count * itemSize)
                } else {
                    array = new TypedArray(bufferView, byteOffset, accessorDef.count * itemSize)
                }

                bufferAttribute = new THREE.BufferAttribute(array, itemSize, normalized)
            }

            // Handle sparce accessors
            // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
            if (accessorDef.sparse !== undefined) {
                const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
				const TypedArrayIndices = WEBGL_COMPONENT_TYPES[ accessorDef.sparse.indices.componentType ];

				const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
				const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

				const sparseIndices = new TypedArrayIndices( bufferViews[ 1 ], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices );
				const sparseValues = new TypedArray( bufferViews[ 2 ], byteOffsetValues, accessorDef.sparse.count * itemSize );

				if ( bufferView !== null ) {

					// Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
					bufferAttribute = new THREE.BufferAttribute( (bufferAttribute.array as any).slice(), bufferAttribute.itemSize, bufferAttribute.normalized );

				}

				for ( let i = 0, il = sparseIndices.length; i < il; i ++ ) {

					const index = sparseIndices[ i ];

					bufferAttribute.setX( index, sparseValues[ i * itemSize ] );
					if ( itemSize >= 2 ) bufferAttribute.setY( index, sparseValues[ i * itemSize + 1 ] );
					if ( itemSize >= 3 ) bufferAttribute.setZ( index, sparseValues[ i * itemSize + 2 ] );
					if ( itemSize >= 4 ) bufferAttribute.setW( index, sparseValues[ i * itemSize + 3 ] );
					if ( itemSize >= 5 ) throw new Error( 'THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.' );

				}
            }

            return bufferAttribute
        })
    }

    /**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
	 * @param {number} textureIndex
	 * @return {Promise<THREE.Texture>}
	 */
    public loadTexture = (textureIndex: number) => {
        const URL = window.URL || window.webkitURL
        const textureDef = this.json.textures[textureIndex]
        const textureExtensions = textureDef.extensions || {}
        let source: any

        if (textureExtensions[EXTENSIONS.MSFT_TEXTURE_DDS]) {
            source = this.json.images[textureExtensions[EXTENSIONS.MSFT_TEXTURE_DDS].source]
        } else {
            source = this.json.images[textureDef.source]
        }

        let sourceURI = source.uri
        let isObjectURL = false

        if (source.bufferView !== undefined) {
            // Load binary image data from bufferView, if provided.
            sourceURI = this.getDependency('bufferView', source.bufferView).then(bufferView => {
                isObjectURL = true
                const blob = new Blob([bufferView as any], { type: source.mimeType })
                sourceURI = URL.createObjectURL(blob)
                return sourceURI
            })
        }

        return Promise.resolve(sourceURI).then(sourceURI => {
            // Load texture resource
            let loader = this.options.manager.getHandler(sourceURI)
            if (!loader) {
                loader = textureExtensions[EXTENSIONS.MSFT_TEXTURE_DDS]
                    ? this.extensions[EXTENSIONS.MSFT_TEXTURE_DDS].ddsLoader
                    : this.textureLoader
            }

            return new Promise((resolve, reject) => {
                loader.load(resolveURL(sourceURI, this.options.path), resolve, undefined, reject)
            })
        }).then(result => {
            let texture: THREE.Texture = result as THREE.Texture
            // Clean up resources and configure Texture.
            if (isObjectURL === true) {
                URL.revokeObjectURL(sourceURI)
            }

            texture.flipY = false

            if (textureDef.name !== undefined) texture.name = textureDef.name

            // Ignore unknown mime types, like DDS files.
            if ( source.mimeType in MIME_TYPE_FORMATS ) {
				texture.format = MIME_TYPE_FORMATS[ source.mimeType ];
			}

			const samplers = this.json.samplers || {};
			const sampler = samplers[ textureDef.sampler ] || {};

			texture.magFilter = WEBGL_FILTERS[ sampler.magFilter ] || THREE.LinearFilter;
			texture.minFilter = WEBGL_FILTERS[ sampler.minFilter ] || THREE.LinearMipmapLinearFilter;
			texture.wrapS = WEBGL_WRAPPINGS[ sampler.wrapS ] || THREE.RepeatWrapping;
			texture.wrapT = WEBGL_WRAPPINGS[ sampler.wrapT ] || THREE.RepeatWrapping;

			return texture;
        })
    }

    /**
	 * Asynchronously assigns a texture to the given material parameters.
	 * @param {Object} materialParams
	 * @param {string} mapName
	 * @param {Object} mapDef
	 * @return {Promise}
	 */
    public assignTexture = (materialParams: any, mapName: string, mapDef: any): Promise<any> => {
        return this.getDependency('texture', mapDef.index).then(texture => {
            if (!(texture as any).isCompressedTexture) {
                switch(mapName) {
                    case 'aoMap':
                    case 'emissiveMap':
                    case 'metalnessMap':
                    case 'normalMap':
                    case 'roughnessMap':
                        (texture as any).format = THREE.RGBFormat
                        break
                }
            }

            if (this.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]) {
                const transform = mapDef.extensions !== undefined ? mapDef.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined
                if (transform) {
                    texture = this.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM].extendTexture(texture, transform)
                }
            }

            materialParams[mapName] = texture
        })
    }

    /**
	 * Assigns final material to a Mesh, Line, or Points instance. The instance
	 * already has a material (generated from the glTF material options alone)
	 * but reuse of the same glTF material may require multiple threejs materials
	 * to accomodate different primitive types, defines, etc. New materials will
	 * be created if necessary, and reused from a cache.
	 * @param  {THREE.Object3D} mesh Mesh, Line, or Points instance.
	 */
    public assignFinalMaterial = (mesh: THREE.Mesh | THREE.Points | THREE.Line) => {
        const geometry = mesh.geometry as THREE.BufferGeometry
        let material = mesh.material as THREE.Material

        const useVertexTangents = geometry.attributes.tangent !== undefined
		const useVertexColors = geometry.attributes.color !== undefined
		const useFlatShading = geometry.attributes.normal === undefined
		// const useSkinning = mesh.isSkinnedMesh === true // TODO: disabled skin support
		const useMorphTargets = Object.keys( geometry.morphAttributes ).length > 0
        const useMorphNormals = useMorphTargets && geometry.morphAttributes.normal !== undefined
        
        if ((mesh as THREE.Points).isPoints) {
            const cacheKey = 'PointsMaterial:' + material.uuid
			let pointsMaterial = this.cache.get( cacheKey )

			if ( ! pointsMaterial ) {
				pointsMaterial = new THREE.PointsMaterial()
				THREE.Material.prototype.copy.call( pointsMaterial, material )
				pointsMaterial.color.copy( (material as any).color )
				pointsMaterial.map = (material as any).map
				pointsMaterial.sizeAttenuation = false // glTF spec says points should be 1px
				this.cache.add( cacheKey, pointsMaterial )
			}

			material = pointsMaterial
        } else if ((mesh as THREE.Line).isLine) {
            const cacheKey = 'LineBasicMaterial:' + material.uuid
			let lineMaterial = this.cache.get( cacheKey )

			if ( ! lineMaterial ) {
				lineMaterial = new THREE.LineBasicMaterial()
				THREE.Material.prototype.copy.call( lineMaterial, material )
				lineMaterial.color.copy( (material as any).color )
				this.cache.add( cacheKey, lineMaterial )
			}

			material = lineMaterial;
        }

        // Clone the material if it will be modified
        if (useVertexTangents || useVertexColors || useFlatShading || useMorphTargets) {
            let cacheKey = 'ClonedMaterial:' + material.uuid + ':';

			if ( (material as any).isGLTFSpecularGlossinessMaterial ) cacheKey += 'specular-glossiness:';
			// if ( useSkinning ) cacheKey += 'skinning:';
			if ( useVertexTangents ) cacheKey += 'vertex-tangents:';
			if ( useVertexColors ) cacheKey += 'vertex-colors:';
			if ( useFlatShading ) cacheKey += 'flat-shading:';
			if ( useMorphTargets ) cacheKey += 'morph-targets:';
			if ( useMorphNormals ) cacheKey += 'morph-normals:';

			let cachedMaterial = this.cache.get( cacheKey );

			if ( ! cachedMaterial ) {
				cachedMaterial = (material as any).isGLTFSpecularGlossinessMaterial
					? this.extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ].cloneMaterial( material )
					: material.clone();

				// if ( useSkinning ) cachedMaterial.skinning = true;
				if ( useVertexTangents ) cachedMaterial.vertexTangents = true;
				if ( useVertexColors ) cachedMaterial.vertexColors = THREE.VertexColors;
				if ( useFlatShading ) cachedMaterial.flatShading = true;
				if ( useMorphTargets ) cachedMaterial.morphTargets = true;
				if ( useMorphNormals ) cachedMaterial.morphNormals = true;

				this.cache.add( cacheKey, cachedMaterial );
			}

			material = cachedMaterial;
        }

        // workarounds for mesh and geometry
		if ( (material as any).aoMap && geometry.attributes.uv2 === undefined && geometry.attributes.uv !== undefined ) {
			console.log( 'THREE.GLTFLoader: Duplicating UVs to support aoMap.' );
			geometry.setAttribute( 'uv2', new THREE.BufferAttribute( geometry.attributes.uv.array, 2 ) );
		}

		if ( (material as any).isGLTFSpecularGlossinessMaterial ) {
			// for GLTFSpecularGlossinessMaterial(ShaderMaterial) uniforms runtime update
			mesh.onBeforeRender = this.extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ].refreshUniforms;
		}

		mesh.material = material;
    }

    /**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
	 * @param {number} materialIndex
	 * @return {Promise<THREE.Material>}
	 */
    public loadMaterial = async (materialIndex: number): Promise<THREE.Material> => {
        const materialDef = this.json.materials[materialIndex]

        let materialType: any
        const materialParams: {[key:string]:any} = {}
        const materialExtensions = materialDef.extensions || {}

        const pending = []

        if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ] ) {
			const sgExtension = this.extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ];
			materialType = sgExtension.getMaterialType();
			pending.push( sgExtension.extendParams( materialParams, materialDef, this ) );
		} else if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ] ) {
			const kmuExtension = this.extensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ];
			materialType = kmuExtension.getMaterialType();
			pending.push( kmuExtension.extendParams( materialParams, materialDef, this ) );
		} else {
			materialType = THREE.MeshStandardMaterial;

			const metallicRoughness = materialDef.pbrMetallicRoughness || {};

			materialParams.color = new THREE.Color( 1.0, 1.0, 1.0 );
			materialParams.opacity = 1.0;

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {
				const array = metallicRoughness.baseColorFactor;
				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];
			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {
				pending.push( this.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture ) );
			}

			materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
			materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

			if ( metallicRoughness.metallicRoughnessTexture !== undefined ) {
				pending.push( this.assignTexture( materialParams, 'metalnessMap', metallicRoughness.metallicRoughnessTexture ) );
				pending.push( this.assignTexture( materialParams, 'roughnessMap', metallicRoughness.metallicRoughnessTexture ) );
			}
        }

        // [RM] Make all materials double sided
        materialParams.side = THREE.DoubleSide
        // if ( materialDef.doubleSided === true ) {
		// 	materialParams.side = THREE.DoubleSide;
        // }
        
        const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

		if ( alphaMode === ALPHA_MODES.BLEND ) {
			materialParams.transparent = true;
		} else {
			materialParams.transparent = false;

			if ( alphaMode === ALPHA_MODES.MASK ) {
				materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;
			}
		}

		if ( materialDef.normalTexture !== undefined && materialType !== THREE.MeshStandardMaterial ) {
			pending.push( this.assignTexture( materialParams, 'normalMap', materialDef.normalTexture ) );
			materialParams.normalScale = new THREE.Vector2( 1, 1 );

			if ( materialDef.normalTexture.scale !== undefined ) {
				materialParams.normalScale.set( materialDef.normalTexture.scale, materialDef.normalTexture.scale );
			}
		}

		if ( materialDef.occlusionTexture !== undefined && materialType !== THREE.MeshStandardMaterial ) {
			pending.push( this.assignTexture( materialParams, 'aoMap', materialDef.occlusionTexture ) );

			if ( materialDef.occlusionTexture.strength !== undefined ) {
				materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;
			}
		}

		if ( materialDef.emissiveFactor !== undefined && materialType !== THREE.MeshStandardMaterial ) {
			materialParams.emissive = new THREE.Color().fromArray( materialDef.emissiveFactor );
		}

		if ( materialDef.emissiveTexture !== undefined && materialType !== THREE.MeshStandardMaterial ) {
			pending.push( this.assignTexture( materialParams, 'emissiveMap', materialDef.emissiveTexture ) );
		}

		return await Promise.all( pending ).then(() => {
			let material;

			if ( materialType === THREE.ShaderMaterial ) {
				material = this.extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ].createMaterial( materialParams );
			} else {
				material = new materialType( materialParams );
			}

			if ( materialDef.name !== undefined ) material.name = materialDef.name;

			// baseColorTexture, emissiveTexture, and specularGlossinessTexture use sRGB encoding.
			if ( material.map ) material.map.encoding = THREE.sRGBEncoding;
			if ( material.emissiveMap ) material.emissiveMap.encoding = THREE.sRGBEncoding;
			if ( material.specularMap ) material.specularMap.encoding = THREE.sRGBEncoding;

			assignExtrasToUserData( material, materialDef );

			if ( materialDef.extensions ) addUnknownExtensionsToUserData( this.extensions, material, materialDef );

			return material;

		} );
    }

	/**
     * 
	 * @param {THREE.BufferGeometry} geometry
	 * @param {GLTF.Primitive} primitiveDef
	 * @param {GLTFParser} parser
	 */
    public computeBounds = (geometry: THREE.BufferGeometry, primitiveDef: IGLTFPrimitive, parser: GLTFParser) => {
		const attributes = primitiveDef.attributes;
		const box = new THREE.Box3();

		if ( attributes.POSITION !== undefined ) {
			const accessor = parser.json.accessors[ attributes.POSITION ];
			const min = accessor.min;
			const max = accessor.max;

			box.set(
				new THREE.Vector3( min[ 0 ], min[ 1 ], min[ 2 ] ),
                new THREE.Vector3( max[ 0 ], max[ 1 ], max[ 2 ] ) 
            )
		} else {
			return;
		}

		const targets = primitiveDef.targets;

		if ( targets !== undefined ) {
			const vector = new THREE.Vector3();

			for ( let i = 0, il = targets.length; i < il; i ++ ) {
				const target = targets[ i ];
				if ( target.POSITION !== undefined ) {
					const accessor = parser.json.accessors[ target.POSITION ];
					const min = accessor.min;
                    const max = accessor.max;
					// we need to get max of absolute components because target weight is [-1,1]
					vector.setX( Math.max( Math.abs( min[ 0 ] ), Math.abs( max[ 0 ] ) ) );
					vector.setY( Math.max( Math.abs( min[ 1 ] ), Math.abs( max[ 1 ] ) ) );
					vector.setZ( Math.max( Math.abs( min[ 2 ] ), Math.abs( max[ 2 ] ) ) );

					box.expandByVector( vector );
				}
			}
		}
        geometry.boundingBox = box;
        
		const sphere = new THREE.Sphere();
		box.getCenter( sphere.center );
		sphere.radius = box.min.distanceTo( box.max ) / 2;
		geometry.boundingSphere = sphere;
    }

    /**
	 * @param {THREE.BufferGeometry} geometry
	 * @param {GLTF.Primitive} primitiveDef
	 * @param {GLTFParser} parser
	 * @return {Promise<THREE.BufferGeometry>}
	 */
    private addPrimitiveAttributes = async (geometry: THREE.BufferGeometry, primitiveDef: IGLTFPrimitive): Promise<THREE.BufferGeometry> => {
        const attributes = primitiveDef.attributes
        const pending = []

        const assignAttributeAccessor = (accessorIndex: number, attributeName: string) => {
            return this.getDependency('accessor', accessorIndex)
                .then(accessor => {
                    geometry.setAttribute(attributeName, (accessor as any))
                })
        }

        for (const gltfAttributeName in attributes) {
            const threeAttributeName = ATTRIBUTES[gltfAttributeName] || gltfAttributeName.toLowerCase()
            // Skip attributes already provided by e.g. Draco extension.
            if (threeAttributeName in geometry.attributes) continue
            pending.push(assignAttributeAccessor(attributes[gltfAttributeName], threeAttributeName))
        }

        if (primitiveDef.indices !== undefined && !geometry.index) {
            const accessor = this.getDependency('accessor', primitiveDef.indices).then(accessor => {
                geometry.setIndex(accessor as THREE.BufferAttribute)
            })
            pending.push(accessor)
        }

        assignExtrasToUserData(geometry, primitiveDef)
        this.computeBounds(geometry, primitiveDef, this)

        return await Promise.all(pending).then(() => {
            return primitiveDef.targets !== undefined
                ? addMorphTargets(geometry, primitiveDef.targets, this)
                : geometry
        })
    }

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
	 *
	 * Creates BufferGeometries from primitives.
	 *
	 * @param {Array<GLTF.Primitive>} primitives
	 * @return {Promise<Array<THREE.BufferGeometry>>}
	 */
    private loadGeometries = async (primitives: IGLTFPrimitive[]): Promise<THREE.BufferGeometry[]> => {
        const createDracoPrimitive = (primitive: IGLTFPrimitive): Promise<THREE.BufferGeometry> => {
			return this.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]
				.decodePrimitive(primitive, this)
				.then((geometry: THREE.BufferGeometry) => {
					return this.addPrimitiveAttributes(geometry, primitive)
				})
		}

		const pending: Promise<THREE.BufferGeometry>[] = []

		for (let i = 0, il = primitives.length; i < il; i++) {
			const primitive = primitives[i];
			const cacheKey = createPrimitiveKey(primitive)

			// See if we've already created this geometry
			const cached = this.primitiveCache[cacheKey]

			if (cached) pending.push(cached.promise)
			else {
				let geometryPromise: Promise<THREE.BufferGeometry>

				if (primitive.extensions && primitive.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]) {
					// Use DRACO geometry if available
					geometryPromise = createDracoPrimitive(primitive)
				} else {
					// Otherwise create a new geometry
					geometryPromise = this.addPrimitiveAttributes(new THREE.BufferGeometry(), primitive)
				}

				// Cache this geometry
				this.primitiveCache[cacheKey] = { primitive: primitive, promise: geometryPromise }
				pending.push(geometryPromise)
			}
		}

		return await Promise.all(pending)
	}
	
	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
	 * @param {number} meshIndex
	 * @return {Promise<THREE.Group|THREE.Mesh|THREE.SkinnedMesh>}
	 */
	private loadMesh = async (meshIndex: number) => {
		// console.log(`Preloading mesh ${meshIndex}`)
		const meshDef = this.json.meshes[meshIndex]
		const primitives: IGLTFPrimitive[] = meshDef.primitives

		let pending = []

		for (let i = 0; i < primitives.length; i++) {
			const material = primitives[i].material === undefined
				? createDefaultMaterial()
				: this.getDependency('material', primitives[i].material!)
			pending.push(material)
		}

		return await Promise.all(pending).then(originalMaterials => {
			// console.log(`Material Dependencies for mesh ${meshIndex} loaded.`)
			return this.loadGeometries(primitives).then(geometries => {
				// console.log(`Geometry Dependencies for mesh ${meshIndex} loaded.`)
				const meshes = []

				for (let i = 0; i < geometries.length; i++) {
					const geometry = geometries[i]
					const primitive = primitives[i]

					// Create Mesh
					let mesh
					const material = originalMaterials[i] as THREE.Material

					// [RM] Skinning is disabled and triangle draw modes are no longer supported
					if (
						primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
						primitive.mode === undefined
					) {
						mesh = new THREE.Mesh(geometry, material)
					} else if (primitive.mode === WEBGL_CONSTANTS.LINES) {
						mesh = new THREE.LineSegments(geometry, material)
					} else if (primitive.mode === WEBGL_CONSTANTS.LINE_STRIP) {
						mesh = new THREE.Line(geometry, material)
					} else if (primitive.mode === WEBGL_CONSTANTS.LINE_LOOP) {
						mesh = new THREE.LineLoop(geometry, material)
					} else if (primitive.mode === WEBGL_CONSTANTS.POINTS) {
						mesh = new THREE.Points(geometry, material)
					} else {
						throw new Error('THREE.GLTFLoader: Primitive mode unsupported: ' + primitive.mode)
					}

					// [RM] Morph targets not supported

					mesh.name = meshDef.name || ('mesh_' + meshIndex)

					if (geometries.length > 1) mesh.name += '_' + i
					assignExtrasToUserData(mesh, meshDef)
					this.assignFinalMaterial(mesh)
					meshes.push(mesh)
				}

				if (meshes.length === 1) {
					return meshes[0]
				}

				const group = new THREE.Group()
				for (let i = 0; i < meshes.length; i++) {
					group.add(meshes[i])
				}

				return group
			})
		})
	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
	 * @param {number} cameraIndex
	 * @return {Promise<THREE.Camera>}
	 */
	private loadCamera = (cameraIndex: number) => {
		let camera
		const cameraDef = this.json.cameras[cameraIndex]
		const params = cameraDef[cameraDef.type]

		if (!params) {
			console.warn('THREE.GLTFLoader: Missing camera parameters')
			return Promise.resolve(undefined)
		}

		if (cameraDef.type === 'perspective') {
			camera = new THREE.PerspectiveCamera(
				THREE.MathUtils.radToDeg(params.yfov),
				params.aspectRation || 1,
				params.znear || 1,
				params.zfar || 2e6
			)
		} else if (cameraDef.type === 'orthographic') {
			camera = new THREE.OrthographicCamera(
				params.xmag / - 2,
				params.xmag / 2,
				params.ymag / 2,
				params.ymag / - 2,
				params.znear,
				params.zfar
			)
		}

		if (cameraDef.name !== undefined) (camera as THREE.Camera).name = cameraDef.name
		assignExtrasToUserData(camera, cameraDef)
		return Promise.resolve(camera)
	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
	 * @param {number} nodeIndex
	 * @return {Promise<THREE.Object3D>}
	 */
	private loadNode = async (nodeIndex: number) => {
		// console.log(`Preloading node ${nodeIndex}`)
		const meshReferences = this.json.meshReferences
		const meshUses = this.json.meshUses
		const nodeDef = this.json.nodes[nodeIndex]
		
		let pending = []

		if (nodeDef.mesh !== undefined) {
			pending.push(this.getDependency('mesh', nodeDef.mesh).then(dep => {
				let node
				const mesh = dep as THREE.Object3D
				if (meshReferences[nodeDef.mesh] > 1) {
					const instanceNum = meshUses[nodeDef.mesh] ++

					node = mesh.clone()
					node.name += '_instance_' + instanceNum

					// onBeforeRender copy for Specular-Glossiness
					node.onBeforeRender = mesh.onBeforeRender

					for (let i = 0; i < node.children.length; i++) {
						node.children[i].name += '_instance_' + instanceNum
						node.children[i].onBeforeRender = mesh.children[i].onBeforeRender
					}
				} else {
					node = mesh
				}

				// [RM] Mesh weights are not supported
				return node
			}))
		}

		if (nodeDef.camera !== undefined) {
			pending.push(this.getDependency('camera', nodeDef.camera))
		}

		if (
			nodeDef.extensions &&
			nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL] &&
			nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL].light !== undefined
		) {
			pending.push(this.getDependency('light', nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL].light))
		}

		return await Promise.all(pending).then(objects => {
			// console.log(`Mesh dependencies for node ${nodeIndex} loaded.`)
			let node: THREE.Object3D
			// [RM] Bones are not supported
			if (objects.length > 1) {
				node = new THREE.Group()
			} else if (objects.length === 1) {
				node = objects[0] as THREE.Object3D
			} else {
				node = new THREE.Object3D()
			}

			if (node !== objects[0]) {
				for (let i = 0; i < objects.length; i++) {
					(node as THREE.Group).add(objects[i] as THREE.Object3D)
				}
			}

			// console.log('Parsed to name')
			if (nodeDef.name !== undefined) {
				// console.log('Adding name')
				node.userData.name = nodeDef.name
				node.name = THREE.PropertyBinding.sanitizeNodeName(nodeDef.name)
			}
			// console.log('adding properties')
			assignExtrasToUserData(node, nodeDef)
			// console.log(node,nodeDef)
			if (nodeDef.extensions) {
				addUnknownExtensionsToUserData(this.extensions, node, nodeDef)
			}

			if (nodeDef.matrix !== undefined) {
				let matrix = new THREE.Matrix4()
				matrix.fromArray(nodeDef.matrix)
				node.applyMatrix4(matrix)
			} else {
				if (nodeDef.translation !== undefined) {
					node.position.fromArray(nodeDef.translation)
				}
				if (nodeDef.rotation !== undefined) {
					node.quaternion.fromArray(nodeDef.rotation)
				}
				if (nodeDef.scale !== undefined) {
					node.scale.fromArray(nodeDef.scale)
				}
			}

			return node
		})
	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
	 * @param {number} sceneIndex
	 * @return {Promise<THREE.Scene>}
	 */
	private loadScene = async (sceneIndex: number) => {
		const buildNodeHierachy = async (nodeId: number, parentObject: THREE.Object3D, json: any, parser: GLTFParser) => {
			const nodeDef = json.nodes[nodeId]
			const node: THREE.Object3D = await parser.getDependency('node', nodeId) as THREE.Object3D
			parentObject.add(node)
			if (nodeDef.children) {
				const children = nodeDef.children
				for (let i = 0; i < children.length; i++) {
					const child = children[i];
					await buildNodeHierachy(child, node, json, parser)
				}
			}
			return
		}

		const sceneDef = this.json.scenes[sceneIndex]
		const scene = new THREE.Scene()
		if (sceneDef.name !== undefined) scene.name = sceneDef.name

		assignExtrasToUserData(scene, sceneDef)

		if (sceneDef.extensions) addUnknownExtensionsToUserData(this.extensions, scene, sceneDef)

		const nodeIds = sceneDef.nodes || []

		const pending = []

		for (let i = 0; i < nodeIds.length; i++) {
			pending.push(buildNodeHierachy(nodeIds[i], scene, this.json, this))
		}

		return await Promise.all(pending).then(() => {
			return scene
		})
	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
	 * @param {number} skinIndex
	 * @return {Promise<Object>}
	 */
	private loadSkin = (skinIndex: number) => {
		throw new Error('GLTFParser: Not Implemented Yet.')
	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
	 * @param {number} animationIndex
	 * @return {Promise<THREE.AnimationClip>}
	 */
	private loadAnimation = (animationIndex: number) => {
		throw new Error('GLTFParser: Not Implemented Yet.')
	}
}