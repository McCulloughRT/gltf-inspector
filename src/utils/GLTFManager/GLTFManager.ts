import { LoadingManager, LoaderUtils, FileLoader } from "three"
import { glBuffer, glTF, glNode } from "../../types/gltf"
import { resolveURL } from "../ThreeViewer/utils/GLTFLoader/functions"
import { WEBGL_TYPE_SIZES, WEBGL_COMPONENT_TYPES } from "../ThreeViewer/utils/GLTFLoader/constants"

export class GLTFManager {
    private fileLoader?: FileLoader
    private baseURL?: string

    public rootPath: string
    public assetMap: Map<string,File>
    public gltfFile: File

    public gltf?: glTF
    public gltfURL?: string

    constructor(rootFile: File, rootPath: string, assetMap: Map<string,File>) {
        this.gltfFile = rootFile
        this.rootPath = rootPath
        this.assetMap = assetMap
    }

    public ParseGltf = async () => {
        const gltfText = await this.gltfFile.text()
        const gltf = JSON.parse(gltfText) as glTF
        this.gltf = process(gltf)

        // const blob = new Blob([gltfText], {type : 'application/json'});
        this.gltfURL = URL.createObjectURL(this.gltfFile)
        this.initializeFileLoader(this.gltfURL)
        return this.gltf
    }

    public LoadAccessorData = async (accessorIndex: number): Promise<ArrayBuffer | undefined> => {
        if (this.gltf == null) throw new Error('BufferLoader: Required parameters did not exist.')
        const accessorDef = this.gltf.accessors[accessorIndex]

        if (accessorDef.bufferView === undefined && accessorDef.sparse === undefined) {
            // Ignore empty accessor, which may be used to declare runtime
            // information about attributes coming from another source (e.g. Draco
            // compression extension).
            return Promise.resolve(undefined)
        }

        const bufferViewData = await this.LoadViewData(accessorDef.bufferView)

        const itemSize = (WEBGL_TYPE_SIZES as any)[accessorDef.type]
        const TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType]

        // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
        const elementBytes = TypedArray.BYTES_PER_ELEMENT
        const itemBytes = elementBytes * itemSize
        const byteOffset = accessorDef.byteOffset || 0
        const byteStride = accessorDef.bufferView !== undefined ? this.gltf.bufferViews[accessorDef.bufferView].byteStride : undefined
        let array: ArrayBuffer

        // The buffer is not interleaved if the stride is the item size in bytes.
        if (byteStride && byteStride !== itemBytes) {
            // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
            // This makes sure that IBA.count reflects accessor.count propertly
            const ibSlice = Math.floor(byteOffset / byteStride)
            array = new TypedArray(bufferViewData, ibSlice * byteStride, accessorDef.count * byteStride / elementBytes)
        } else {
            if (bufferViewData === null) {
                array = new TypedArray(accessorDef.count * itemSize)
            } else {
                array = new TypedArray(bufferViewData, byteOffset, accessorDef.count * itemSize)
            }
        }

        return array
    }

    public LoadViewData = async (viewIndex: number): Promise<ArrayBuffer> => {
        if (this.gltf == null) throw new Error('BufferLoader: Required parameters did not exist.')
        const viewDef = this.gltf.bufferViews[viewIndex]
        const buffer = await this.loadBuffer(viewDef.buffer)
        const byteOffset = viewDef.byteOffset || 0
        const byteLength = viewDef.byteLength || 0
        return buffer.slice(byteOffset, byteOffset + byteLength)
    }

    public loadBuffer = (bufferIndex: number): Promise<ArrayBuffer> => {
        if (this.gltf == null || this.fileLoader == null) throw new Error('BufferLoader: Required parameters did not exist.')
        const bufferDef = this.gltf.buffers[bufferIndex]

        if (bufferDef.type && bufferDef.type !== 'arraybuffer') {
            throw new Error( 'BufferLoader: ' + bufferDef.type + ' buffer type is not supported.' );
        }

        // If present, GLB container is required to be the first buffer.
        if (bufferDef.uri === undefined && bufferIndex === 0) {
            // return Promise.resolve(this.extensions[EXTENSIONS.KHR_BINARY_GLTF].body)
        }

        return new Promise((resolve,reject) => {
            if (this.fileLoader == null || this.baseURL == null) return reject()

			const uri = bufferDef.uri
			const path = this.baseURL
			const url = resolveURL(uri, path)
			console.log('RETRIEVING BUFFER ASSET', uri, path, url)
            this.fileLoader.load(
				url,  // url
				(resolve as any), // on load
				undefined, // on progress
				() => reject(new Error('THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".')) // on error
			)
        })
    }

    private initializeFileLoader = (url: string) => {
        this.baseURL = LoaderUtils.extractUrlBase(url)
        const manager = new LoadingManager()
        const blobURLs: string[] = []
        manager.setURLModifier((url: string) => {
            if (this.baseURL == null) this.baseURL = ''
            // URIs in a glTF file may be escaped, or not. Assume that assetMap is
            // from an un-escaped source, and decode all URIs before lookups.
            // See: https://github.com/donmccurdy/three-gltf-viewer/issues/146
            const normalizedURL = this.rootPath + decodeURI(url)
              .replace(this.baseURL, '')
              .replace(/^(\.?\/)/, '')
    
            console.log('NORM URL', normalizedURL)
    
            if (this.assetMap.has(normalizedURL)) {
              const blob = this.assetMap.get(normalizedURL)
              console.log('NORM URL MATCH', normalizedURL, blob)
              const blobURL = URL.createObjectURL(blob)
              blobURLs.push(blobURL)
              return blobURL
            }
            console.log('BLOB URLS', blobURLs)
            return url
        })
    
        const loader = new FileLoader(manager)
        loader.setCrossOrigin('anonymous')
        loader.setResponseType('arraybuffer')
        this.fileLoader = loader
    }
}

