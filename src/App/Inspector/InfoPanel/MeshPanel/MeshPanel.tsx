import React from 'react'
import { glMesh } from '../../../../types/gltf'
import { GLTFManager } from '../../../../utils/GLTFManager/GLTFManager'
import ThreeViewer from '../../../../utils/ThreeViewer/ThreeViewer'
import { makeGltfURLFromMesh } from '../utils'
import Viewer from '../../../../utils/ThreeViewer/Viewer'
import styles from './MeshPanel.module.css'
import PrimitiveCard from './PrimitiveCard/PrimitiveCard'
import { AppState } from '../../../../stores/app.store'
import { inject, observer } from 'mobx-react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { colorBrewer } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Paper } from '@material-ui/core'

interface IMeshPanelProps {
    appState?: AppState
}

const MeshPanel: React.FC<IMeshPanelProps> = inject('appState')(observer(({ appState }) => {
    const [viewer, setViewer] = React.useState<ThreeViewer>(new ThreeViewer())

    const mesh = appState?.meshInspector.selectedItem
    const gltfManager = appState?.gltfManager

    if (mesh != null && gltfManager != null) {
        const gltfURL = makeGltfURLFromMesh(mesh, gltfManager) as string
        if (viewer.isInitialized) {
            viewer.glTFLoadLocal(gltfURL, gltfManager.rootPath || '', gltfManager.assetMap)
        } else {
            viewer.on('init', () => {
                viewer.glTFLoadLocal(gltfURL, gltfManager.rootPath || '', gltfManager.assetMap)
            })
        }
    }

    const goToReferences = () => {
        appState?.meshInspector.GoToNodeReferences(mesh)
    }

    const displayMesh: {[key:string]: any} = {...mesh}
    delete displayMesh['assetType']
    delete displayMesh['selfIndex']
    delete displayMesh['referenceCount']
    delete displayMesh['referenceCountNodes']
    delete displayMesh['size']
    delete displayMesh['hierarchy']

    return (
        <div>
            {/* <div className={ styles.panelTitle }>Mesh Info</div> */}
            <div className={ styles.meshInfoSection }>
                <div>
                    <div className={ styles.infoKey }>Name:</div>
                    <div className={ styles.infoValue }>{ `${mesh?.selfIndex}: ${mesh?.name || 'Unnamed Mesh'}` }</div>
                </div>
                <div>
                    <div className={ styles.infoKey }>Total Size:</div>
                    <div className={ styles.infoValue }>{ mesh?.size } bytes</div>
                </div>
                <div>
                    <div className={ styles.infoKey }>Node References:</div>
                    <div onClick={goToReferences} style={
                        mesh?.referenceCount && mesh.referenceCount > 0 ? { color: 'blue', textDecoration: 'underline', cursor: 'pointer' } : {}
                    } className={ styles.infoValue }>{mesh?.referenceCount}</div>
                </div>
            </div>
            <Viewer viewer={viewer} />
            <div>
                <div>Primitives</div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <div style={{ width: '50%'}}>
                        <Paper elevation={6}>
                            <SyntaxHighlighter 
                                language='javascript' 
                                style={colorBrewer}
                                customStyle={{ fontSize: '0.9em' }}
                            >
                                { JSON.stringify(displayMesh, null, 3) }
                            </SyntaxHighlighter>
                        </Paper>
                    </div>
                    <div style={{ width: '50%', padding: '10px' }}>
                        {
                            mesh?.primitives.map((p,i) => {
                                return (
                                    <PrimitiveCard key={i} idx={i} prim={p} />
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}))

export default MeshPanel