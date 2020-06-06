/**
 * Magic numbers to differentiate scalar and vector 
 * array buffers.
 * https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#buffers-and-buffer-views
 */
export enum Targets {
    ARRAY_BUFFER = 34962,
    ELEMENT_ARRAY_BUFFER = 34963
}

/**
 * Magic numbers to differentiate array buffer component types.
 * https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#accessor-element-size
 */
export enum ComponentType {
    BYTE = 5120,
    UNSIGNED_BYTE = 5121,
    SHORT = 5122,
    UNSIGNED_SHORT = 5123,
    UNSIGNED_INT = 5125,
    FLOAT = 5126
}

export enum AccessorType {
    SCALAR = "SCALAR",
    VEC2 = "VEC2",
    VEC3 = "VEC3",
    VEC4 = "VEC4",
    MAT2 = "MAT2",
    MAT3 = "MAT3",
    MAT4 = "MAT4",
}

export enum PrimitiveMode {
    POINTS = 0,
    LINES = 1,
    LINE_LOOP = 2,
    LINE_STRIP = 3,
    TRIANGLES = 4,
    TRIANGLE_STRIP = 5,
    TRIANGLE_FAN = 6
}

interface IGLTFExtention {
    assetType?: 'node' | 'mesh' | 'primitive' | 'accessor' | 'view' | 'buffer' | 'material'
    selfIndex?: number
    hierarchy?: number
    order?: number
    size?: number
    referenceCount?: number
    [key: string]: any
}

export interface glTF {
    asset: { version: number[] }
    scenes: glScene[],
    nodes: glNode[],
    meshes: glMesh[],
    buffers: glBuffer[],
    bufferViews: glBufferView[],
    accessors: glAccessor[],
    materials: glMaterial[]
}

export interface glScene {
    nodes: number[]
}

export interface glNode extends IGLTFExtention {
    name?: string
    mesh?: number
    matrix?: number[]
    extras?: { [key: string]: any }
    children?: number[]
    assetType?: 'node'
}

export interface glMesh extends IGLTFExtention {
    name?: string
    primitives: glPrimitive[]
    assetType?: 'mesh'
}

export interface glPrimitive extends IGLTFExtention {
    attributes: {
        POSITION: number
        [key: string]: number
    }
    indices: number
    material?: number
    mode: PrimitiveMode
    assetType?: 'primitive'
}

export interface glMaterial extends IGLTFExtention {
    name: string
    pbrMetallicRoughness: {
        baseColorFactor: number[]
        metallicFactor: number
        roughnessFactor: number
    }
    assetType?: 'material'
}

export interface glBuffer extends IGLTFExtention {
    uri: string
    byteLength: number
    assetType?: 'buffer'
}

export interface glBufferView extends IGLTFExtention {
    buffer: number
    byteOffset: number
    byteLength: number
    target: Targets
    name: string
    assetType?: 'view'
}

export interface glAccessor extends IGLTFExtention {
    bufferView: number
    byteOffset: number
    componentType: ComponentType
    count: number
    type: AccessorType
    max: number[]
    min: number[]
    name: string
    assetType?: 'accessor'
}

