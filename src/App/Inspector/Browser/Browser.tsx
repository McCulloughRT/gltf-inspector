import React from 'react'
import styles from './Browser.module.css'
import { Tabs, Tab } from '@material-ui/core'
import { IGLTFPackage } from '../../../types'
import { glNode, glMesh, glPrimitive } from "../../../types/gltf";
import NodeTree from './NodeTree/NodeTree';
import MeshTree from './MeshTree/MeshTree';

enum Panels {
    nodes,
    meshes
}

interface IBrowserProps {
    gltfPackage: IGLTFPackage
    onNodeSelect: (node: glNode) => void
    onMeshSelect: (mesh: glMesh) => void
    meshScrollToIndex?: number
}

const Browser: React.FC<IBrowserProps> = (props) => {
    const [tab, setTab] = React.useState(0)

    React.useEffect(() => {
        if (props.meshScrollToIndex == null) return
        setTab(1)
    },[props.meshScrollToIndex])

    const getTab = (index: number) => {
        switch(index) {
            case 0: 
                return (
                    <NodeTree 
                        nodes={ props.gltfPackage.gltf.nodes } 
                        onNodeSelect={ props.onNodeSelect }
                    />
                )
            case 1: 
                return (
                    <MeshTree
                        meshes={ props.gltfPackage.gltf.meshes }
                        onMeshSelect={ props.onMeshSelect }
                        scrollToIndex={ props.meshScrollToIndex }
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
                <Tab className={ styles.tabButton } label='Accessors' />
                <Tab className={ styles.tabButton } label='Views' />
                <Tab className={ styles.tabButton } label='Buffers' />
                <Tab className={ styles.tabButton } label='Materials' />
            </Tabs>
            <div style={{ height: '100%'}}>
                { getTab(tab) }
            </div>
        </div>
    )
}

export default Browser