const orderNodes = (nodes: glNode[]) => {
    let count = 0
    const markNodes = (node: glNode, hierarchy: number): void => {
        node.hierarchy = hierarchy
        node.order = count
        count++

        if (node.children == null || node.children.length === 0) {
            return
        }

        hierarchy++
        for (let i = 0; i < node.children.length; i++) {
            const childIdx = node.children[i];
            nodes[childIdx].hierarchy = hierarchy
            markNodes(nodes[childIdx], hierarchy)
        }
    }
    
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.order != null) continue
        markNodes(node, 0)
    }

    return nodes.sort((a,b) => {
        if (a.order! > b.order!) return 1
        else if (a.order! < b.order!) return -1
        return 0
    })
}

function process(gltf: glTF) {
    const buffers = gltf.buffers
    for (let i = 0; i < buffers.length; i++) {
        const buffer = buffers[i];
        buffer.size = buffer.byteLength
        buffer.assetType = 'buffer'
        buffer.selfIndex = i
        buffer.referenceCount = 0
    }

    const views = gltf.bufferViews
    for (let i = 0; i < views.length; i++) {
        const view = views[i];
        view.size = view.byteLength
        view.assetType = 'view'
        view.selfIndex = i
        view.referenceCount = 0

        buffers[view.buffer].referenceCount! ++
    }

    const accessors = gltf.accessors
    for (let i = 0; i < accessors.length; i++) {
        const accessor = accessors[i];
        accessor.size = (views[accessor.bufferView].size || 0) - accessor.byteOffset
        accessor.assetType = 'accessor'
        accessor.selfIndex = i
        accessor.referenceCount = 0

        views[accessor.bufferView].referenceCount! ++
    }

    const materials = gltf.materials
    for (let i = 0; i < materials.length; i++) {
        const material = materials[i];
        material.assetType = 'material'
        material.selfIndex = i
        material.referenceCount = 0
    }

    const meshes = gltf.meshes
    for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        let meshSize = 0
        mesh.primitives.forEach(p => {
            let primitiveSize = 0

            const attributes = Object.keys(p.attributes)
            attributes.forEach(a => {
                const accessor = accessors[p.attributes[a]]
                accessor.referenceCount! ++

                if (accessor.size != null) primitiveSize += accessor.size
            })
    
            const indices = accessors[p.indices]
            indices.referenceCount! ++
            if (indices.size != null) primitiveSize += indices.size

            p.size = primitiveSize
            p.assetType = 'primitive'
            p.hierarchy = 1
            meshSize += primitiveSize

            if (p.material) materials[p.material].referenceCount! ++
        })

        mesh.assetType = 'mesh'
        mesh.size = meshSize
        mesh.selfIndex = i
        mesh.hierarchy = 0
        mesh.referenceCount = 0
    }

    const nodes = gltf.nodes
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.assetType = 'node'
        node.size = 0
        node.selfIndex = i
        
        if (node.mesh) {
            node.size = meshes[node.mesh].size
            meshes[node.mesh].referenceCount! ++
        }
    }
    orderNodes(gltf.nodes)
    return gltf
}