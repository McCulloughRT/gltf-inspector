import React from 'react'
import styles from './Browser.module.css'
import { Tabs, Tab } from '@material-ui/core'
import { IGLTFPackage } from '../../../types'
import { glNode, glMesh, glPrimitive, glMaterial } from "../../../types/gltf";
import NodeTree from './NodeTree/NodeTree';
import MeshTree from './MeshTree/MeshTree';
import { GLTFManager } from '../../../utils/GLTFManager/GLTFManager';
import MaterialTree from './MaterialTree/MaterialTree';

enum Panels {
    nodes,
    meshes,
    materials
}

interface IBrowserProps {
    gltfManager: GLTFManager
    nodeTreeIndexFilter?: number[]
    meshTreeIndexFilter?: number[]
    onNodeSelect: (node: glNode) => void
    onMeshSelect: (mesh: glMesh) => void
    onMaterialSelect: (material: glMaterial) => void
    meshScrollToIndex?: number
}

const Browser: React.FC<IBrowserProps> = (props) => {
    const [tab, setTab] = React.useState(0)

    React.useEffect(() => {
        if (props.meshScrollToIndex == null) return
        setTab(1)
    },[props.meshScrollToIndex])

    React.useEffect(() => {
        if (props.nodeTreeIndexFilter == null) return
        setTab(0)
    }, [props.nodeTreeIndexFilter])

    const getTab = (index: number) => {
        switch(index) {
            case 0: 
                return (
                    <NodeTree 
                        nodes={ props.gltfManager.gltf!.nodes }
                        customIndexFilter={ props.nodeTreeIndexFilter }
                        onNodeSelect={ props.onNodeSelect }
                    />
                )
            case 1: 
                return (
                    <MeshTree
                        meshes={ props.gltfManager.gltf!.meshes }
                        onMeshSelect={ props.onMeshSelect }
                        scrollToIndex={ props.meshScrollToIndex }
                    />
                )
            case 2:
                return (
                    <MaterialTree 
                        materials={ props.gltfManager.gltf!.materials }
                        onMaterialSelect={ props.onMaterialSelect }
                    />
                )
            default: return <div />
        }
    }

    return (
        <div style={{ height: '100%' }}>
            <Tabs 
                variant='scrollable' 
                scrollButtons='auto' 
                value={tab} 
                onChange={(e,i) => setTab(i)}
                className={ styles.tabRoot }
            >
                <Tab className={ styles.tabButton } label='Nodes' />
                <Tab className={ styles.tabButton } label='Meshes' />
                <Tab className={ styles.tabButton } label='Materials' />
            </Tabs>
            <div style={{ height: '100%'}}>
                { getTab(tab) }
            </div>
        </div>
    )
}

export default Browser