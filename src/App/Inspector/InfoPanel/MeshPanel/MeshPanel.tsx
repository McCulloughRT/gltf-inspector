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

interface IMeshPanelProps {
    appState?: AppState
    
    // mesh: glMesh
    // gltfManager: GLTFManager
    // onMeshScrollTo: (item: number) => void
    // setIndexFilter: (indices: number[]) => void
}

const MeshPanel: React.FC<IMeshPanelProps> = inject('appState')(observer(({ appState }) => {
    const [viewer, setViewer] = React.useState<ThreeViewer>(new ThreeViewer())

    const mesh = appState?.meshInspector.selectedMesh
    const gltfManager = appState?.gltfManager

    React.useEffect(() => {
        if (mesh == null || gltfManager == null) return
        const gltfURL = makeGltfURLFromMesh(mesh, gltfManager) as string
        if (viewer.isInitialized) {
            viewer.glTFLoadLocal(gltfURL, gltfManager.rootPath || '', gltfManager.assetMap)
        } else {
            viewer.on('init', () => {
                viewer.glTFLoadLocal(gltfURL, gltfManager.rootPath || '', gltfManager.assetMap)
            })
        }
    }, [mesh])

    const goToReferences = () => {
        appState?.meshInspector.GoToNodeReferences(mesh)
        // if (mesh?.selfIndex == null) throw new Error('Mesh was not appropriately initialized with a selfIndex reference.')
        // const refs = gltfManager?.GetNodesFromMesh(mesh.selfIndex)
        // const indices: number[] | undefined = refs?.map(r => r.selfIndex).filter(r => r != null) as number[]
        // if (indices != null) setIndexFilter(indices)
    }

    return (
        <div>
            <div className={ styles.panelTitle }>Mesh Info</div>
            <div className={ styles.meshInfoSection }>
                <div>
                    <div className={ styles.infoKey }>Total Size:</div>
                    <div className={ styles.infoValue }>{ mesh?.size } bytes</div>
                </div>
                <div>
                    <div className={ styles.infoKey }>References:</div>
                    <div onClick={goToReferences} style={
                        mesh?.referenceCount && mesh.referenceCount > 0 ? { color: 'blue', textDecoration: 'underline', cursor: 'pointer' } : {}
                    } className={ styles.infoValue }>{mesh?.referenceCount}</div>
                </div>
            </div>
            <div className={ styles.meshViewerSection }>
                <Viewer viewer={viewer} />
            </div>
            <div>
                <div>Primitives</div>
                <div style={{ padding: '10px' }}>
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
    )
}))

export default MeshPanel