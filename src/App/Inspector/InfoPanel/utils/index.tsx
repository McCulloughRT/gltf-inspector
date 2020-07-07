import React from 'react'
import { glNode, glTF, glMesh, glAccessor, glBufferView, glMaterial, glPrimitive, AccessorType } from "../../../../types/gltf";
import { GLTFManager } from "../../../../utils/GLTFManager/GLTFManager";

export function makeGltfURLFromNode_Lazy(originalNode: glNode, mgr: GLTFManager): string {
    if (mgr.gltf == null) throw new Error('GLTF file has not been parsed!')

    // const nodeIndexes = collectNodesRecursive(originalNode, mgr.gltf.nodes)
    // const nodes: glNode[] = []
    // nodes[originalNode.selfIndex!] = originalNode
    // for (let i = 0; i < nodeIndexes.length; i++) {
    //     const idx = nodeIndexes[i];
    //     nodes[idx] = mgr.gltf.nodes[idx]
    // }
    
    const gltf: glTF = {
        asset: { version: [2] },
        scenes: [{ nodes: [originalNode.selfIndex!] }],
        nodes: mgr.gltf.nodes,
        meshes: mgr.gltf.meshes,
        buffers: mgr.gltf.buffers,
        bufferViews: mgr.gltf.bufferViews,
        accessors: mgr.gltf.accessors,
        materials: mgr.gltf.materials
    }
    console.log('Derived GLTF', gltf)

    const blob = new Blob([JSON.stringify(gltf)], {type : 'application/json'});
    const gltfURL = URL.createObjectURL(blob)
    return gltfURL
}

// function collectNodesRecursive(node: glNode, all_nodes: glNode[]) {
//     if (node.children == null || node.children.length === 0) return []

//     const indices: number[] = []

//     for (let i = 0; i < node.children.length; i++) {
//         const childIdx = node.children[i];
//         indices.push(childIdx)

//         const childNode = all_nodes[childIdx]
//         const childIndexTree =  collectNodesRecursive(childNode, all_nodes)
//         indices.push(...childIndexTree)
//     }

//     return indices
// }

// TODO: both of these can be moved to the gltf manager class
export function makeGltfURLFromNode(originalNode: glNode, mgr: GLTFManager): string {
    if (mgr.gltf == null) throw new Error('GLTF file has not been parsed!')
    const gltf = makeGltfURLFromMesh(mgr.gltf.meshes[originalNode.mesh!], mgr, true) as glTF
    gltf.nodes[0] = { ...originalNode, mesh: 0 }

    const blob = new Blob([JSON.stringify(gltf)], {type : 'application/json'});
    const gltfURL = URL.createObjectURL(blob)
    return gltfURL
}

export function makeGltfURLFromMesh(originalMesh: glMesh, mgr: GLTFManager, returnObject: boolean = false): string | glTF {
    if (mgr.gltf == null) throw new Error('GLTF file has not been parsed!')
    const mesh = JSON.parse(JSON.stringify(originalMesh))
    const accIdxMap = new Map<number,number>()
    const viewIdxMap = new Map<number,number>()
    const materialIdxMap = new Map<number,number>()

    let accessors: glAccessor[] = []
    let views: glBufferView[] = []
    let materials: glMaterial[] = []

    mesh.primitives.forEach((p: glPrimitive) => {
        Object.keys(p.attributes).forEach(key => {
            const accIdx = p.attributes[key]
            let acc, newIdx
            if (!accIdxMap.has(accIdx)) {
                acc = {...mgr.gltf!.accessors[accIdx]}
                accessors.push(acc)
                newIdx = accessors.length - 1
                accIdxMap.set(accIdx, newIdx)
            } else {
                newIdx = accIdxMap.get(accIdx)!
                acc = accessors[newIdx]
            }
            p.attributes[key] = newIdx
            

            const viewIdx = acc.bufferView
            let view, newViewIdx
            if (!viewIdxMap.has(viewIdx)) {
                view = {...mgr.gltf!.bufferViews[viewIdx]}
                views.push(view)
                newViewIdx = views.length - 1
                viewIdxMap.set(viewIdx, newViewIdx)
            } else {
                newViewIdx = viewIdxMap.get(viewIdx)!
                view = views[newViewIdx]
            }
            acc.bufferView = newViewIdx
        })

        const accIndIndex = p.indices
        let acc, newIdx
        if (!accIdxMap.has(accIndIndex)) {
            acc = {...mgr.gltf!.accessors[accIndIndex]}
            accessors.push(acc)
            newIdx = accessors.length - 1
            accIdxMap.set(accIndIndex, newIdx)
        } else {
            newIdx = accIdxMap.get(accIndIndex)!
            acc = accessors[newIdx]
        }
        p.indices = newIdx

        const viewIdx = acc.bufferView
        let view, newViewIdx
        if (!viewIdxMap.has(viewIdx)) {
            view = {...mgr.gltf!.bufferViews[viewIdx]}
            views.push(view)
            newViewIdx = views.length - 1
            viewIdxMap.set(viewIdx, newViewIdx)
        } else {
            newViewIdx = viewIdxMap.get(viewIdx)!
            view = views[newViewIdx]
        }
        acc.bufferView = newViewIdx

        if (p.material != null) {
            const matIdx = p.material
            let mat, newMatIdx
            if (!materialIdxMap.has(matIdx)) {
                mat = {...mgr.gltf!.materials[p.material]}
                materials.push(mat)
                newMatIdx = materials.length - 1
                materialIdxMap.set(matIdx, newMatIdx)
            } else {
                newMatIdx = materialIdxMap.get(matIdx)!
                mat = materials[newMatIdx]
            }
            p.material = newMatIdx
        }
    })

    const gltf: glTF = {
        asset: { version: [2] },
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [mesh],
        buffers: mgr.gltf.buffers,
        bufferViews: views,
        accessors: accessors,
        materials: materials
    }

    if (returnObject) {
        return gltf
    }

    const blob = new Blob([JSON.stringify(gltf)], {type : 'application/json'});
    const gltfURL = URL.createObjectURL(blob)
    return gltfURL
}

export function rndZero(num: number) {
    if (num < 1e-14 && num > 0) return 0
    if (num > -1e-14 && num < 0) return 0
    return num
}