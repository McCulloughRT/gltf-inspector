import React from 'react'
import { makeGltfURLFromNode_Lazy, rndZero } from '../utils'
import ThreeViewer from '../../../../utils/ThreeViewer/ThreeViewer'
import { GLTFManager } from '../../../../utils/GLTFManager/GLTFManager'
import { glNode } from '../../../../types/gltf'
import { Dialog, DialogTitle, DialogContent, Paper } from '@material-ui/core'

import SyntaxHighlighter from 'react-syntax-highlighter'
import { colorBrewer } from "react-syntax-highlighter/dist/esm/styles/hljs";
import Viewer from '../../../../utils/ThreeViewer/Viewer'

import styles from './NodePanel.module.css'
import { AppState } from '../../../../stores/app.store'
import { observer, inject } from 'mobx-react'

interface INodePanelProps {
    appState?: AppState

    // node: glNode 
    // gltfManager: GLTFManager
    // onMeshScrollTo: (item: number) => void
    // setIndexFilter: (indices: number[]) => void
}
const NodePanel: React.FC<INodePanelProps> = inject('appState')(observer(({ appState }) => {
    const [extrasOpen, setExtrasOpen] = React.useState(false)
    const [viewer, setViewer] = React.useState<ThreeViewer>(new ThreeViewer)

    const node = appState?.nodeInspector.selectedItem
    const gltfManager = appState?.gltfManager

    if (node != null && gltfManager != null) {
        console.log('node updating', node)
        const gltfURL = makeGltfURLFromNode_Lazy(node, gltfManager)
        if (viewer.isInitialized) {
            viewer.glTFLoadLocal(gltfURL, gltfManager.rootPath || '', gltfManager.assetMap)
        } else {
            viewer.on('init', () => {
                viewer.glTFLoadLocal(gltfURL, gltfManager.rootPath || '', gltfManager.assetMap)
            })
        }   
    }

    const meshClick = (meshIdx?: number) => {
        if (meshIdx == null) return
        appState?.meshInspector.onMeshReferenceClick(meshIdx)
        // onMeshScrollTo(meshIdx)
    }

    const materialClick = (materialIdx?: number) => {
        if (materialIdx == null) return
        appState?.materialInspector.onMaterialReferenceClick(materialIdx)
        // onMaterialScrollTo(materialIdx)
    }

    const displayNode: {[key:string]:any} = {...node}
    delete displayNode['assetType']
    delete displayNode['selfIndex']
    delete displayNode['referenceCount']
    delete displayNode['referenceCountNodes']
    delete displayNode['size']
    delete displayNode['hierarchy']
    delete displayNode['order']
    if (displayNode['children'] != null) displayNode['children'] = '-- see parsed list --'

    console.log('rendering nodepanel')
    if (appState?.nodeInspector.selectedItem == null) return null
    console.log('rendering selected node')
    return (
        <>
            <Dialog open={extrasOpen} onClose={() => setExtrasOpen(false)}>
                <DialogTitle>Extras</DialogTitle>
                <DialogContent>
                    <SyntaxHighlighter 
                        language='javascript' 
                        style={colorBrewer}
                        customStyle={{ fontSize: '0.6em' }}
                    >
                        { JSON.stringify(node?.extras, null, 3) }
                    </SyntaxHighlighter>
                </DialogContent>
            </Dialog>
            {/* <div>Node Info</div> */}
            <div className={ styles.nodeInfoSection }>
                <div>
                    <div className={ styles.infoKey }>Name:</div>
                    <div className={ styles.infoValue }>{ `${node?.selfIndex}: ${node?.name}` }</div>
                </div>
                <div>
                    <div className={ styles.infoKey }>Total Size:</div>
                    <div className={ styles.infoValue }>{ node?.size } bytes</div>
                </div>
            </div>
            <div className={ styles.nodeViewerSection }>
                <Viewer viewer={viewer} />
            </div>
            <div>
                <div>Data</div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <div style={{ width: '50%' }}>
                        <Paper elevation={6}>
                            <SyntaxHighlighter 
                                language='javascript' 
                                style={colorBrewer}
                                customStyle={{ fontSize: '0.9em' }}
                            >
                                { JSON.stringify(displayNode, null, 3) }
                            </SyntaxHighlighter>
                        </Paper>
                    </div>
                    <div style={{ width: '50%', padding: '10px' }}>
                        <Paper elevation={6} className={ styles.nodeCard }>
                            <div className={ styles.nodeInfoContainer }>
                                <div className={ styles.nodeInfoBox }>
                                    <div className={ styles.nodeInfoTitle }>Name:</div>
                                    <div className={ styles.nodeInfoContent }>
                                        {node?.name}
                                    </div>
                                </div>
                                <div className={ styles.nodeInfoBox }>
                                    <div className={ styles.nodeInfoTitle }>Mesh:</div>
                                    <div className={ styles.nodeInfoContent } onClick={() => meshClick(node?.mesh)}>
                                        { <span style={{ cursor:'pointer', color:'blue', textDecoration:'underline' }}>{node?.mesh}</span> || 'none' }
                                    </div>
                                </div>
                                <div className={ styles.nodeInfoBox }>
                                    {
                                        formatMatrix(node?.matrix)
                                    }
                                </div>
                                <div className={ styles.nodeInfoBox }>
                                    <div className={ styles.nodeInfoTitle }>Children:</div>
                                    <div 
                                        onClick={ () => appState?.nodeInspector.setIndexFilter(node?.children) }
                                        style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                                        className={ styles.nodeInfoContent }
                                    >
                                        { node?.children?.length || 0 }
                                        {/* {node?.children ? JSON.stringify(node?.children) : 'none'} */}
                                    </div>
                                </div>
                                <div className={ styles.nodeInfoBox }>
                                    <div className={ styles.nodeInfoTitle }>Extras:</div>
                                    <div className={ styles.nodeInfoContent }>
                                        {
                                            node?.extras ? (
                                                <span 
                                                    onClick={() => setExtrasOpen(true)} 
                                                    style={{ 
                                                        color: 'blue', 
                                                        textDecoration: 'underline',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    View
                                                </span>
                                            ) : 'none'
                                        }
                                    </div>
                                </div>
                                <div className={ styles.nodeInfoBox }>
                                    <div className={ styles.nodeInfoTitle }>Materials:</div>
                                    <div className={ styles.nodeInfoContent }>
                                        { 
                                            gltfManager?.GetMaterialsForNode(node?.selfIndex!).map(m => (
                                                <div 
                                                    style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }} 
                                                    onClick={() => materialClick(m.selfIndex)}
                                                >
                                                    { m.name || `Unnamed Material #${m.selfIndex}` }
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </Paper>
                    </div>
                </div>
            </div>
        </>
    )
}))

export function formatMatrix(m?: number[]) {
    if (m == null) m = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
    return (
        <div>
            <div className={ styles.nodeInfoTitle }>Matrix:</div>
            <table style={{ width: '100%' }}>
                <tbody>
                    <tr>
                        <td>{rndZero(m[0])},</td>
                        <td>{rndZero(m[1])},</td>
                        <td>{rndZero(m[2])},</td>
                        <td>{rndZero(m[3])},</td>
                    </tr>
                    <tr>
                        <td>{rndZero(m[4])},</td>
                        <td>{rndZero(m[5])},</td>
                        <td>{rndZero(m[6])},</td>
                        <td>{rndZero(m[7])},</td>
                    </tr>
                    <tr>
                        <td>{rndZero(m[8])},</td>
                        <td>{rndZero(m[9])},</td>
                        <td>{rndZero(m[10])},</td>
                        <td>{rndZero(m[11])},</td>
                    </tr>
                    <tr>
                        <td>{rndZero(m[12])},</td>
                        <td>{rndZero(m[13])},</td>
                        <td>{rndZero(m[14])},</td>
                        <td>{rndZero(m[15])},</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default NodePanel