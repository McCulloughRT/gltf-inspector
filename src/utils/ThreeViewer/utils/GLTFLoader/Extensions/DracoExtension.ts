import { EXTENSIONS, ATTRIBUTES, WEBGL_COMPONENT_TYPES } from "../constants"

/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
export class GLTFDracoMeshCompressionExtension {
    public name: string = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION
    public json: any
    public dracoLoader: any

    constructor(json: any, dracoLoader: any) {
        this.json = json
        this.dracoLoader = dracoLoader
    }

    public decodePrimitive = (primitive: any, parser: any) => {
        const json = this.json
        const dracoLoader = this.dracoLoader
        const  bufferViewIndex = primitive.extensions[ this.name ].bufferView;
		const  gltfAttributeMap = primitive.extensions[ this.name ].attributes;
		const  threeAttributeMap: {[key:string]:any} = {};
		const  attributeNormalizedMap: {[key:string]:boolean} = {};
        const  attributeTypeMap: {[key:string]:any} = {};
        
        for (const attributeName in gltfAttributeMap) {
            const threeAttributeName = ATTRIBUTES[attributeName] || attributeName.toLowerCase()
            threeAttributeMap[threeAttributeName] = gltfAttributeMap[attributeName]
        }

        for (const attributeName in primitive.attributes) {
            const threeAttributeName = ATTRIBUTES[attributeName] || attributeName.toLowerCase()
            if (gltfAttributeMap[attributeName] !== undefined) {
                const accessorDef = json.accessors[primitive.attributes[attributeName]]
                const componentType = WEBGL_COMPONENT_TYPES[accessorDef.componentType]

                attributeTypeMap[threeAttributeName] = componentType
                attributeNormalizedMap[threeAttributeName] = accessorDef.normalized === true
            }
        }

        return parser.getDependency('bufferView', bufferViewIndex).then((bufferView: any) => {
            return new Promise((resolve,reject) => {
                dracoLoader.decodeDracoFile(bufferView, (geometry: any) => {
                    for (const attributeName in geometry.attributes) {
                        const attribute = geometry.attributes[attributeName]
                        const normalized = attributeNormalizedMap[attributeName]

                        if (normalized !== undefined) attribute.normalized = normalized
                    }
                    resolve(geometry)
                }, threeAttributeMap, attributeTypeMap)
            })
        })
    }
}