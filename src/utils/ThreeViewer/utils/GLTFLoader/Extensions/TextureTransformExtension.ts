import { EXTENSIONS } from "../constants";

/**
 * Texture Transform Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
 */
export class GLTFTextureTransformExtension {
    public name: string = EXTENSIONS.KHR_TEXTURE_TRANSFORM

    public extendTexture = (texture: any, transform: any) => {
        texture = texture.clone()
        if ( transform.offset !== undefined ) {
			texture.offset.fromArray( transform.offset );
		}
		if ( transform.rotation !== undefined ) {
			texture.rotation = transform.rotation;
		}
		if ( transform.scale !== undefined ) {
			texture.repeat.fromArray( transform.scale );
		}
		if ( transform.texCoord !== undefined ) {
			console.warn( 'THREE.GLTFLoader: Custom UV sets in "' + this.name + '" extension not yet supported.' );
		}
		texture.needsUpdate = true;
		return texture;
    }
}