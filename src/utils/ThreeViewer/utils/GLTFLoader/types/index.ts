import { AnimationClip, Scene, Camera } from "three";
import GLTFParser from '../GLTFParser'

export interface GLTFThree {
	animations: AnimationClip[];
	scene: Scene;
	scenes: Scene[];
	cameras: Camera[];
	asset: {
		copyright?: string;
		generator?: string;
		version?: string;
		minVersion?: string;
		extensions?: any;
		extras?: any;
	};
	parser: GLTFParser;
	userData: any;
}

export interface IGLTF {
    asset: IGLTFAsset
    scenes: IGLTFScene[]
    scene: number
    nodes: IGLTFNode[]
    buffers: IGLTFBuffer[]
    bufferViews: IGLTFBufferView[]
    accessors: IGLTFAccessor[]
    meshes: IGLTFMesh[]
    
}

export interface IGLTFAsset {
    verstion?: string
    generator?: string
    copyright?: string
}

export interface IGLTFScene {
    name: string
    nodes: number[]
}

export interface IGLTFNode {
    name: string
    camera?: number
    rotation?: number[]
    scale?: number[]
    translation?: number[]
    matrix?: number[]
    children?: number[]
    mesh?: number
}

export interface IGLTFBuffer {
    byteLength: number
    uri?: string // undefined uri signifieds a GLB file
}

export interface IGLTFBufferView {
    buffer: number
    byteLength: number
    byteOffset: number
    target: number
    byteStride?: number
}

export interface IGLTFAccessor {
    bufferView: number
    byteOffset: number
    componentType: number
    count: number
    max: number[]
    min: number[]
    type: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4'
}

export interface IGLTFSparseAccessor {
    bufferView?: number
    byteOffset: number
    componentType: number
    count: number
    max: number[]
    min: number[]
    type: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4'
    sparse: {
        count: number
        indices: {
            bufferView: number
            byteOffset: number
            componentType: number
        }
        values: {
            bufferView: number
            byteOffset: number
        }
    }
}

export interface IGLTFMesh {
    primitives: IGLTFPrimitive[]
    name?: string
    weights?: number[]
    extensions?: {[key:string]:any}
    extras?: any
}

export interface IGLTFPrimitive {
    attributes: {
        POSITION?: number
        NORMAL?: number
        TANGENT?: number 
        TEXCOORD_0?: number
        TEXCOORD_1?: number
        COLOR_0?: number
        [key: string]: any
    }
    indices?: number
    material?: number
    mode?: number
    targets?: {
        NORMAL?: number
        POSITION?: number
        TANGENT?: number
    }[]
    extensions?: {[key:string]:any}
    extras?: any
}