import * as THREE from 'three'
import { BINARY_EXTENSION_HEADER_MAGIC, EXTENSIONS } from './constants';
import { GLTFBinaryExtension } from './Extensions/BinaryExtension';
import { GLTFLightsExtension } from './Extensions/LightsExtension';
import { GLTFMaterialsUnlitExtension } from './Extensions/MaterialsUnlitExtension';
import { GLTFMaterialsPbrSpecularGlossinessExtension } from './Extensions/PbrSpecularGlossinessExtension';
import { GLTFDracoMeshCompressionExtension } from './Extensions/DracoExtension';
import { GLTFTextureDDSExtension } from './Extensions/TextureDDSExtension';
import { GLTFTextureTransformExtension } from './Extensions/TextureTransformExtension';
import { GLTFMeshQuantizationExtension } from './Extensions/MeshQuanitzationExtension';
import GLTFParser from './GLTFParser';
// import { GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader';

export class GLTFRegistery {
    public objects: { [key: string]: any } = {}
    public get = (key: string) => this.objects[key]
    public add = (key: string, obj: any) => this.objects[key] = obj
    public remove = (key: string) => delete this.objects[key]
    public removeAll = () => this.objects = {}
}

export default class GLTFLoader extends THREE.Loader {
    public dracoLoader: any
    public ddsLoader: any

    /**
     *
     */
    constructor(manager?: any) {
        super(manager);
        this.dracoLoader = null
        this.ddsLoader = null
    }

    public load = (
        url: string, 
        onLoad: (gltf: any) => void, 
        onProgress: (request: ProgressEvent<EventTarget>) => void, 
        onError: (error: any) => void
    ) => {
        let resourcePath: string
        
        if (this.resourcePath !== '') {
            resourcePath = this.resourcePath
            console.log('LOADER RESOURCE PATH OPT 1', resourcePath)
        } else if (this.path !== '') {
            resourcePath = this.path
            console.log('LOADER RESOURCE PATH OPT 2', resourcePath)
        } else {
            resourcePath = THREE.LoaderUtils.extractUrlBase(url)
            console.log('LOADER RESOURCE PATH OPT 3', resourcePath, url)
        }

        // Tells the LoadingManager to track an extra item, which resolves after
        // the model is fully loaded. This means the count of items loaded will
        // be incorrect, but ensures manager.onLoad() does not fire early
        this.manager.itemStart(url)

        const _onError = (e: any) => {
            if (onError) onError(e)
            else console.error(e)
            this.manager.itemError(url)
            this.manager.itemEnd(url)
        }

        const loader = new THREE.FileLoader(this.manager)
        loader.setPath(this.path)
        loader.setResponseType('arraybuffer')

        if (this.crossOrigin === 'use-credentials') {
            loader.setWithCredentials(true)
        }

        loader.load(url, data => {
            console.log('GLTF Loader Data: ', data)
            try {
                this.parse(data, resourcePath, (gltf: any) => {
                    onLoad(gltf)
                    this.manager.itemEnd(url)
                }, _onError)
            } catch (e) {
                _onError(e)
            }
        }, onProgress, _onError)
    }

    public setDRACOLoader = (dracoLoader: any) => {
        this.dracoLoader = dracoLoader
        return this
    }

    public setDDSLoader = (ddsLoader: any) => {
        this.ddsLoader = ddsLoader
        return this
    }

    public parse = (data: any, path: string, onLoad: (gltf: any) => void, onError: (error: any) => void) => {
        let content
        let extensions: {[key:  string]: any} = {}

        if (typeof data === 'string') {
            content = data
        } else {
            const magic = THREE.LoaderUtils.decodeText(new Uint8Array(data, 0, 4))
            if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
                try {
                    extensions[EXTENSIONS.KHR_BINARY_GLTF] = new GLTFBinaryExtension(data)
                } catch (e) {
                    if (onError) onError(e)
                    return
                }
                content = extensions[EXTENSIONS.KHR_BINARY_GLTF].content
                // console.log('KHR Binary Extension Magic Header', content)
            } else {
                content = THREE.LoaderUtils.decodeText(new Uint8Array(data))
            }
        }
        console.log('CONTENT', content)
        let json = JSON.parse(content)
        console.log('GLTF:', json)
        content = undefined
        if (json.asset === undefined || json.asset.version[0] < 2) {
            console.log(json.asset.version)
            if (onError) onError(new Error('THREE.GLTFLoader: Unsupported asset. glTF versions >= 2.0 are not supported'))
            return
        }

        if (json.extensionsUsed) {
            for (let i = 0; i < json.extensionsUsed.length; i++) {
                const extensionName = json.extensionsUsed[i];
                const extensionsRequired = json.extensionsRequired || []

                switch(extensionName) {
                    case EXTENSIONS.KHR_LIGHTS_PUNCTUAL:
                        extensions[extensionName] = new GLTFLightsExtension(json)
                        break

                    case EXTENSIONS.KHR_MATERIALS_UNLIT:
                        extensions[ extensionName ] = new GLTFMaterialsUnlitExtension();
                        break

                    case EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
                        extensions[ extensionName ] = new GLTFMaterialsPbrSpecularGlossinessExtension();
                        break

                    case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
                        extensions[ extensionName ] = new GLTFDracoMeshCompressionExtension( json, this.dracoLoader );
                        break

                    case EXTENSIONS.MSFT_TEXTURE_DDS:
                        extensions[ extensionName ] = new GLTFTextureDDSExtension( this.ddsLoader );
                        break

                    case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
                        extensions[ extensionName ] = new GLTFTextureTransformExtension();
                        break

                    case EXTENSIONS.KHR_MESH_QUANTIZATION:
                        extensions[ extensionName ] = new GLTFMeshQuantizationExtension();
                        break

                    default:
                        if (extensionsRequired.indexOf(extensionName) >= 0) {
                            console.warn( 'THREE.GLTFLoader: Unknown extension "' + extensionName + '".' );
                        }
                }
            }
        }

        let parser: GLTFParser | undefined = new GLTFParser(json, extensions, {
            path: path || this.resourcePath || '',
            crossOrigin: this.crossOrigin,
            manager: this.manager
        })
        parser.parse((gltf:any) => {
            json = undefined
            parser = undefined
            onLoad(gltf)
        }, onError)
    }
}