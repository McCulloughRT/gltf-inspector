import React from 'react'
import styles from './MaterialPanel.module.css'
import { glMaterial } from '../../../../types/gltf'
import { GLTFManager } from '../../../../utils/GLTFManager/GLTFManager'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { colorBrewer } from "react-syntax-highlighter/dist/esm/styles/hljs";

interface IMaterialPanelProps {
    material: glMaterial
    gltfManager: GLTFManager
    setIndexFilterNode: (indices: number[]) => void
    setIndexFilterMesh: (indices: number[]) => void
}

const MaterialPanel: React.FC<IMaterialPanelProps> = ({ material, gltfManager, setIndexFilterNode, setIndexFilterMesh }) => {
    // const refs = gltfManager.GetNodesForMaterial(material.selfIndex)

    const goToNodeReferences = () => {
        if (material.selfIndex == null) throw new Error('Material was not appropriately initialized with a selfIndex reference.')
        const refs = gltfManager.GetNodesForMaterial(material.selfIndex)
        const indices: number[] | undefined = refs?.map(r => r.selfIndex).filter(r => r != null) as number[]
        if (indices != null) setIndexFilterNode(indices)
    }

    const goToMeshReferences = () => {
        const refs = gltfManager.GetMeshesForMaterial(material.selfIndex)
        const indices: number[] | undefined = refs?.map(r => r.selfIndex).filter(r => r != null) as number[]
        if (indices != null) setIndexFilterMesh(indices)
    }

    const displayMaterial = {...material}
    delete displayMaterial.assetType
    delete displayMaterial.selfIndex
    delete displayMaterial.referenceCount
    delete displayMaterial.referenceCountNodes

    return (
        <div>
            <div className={ styles.panelTitle }>Material Info</div>
            <div className={ styles.materialInfoSection }>
                <div style={{ display: 'inline-block', marginRight: '20px' }}>
                    <div className={ styles.infoKey }>Mesh References:</div>
                    <div onClick={goToMeshReferences} style={
                        material.referenceCountNodes && material.referenceCountNodes > 0 ? { color: 'blue', textDecoration: 'underline', cursor: 'pointer' } : {}
                    } className={ styles.infoValue }>{material.referenceCount || 0}</div>
                </div>
                <div style={{ display: 'inline-block' }}>
                    <div className={ styles.infoKey }>Node References:</div>
                    <div onClick={goToNodeReferences} style={
                        material.referenceCountNodes && material.referenceCountNodes > 0 ? { color: 'blue', textDecoration: 'underline', cursor: 'pointer' } : {}
                    } className={ styles.infoValue }>{material.referenceCountNodes || 0}</div>                    
                </div>
            </div>
            <div className={ styles.materialInfoSection }>
                <SyntaxHighlighter 
                    language='javascript' 
                    style={colorBrewer}
                    customStyle={{ fontSize: '0.9em' }}
                >
                    { JSON.stringify(displayMaterial, null, 3) }
                </SyntaxHighlighter>
            </div>
        </div>
    )
}

export default MaterialPanel