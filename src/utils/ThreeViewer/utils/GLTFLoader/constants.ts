import * as THREE from 'three'

/* BINARY EXTENSION */
export const BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
export const BINARY_EXTENSION_HEADER_LENGTH = 12;
export const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

/*********************************/
/********** EXTENSIONS ***********/
/*********************************/
export const EXTENSIONS = {
    KHR_BINARY_GLTF: 'KHR_binary_glTF',
    KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
    KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
    KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: 'KHR_materials_pbrSpecularGlossiness',
    KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
    KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
    KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
    MSFT_TEXTURE_DDS: 'MSFT_texture_dds'
};

export const WEBGL_CONSTANTS: {[key:string]:any} = {
    FLOAT: 5126,
    //FLOAT_MAT2: 35674,
    FLOAT_MAT3: 35675,
    FLOAT_MAT4: 35676,
    FLOAT_VEC2: 35664,
    FLOAT_VEC3: 35665,
    FLOAT_VEC4: 35666,
    LINEAR: 9729,
    REPEAT: 10497,
    SAMPLER_2D: 35678,
    POINTS: 0,
    LINES: 1,
    LINE_LOOP: 2,
    LINE_STRIP: 3,
    TRIANGLES: 4,
    TRIANGLE_STRIP: 5,
    TRIANGLE_FAN: 6,
    UNSIGNED_BYTE: 5121,
    UNSIGNED_SHORT: 5123
};

export const WEBGL_COMPONENT_TYPES: {[key:number]:any} = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
};

export const WEBGL_FILTERS: {[key:number]:any} = {
    9728: THREE.NearestFilter,
    9729: THREE.LinearFilter,
    9984: THREE.NearestMipmapNearestFilter,
    9985: THREE.LinearMipmapNearestFilter,
    9986: THREE.NearestMipmapLinearFilter,
    9987: THREE.LinearMipmapLinearFilter
};

export const WEBGL_WRAPPINGS: {[key:number]:any} = {
    33071: THREE.ClampToEdgeWrapping,
    33648: THREE.MirroredRepeatWrapping,
    10497: THREE.RepeatWrapping
};

export const WEBGL_TYPE_SIZES: {[key:string]:any} = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
};

export const ATTRIBUTES: {[key: string]: string} = {
    "POSITION": 'position',
    "NORMAL": 'normal',
    "TANGENT": 'tangent',
    "TEXCOORD_0": 'uv',
    "TEXCOORD_1": 'uv2',
    "COLOR_0": 'color',
    "WEIGHTS_0": 'skinWeight',
    "JOINTS_0": 'skinIndex',
};

export const PATH_PROPERTIES: {[key:string]:any} = {
    scale: 'scale',
    translation: 'position',
    rotation: 'quaternion',
    weights: 'morphTargetInfluences'
};

export const INTERPOLATION: {[key:string]:any} = {
    CUBICSPLINE: undefined, // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
                            // keyframe track will be initialized with a default interpolation type, then modified.
    LINEAR: THREE.InterpolateLinear,
    STEP: THREE.InterpolateDiscrete
};

export const ALPHA_MODES: {[key:string]:any} = {
    OPAQUE: 'OPAQUE',
    MASK: 'MASK',
    BLEND: 'BLEND'
};

export const MIME_TYPE_FORMATS: {[key:string]:any} = {
    'image/png': THREE.RGBAFormat,
    'image/jpeg': THREE.RGBFormat
};