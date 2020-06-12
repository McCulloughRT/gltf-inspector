import React from 'react'
import { makeGltfURLFromNode, rndZero } from '../utils'
import ThreeViewer from '../../../../utils/ThreeViewer/ThreeViewer'
import { GLTFManager } from '../../../../utils/GLTFManager/GLTFManager'
import { glNode } from '../../../../types/gltf'
import { Dialog, DialogTitle, DialogContent, Paper } from '@material-ui/core'

import SyntaxHighlighter from 'react-syntax-highlighter'
import { colorBrewer } from "react-syntax-highlighter/dist/esm/styles/hljs";
import Viewer from '../../../../utils/ThreeViewer/Viewer'

import styles from './NodePanel.module.css'

interface INodePanelProps {
    node: glNode 
    gltfManager: GLTFManager
    onMeshScrollTo: (item: number) => void
    setIndexFilter: (indices: number[]) => void
}
const NodePanel: React.FC<INodePanelProps> = ({ node, gltfManager, onMeshScrollTo }) => {
    const [extrasOpen, setExtrasOpen] = React.useState(false)

    const [viewer, setViewer] = React.useState<ThreeViewer>(new ThreeViewer)
    React.useEffect(() => {
        if (node.mesh == null) return
        const gltfURL = makeGltfURLFromNode(node, gltfManager)
        if (viewer.isInitialized) {
            viewer.glTFLoadLocal(gltfURL, gltfManager.rootPath || '', gltfManager.assetMap)
        } else {
            viewer.on('init', () => {
                viewer.glTFLoadLocal(gltfURL, gltfManager.rootPath || '', gltfManager.assetMap)
            })
        }
    },[node])

    const meshClick = (meshIdx?: number) => {
        if (meshIdx == null) return
        onMeshScrollTo(meshIdx)
    }

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
                        { JSON.stringify(node.extras, null, 3) }
                    </SyntaxHighlighter>
                </DialogContent>
            </Dialog>
            <div>Node Info</div>
            <div className={ styles.nodeViewerSection }>
                <Viewer viewer={viewer} />
            </div>
            <Paper elevation={6} className={ styles.nodeCard }>
                <div className={ styles.nodeInfoContainer }>
                    <div className={ styles.nodeInfoBox }>
                        <div className={ styles.nodeInfoTitle }>Name:</div>
                        <div className={ styles.nodeInfoContent }>
                            {node.name}
                        </div>
                    </div>
                    <div className={ styles.nodeInfoBox }>
                        <div className={ styles.nodeInfoTitle }>Mesh:</div>
                        <div className={ styles.nodeInfoContent } onClick={() => meshClick(node.mesh)}>
                            { <span style={{ cursor:'pointer', color:'blue', textDecoration:'underline' }}>{node.mesh}</span> || 'none' }
                        </div>
                    </div>
                    <div className={ styles.nodeInfoBox }>
                        {
                            formatMatrix(node.matrix)
                        }
                    </div>
                    <div className={ styles.nodeInfoBox }>
                        <div className={ styles.nodeInfoTitle }>Children:</div>
                        <div className={ styles.nodeInfoContent }>
                            {node.children ? JSON.stringify(node.children) : 'none'}
                        </div>
                    </div>
                    <div className={ styles.nodeInfoBox }>
                        <div className={ styles.nodeInfoTitle }>Extras:</div>
                        <div className={ styles.nodeInfoContent }>
                            {
                                node.extras ? (
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
                                gltfManager.GetMaterialsForNode(node.selfIndex!).map(m => (
                                    <div>{ m.name || `Unnamed Material #${m.selfIndex}` }</div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </Paper>
        </>
    )
}

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