import React from 'react'
import styles from './App.module.css'

import {
    BrowserRouter as Router,
    Switch,
    Route
} from 'react-router-dom'
import Dropper from './Dropper/Dropper'
import { IGLTFPackage, IFilePackage } from '../types'
import Inspector from './Inspector/Inspector'
import { glTF, glNode, glMesh, glPrimitive, glBuffer } from '../types/gltf'

interface IAppProps {

}

interface IAppState {
    gltfPackage?: IGLTFPackage
}

export default class App extends React.Component<IAppProps,IAppState> {
    public state: IAppState = {
        gltfPackage: undefined
    }
    public render() {
        return (
            <Router>
                <Switch>
                    <Route path='/model'>
                        <Inspector gltfPackage={this.state.gltfPackage} />
                    </Route>
                    <Route path='/'>
                        <Dropper onFileLoad={ this.onFileLoad } />
                    </Route>
                </Switch>
            </Router>
        )
    }

    private onFileLoad = async (filePackage: IFilePackage) => {
        console.log(filePackage)
        const text = await filePackage.rootFile.text()
        let model = JSON.parse(text) as glTF
        model = process(model)
        this.setState({ gltfPackage: { ...filePackage, gltf: model } })
    }
}

const orderNodes = (nodes: glNode[]) => {
    let count = 0
    const markNodes = (node: glNode, hierarchy: number): void => {
        node.hierarchy = hierarchy
        node.order = count
        count++

        if (node.children == null || node.children.length === 0) {
            return
        }

        hierarchy++
        for (let i = 0; i < node.children.length; i++) {
            const childIdx = node.children[i];
            nodes[childIdx].hierarchy = hierarchy
            markNodes(nodes[childIdx], hierarchy)
        }
    }
    
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.order != null) continue
        markNodes(node, 0)
    }

    return nodes.sort((a,b) => {
        if (a.order! > b.order!) return 1
        else if (a.order! < b.order!) return -1
        return 0
    })
}

function process(gltf: glTF) {
    const buffers = gltf.buffers
    for (let i = 0; i < buffers.length; i++) {
        const buffer = buffers[i];
        buffer.size = buffer.byteLength
        buffer.assetType = 'buffer'
        buffer.selfIndex = i
        buffer.referenceCount = 0
    }

    const views = gltf.bufferViews
    for (let i = 0; i < views.length; i++) {
        const view = views[i];
        view.size = view.byteLength
        view.assetType = 'view'
        view.selfIndex = i
        view.referenceCount = 0

        buffers[view.buffer].referenceCount! ++
    }

    const accessors = gltf.accessors
    for (let i = 0; i < accessors.length; i++) {
        const accessor = accessors[i];
        accessor.size = (views[accessor.bufferView].size || 0) - accessor.byteOffset
        accessor.assetType = 'accessor'
        accessor.selfIndex = i
        accessor.referenceCount = 0

        views[accessor.bufferView].referenceCount! ++
    }

    const materials = gltf.materials
    for (let i = 0; i < materials.length; i++) {
        const material = materials[i];
        material.assetType = 'material'
        material.selfIndex = i
        material.referenceCount = 0
    }

    const meshes = gltf.meshes
    for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        let meshSize = 0
        mesh.primitives.forEach(p => {
            let primitiveSize = 0

            const attributes = Object.keys(p.attributes)
            attributes.forEach(a => {
                const accessor = accessors[p.attributes[a]]
                accessor.referenceCount! ++

                if (accessor.size != null) primitiveSize += accessor.size
            })
    
            const indices = accessors[p.indices]
            indices.referenceCount! ++
            if (indices.size != null) primitiveSize += indices.size

            p.size = primitiveSize
            p.assetType = 'primitive'
            p.hierarchy = 1
            meshSize += primitiveSize

            if (p.material) materials[p.material].referenceCount! ++
        })

        mesh.assetType = 'mesh'
        mesh.size = meshSize
        mesh.selfIndex = i
        mesh.hierarchy = 0
        mesh.referenceCount = 0
    }

    const nodes = gltf.nodes
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.assetType = 'node'
        node.size = 0
        node.selfIndex = i
        
        if (node.mesh) {
            node.size = meshes[node.mesh].size
            meshes[node.mesh].referenceCount! ++
        }
    }
    orderNodes(gltf.nodes)
    return gltf
}