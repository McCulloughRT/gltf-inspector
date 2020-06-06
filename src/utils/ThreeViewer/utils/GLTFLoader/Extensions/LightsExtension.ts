import { EXTENSIONS } from "../constants";
import * as THREE from "three"

/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 */
export class GLTFLightsExtension {
    public name: string = EXTENSIONS.KHR_LIGHTS_PUNCTUAL
    public lightDefs: any[]

    constructor(json: any) {
        var extension = (json.extensions && json.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL]) || {}
		this.lightDefs = extension.lights || [];
    }

    public loadLight = async (lightIndex: any) => {
        const lightDef = this.lightDefs[lightIndex]
        let lightNode

        const color = new THREE.Color(0xffffff)
        if (lightDef.color !== undefined) color.fromArray(lightDef.color)

        const range = lightDef.range !== undefined ? lightDef.range : 0

        switch(lightDef.type) {
            case 'directional':
				lightNode = new THREE.DirectionalLight( color );
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			case 'point':
				lightNode = new THREE.PointLight( color );
				lightNode.distance = range;
				break;

			case 'spot':
				lightNode = new THREE.SpotLight( color );
				lightNode.distance = range;
				// Handle spotlight properties.
				lightDef.spot = lightDef.spot || {};
				lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
				lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
				lightNode.angle = lightDef.spot.outerConeAngle;
				lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			default:
				throw new Error( 'THREE.GLTFLoader: Unexpected light type, "' + lightDef.type + '".' );
        }

        // Some lights (e.g. spot) default to a position other than the origin. Reset he position
        // here, because node-level parsing will only  override position if explicitly specified.
        lightNode.position.set(0,0,0);
        (lightNode as any).decay = 2

        if (lightDef.intensity !== undefined) lightNode.intensity = lightDef.intensity
        lightNode.name = lightDef.name || ('light_' + lightIndex)
        return Promise.resolve(lightNode)
    }
}