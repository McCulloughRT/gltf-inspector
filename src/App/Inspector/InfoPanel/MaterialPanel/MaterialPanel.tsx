import React from 'react'
import styles from './MaterialPanel.module.css'
import { glMaterial } from '../../../../types/gltf'
import { GLTFManager } from '../../../../utils/GLTFManager/GLTFManager'

interface IMaterialPanelProps {
    material: glMaterial
    gltfManager: GLTFManager
}

const MaterialPanel: React.FC<IMaterialPanelProps> = ({ material, gltfManager }) => {
    // const refs = gltfManager.GetNodesForMaterial(material.selfIndex)

    return (
        <div>
            <div className={ styles.panelTitle }>Material Info</div>
            <div className={ styles.materialInfoSection }>
                <div>
                    <div className={ styles.infoKey }>References:</div>
                    <div className={ styles.infoValue }>{material.referenceCount || 0}</div>
                </div>
            </div>
        </div>
    )
}

export default MaterialPanel