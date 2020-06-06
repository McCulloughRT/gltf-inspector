import { EXTENSIONS } from "../constants"
import * as THREE from "three"

/**
 * Unlit Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 */
export class GLTFMaterialsUnlitExtension {
    public name: string = EXTENSIONS.KHR_MATERIALS_UNLIT

    public getMaterialType = () => THREE.MeshStandardMaterial

    public extendParams = async (materialParams: any, materialDef: any, parser: any) => {
        const pending = []

        materialParams.color = new THREE.Color(1.0,1.0,1.0)
        materialParams.opacity = 1.0

        const metallicRoughness = materialDef.pbrMetallicRoughness

        if (metallicRoughness) {
            if (Array.isArray(metallicRoughness.baseColorFactor)) {
                const array = metallicRoughness.baseColorFactor
                materialParams.color.fromArray(array)
                materialParams.opacity = array[3]
            }
            if (metallicRoughness.baseColorTexture !== undefined) {
                pending.push(parser.assignTexture(materialParams, 'map', metallicRoughness.baseColorTexture))
            }
        }

        return Promise.all(pending)
    }
}