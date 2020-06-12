import React from 'react'
import styles from './InfoPanel.module.css'

import { glMesh, glPrimitive, glNode, glMaterial } from '../../../types/gltf'
import { GLTFManager } from '../../../utils/GLTFManager/GLTFManager';
import NodePanel from './NodePanel/NodePanel';
import MeshPanel from './MeshPanel/MeshPanel';
import MaterialPanel from './MaterialPanel/MaterialPanel';

interface IInfoPanelProps {
    item?: glNode | glMesh | glPrimitive | glMaterial
    gltfManager: GLTFManager
    onMeshScrollTo: (index: number) => void
    setNodeTreeIndexFilter: (indices: number[]) => void
    setMeshTreeIndexFilter: (indices: number[]) => void
}

const InfoPanel: React.FC<IInfoPanelProps> = (props) => {
    const panel = getPanel(
        props.gltfManager, 
        props.onMeshScrollTo,
        props.setNodeTreeIndexFilter,
        props.setMeshTreeIndexFilter,
        props.item
    )

    return (
        <div className={ styles.container }>
            { panel }
        </div>
    )
}

function getPanel(
    gltfManager: GLTFManager, 
    onMeshScrollTo: (item: number) => void,
    setNodeTreeIndexFilter: (indices: number[]) => void,
    setMeshTreeIndexFilter: (indices: number[]) => void,
    item?: glNode | glMesh | glPrimitive | glMaterial
) {
    if (item == null) return <div />
    switch(item.assetType) {
        case 'node': return <NodePanel setIndexFilter={setMeshTreeIndexFilter} onMeshScrollTo={ onMeshScrollTo } node={item} gltfManager={gltfManager} />
        case 'mesh': return <MeshPanel setIndexFilter={setNodeTreeIndexFilter} onMeshScrollTo={ onMeshScrollTo } mesh={item} gltfManager={gltfManager} />
        case 'material': return <MaterialPanel material={item} gltfManager={gltfManager} />
        default: return <div />
    }
}

export default InfoPanel