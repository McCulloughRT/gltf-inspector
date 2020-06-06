/* UTILITY FUNCTIONS */

import * as THREE from "three"
import { EXTENSIONS } from "./constants";

export function resolveURL(url: string, path: string) {
    // Invalid URL
    if ( typeof url !== 'string' || url === '' ) return '';

    // Host Relative URL
    if ( /^https?:\/\//i.test( path ) && /^\//.test( url ) ) {
        path = path.replace( /(^https?:\/\/[^\/]+).*/i, '$1' );
    }

    // Absolute URL http://,https://,//
    if ( /^(https?:)?\/\//i.test( url ) ) return url;
    // Data URI
    if ( /^data:.*,.*$/i.test( url ) ) return url;
    // Blob URL
    if ( /^blob:.*$/i.test( url ) ) return url;
    // Relative URL
    return path + url;
}

// var defaultMaterial;

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
 */
export function createDefaultMaterial() {
    const defaultMaterial = new THREE.MeshStandardMaterial( {
        color: 0xFFFFFF,
        emissive: 0x000000,
        metalness: 1,
        roughness: 1,
        transparent: false,
        depthTest: true,
        side: THREE.FrontSide
    } );

    return defaultMaterial;
}

export function addUnknownExtensionsToUserData(knownExtensions: any, object: any, objectDef: any) {
    // Add unknown glTF extensions to an object's userData.
    for ( var name in objectDef.extensions ) {
        if ( knownExtensions[ name ] === undefined ) {
            object.userData.gltfExtensions = object.userData.gltfExtensions || {};
            object.userData.gltfExtensions[ name ] = objectDef.extensions[ name ];
        }
    }
}

/**
 * @param {THREE.Object3D|THREE.Material|THREE.BufferGeometry} object
 * @param {GLTF.definition} gltfDef
 */
export function assignExtrasToUserData(object: any, gltfDef: any) {
    if ( gltfDef.extras !== undefined ) {
        if ( typeof gltfDef.extras === 'object' ) {
            Object.assign( object.userData, gltfDef.extras );
        } else {
            console.warn( 'THREE.GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras );
        }
    }
}

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
 *
 * @param {THREE.BufferGeometry} geometry
 * @param {Array<GLTF.Target>} targets
 * @param {GLTFParser} parser
 * @return {Promise<THREE.BufferGeometry>}
 */
export async function addMorphTargets(geometry: THREE.BufferGeometry, targets: any[], parser: any): Promise<THREE.BufferGeometry> {
    let hasMorphPosition = false;
    let hasMorphNormal = false;

    for ( let i = 0, il = targets.length; i < il; i ++ ) {
        const target = targets[ i ];

        if ( target.POSITION !== undefined ) hasMorphPosition = true;
        if ( target.NORMAL !== undefined ) hasMorphNormal = true;
        if ( hasMorphPosition && hasMorphNormal ) break;
    }

    if ( ! hasMorphPosition && ! hasMorphNormal ) return Promise.resolve( geometry );

    const pendingPositionAccessors = [];
    const pendingNormalAccessors = [];

    for ( let i = 0, il = targets.length; i < il; i ++ ) {
        const target = targets[ i ];

        if ( hasMorphPosition ) {
            const pendingAccessorPos = target.POSITION !== undefined
                ? parser.getDependency( 'accessor', target.POSITION )
                : geometry.attributes.position;

            pendingPositionAccessors.push( pendingAccessorPos );
        }

        if ( hasMorphNormal ) {
            const pendingAccessorNorm = target.NORMAL !== undefined
                ? parser.getDependency( 'accessor', target.NORMAL )
                : geometry.attributes.normal;

            pendingNormalAccessors.push( pendingAccessorNorm );
        }
    }

    return Promise.all( [
        Promise.all( pendingPositionAccessors ),
        Promise.all( pendingNormalAccessors )
    ] ).then( function ( accessors ) {
        const morphPositions = accessors[ 0 ];
        const morphNormals = accessors[ 1 ];

        if ( hasMorphPosition ) geometry.morphAttributes.position = morphPositions;
        if ( hasMorphNormal ) geometry.morphAttributes.normal = morphNormals;
        geometry.morphTargetsRelative = true;

        return geometry;
    } );
}

/**
 * @param {THREE.Mesh} mesh
 * @param {GLTF.Mesh} meshDef
 */
export function updateMorphTargets(mesh: THREE.Mesh, meshDef: any) {
    mesh.updateMorphTargets();

    if ( meshDef.weights !== undefined ) {
        for ( let i = 0, il = meshDef.weights.length; i < il; i ++ ) {
            mesh.morphTargetInfluences![ i ] = meshDef.weights[ i ];
        }
    }

    // .extras has user-defined data, so check that .extras.targetNames is an array.
    if ( meshDef.extras && Array.isArray( meshDef.extras.targetNames ) ) {
        const targetNames = meshDef.extras.targetNames;
        if ( mesh.morphTargetInfluences!.length === targetNames.length ) {
            mesh.morphTargetDictionary = {};
            for ( let i = 0, il = targetNames.length; i < il; i ++ ) {
                mesh.morphTargetDictionary[ targetNames[ i ] ] = i;
            }
        } else {
            console.warn( 'THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.' );
        }
    }
}

export function createPrimitiveKey(primitiveDef: any) {
    const dracoExtension = primitiveDef.extensions && primitiveDef.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ];
    let geometryKey;

    if ( dracoExtension ) {
        geometryKey = 'draco:' + dracoExtension.bufferView
            + ':' + dracoExtension.indices
            + ':' + createAttributesKey( dracoExtension.attributes );
    } else {
        geometryKey = primitiveDef.indices + ':' + createAttributesKey( primitiveDef.attributes ) + ':' + primitiveDef.mode;
    }

    return geometryKey;
}

export function createAttributesKey(attributes: any) {
    let attributesKey = '';
    const keys = Object.keys( attributes ).sort();

    for ( var i = 0, il = keys.length; i < il; i ++ ) {
        attributesKey += keys[ i ] + ':' + attributes[ keys[ i ] ] + ';';
    }

    return attributesKey;
}