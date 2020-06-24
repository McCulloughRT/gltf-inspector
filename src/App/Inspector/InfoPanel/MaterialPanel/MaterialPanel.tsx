import React from 'react'
import styles from './MaterialPanel.module.css'
import { glMaterial } from '../../../../types/gltf'
import { GLTFManager } from '../../../../utils/GLTFManager/GLTFManager'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { colorBrewer } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { AppState } from '../../../../stores/app.store'
import { inject, observer } from 'mobx-react'
import { Paper } from '@material-ui/core'

interface IMaterialPanelProps {
    appState?: AppState
}

const MaterialPanel: React.FC<IMaterialPanelProps> = inject('appState')(observer(({ appState }) => {

    const material = appState?.materialInspector.selectedItem
    const gltfManager = appState?.gltfManager

    const goToNodeReferences = () => {
        appState?.materialInspector.GoToNodeReferences(material)
    }

    const goToMeshReferences = () => {
        appState?.materialInspector.GoToMeshReferences(material)
    }

    const displayMaterial: {[key: string]: any} = {...material}
    delete displayMaterial['assetType']
    delete displayMaterial['selfIndex']
    delete displayMaterial['referenceCount']
    delete displayMaterial['referenceCountNodes']

    return (
        <div>
            <div className={ styles.panelTitle }>Material Info</div>
            <div className={ styles.materialInfoSection }>
                <div style={{ display: 'inline-block', marginRight: '20px' }}>
                    <div className={ styles.infoKey }>Mesh References:</div>
                    <div onClick={goToMeshReferences} style={
                        material?.referenceCountNodes && material.referenceCountNodes > 0 ? { color: 'blue', textDecoration: 'underline', cursor: 'pointer' } : {}
                    } className={ styles.infoValue }>{material?.referenceCount || 0}</div>
                </div>
                <div style={{ display: 'inline-block' }}>
                    <div className={ styles.infoKey }>Node References:</div>
                    <div onClick={goToNodeReferences} style={
                        material?.referenceCountNodes && material?.referenceCountNodes > 0 ? { color: 'blue', textDecoration: 'underline', cursor: 'pointer' } : {}
                    } className={ styles.infoValue }>{material?.referenceCountNodes || 0}</div>                    
                </div>
            </div>
            <Paper elevation={6} className={ styles.materialInfoSection }>
                <SyntaxHighlighter 
                    language='javascript' 
                    style={colorBrewer}
                    customStyle={{ fontSize: '0.9em' }}
                >
                    { JSON.stringify(displayMaterial, null, 3) }
                </SyntaxHighlighter>
            </Paper>
        </div>
    )
}))

export default MaterialPanel