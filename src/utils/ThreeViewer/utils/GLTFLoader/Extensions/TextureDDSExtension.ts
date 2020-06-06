import { EXTENSIONS } from "../constants";

/**
 * DDS Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_texture_dds
 *
 */
export class GLTFTextureDDSExtension {
    public name: string = EXTENSIONS.MSFT_TEXTURE_DDS
    public ddsLoader: any

    constructor(ddsLoader: any) {
        if (!ddsLoader) {
			throw new Error( 'THREE.GLTFLoader: Attempting to load .dds texture without importing THREE.DDSLoader' );
		}
        this.ddsLoader = ddsLoader
    }
}