import React from 'react'
import styles from './InfoPanel.module.css'

import SyntaxHighlighter from 'react-syntax-highlighter'
import { colorBrewer } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { glMesh, glPrimitive, glNode, glTF } from '../../../types/gltf'
import { Dialog, DialogTitle, DialogContent, Paper } from '@material-ui/core';

interface IInfoPanelProps {
    item?: glNode | glMesh | glPrimitive
    gltf: glTF
}

const InfoPanel: React.FC<IInfoPanelProps> = (props) => {
    const panel = getPanel(props.gltf, props.item)
    return (
        <div className={ styles.container }>
            { panel }
        </div>
    )
}

function getPanel(gltf: glTF, item?: glNode | glMesh | glPrimitive) {
    if (item == null) return <div />
    switch(item.assetType) {
        case 'node': return <NodePanel node={item} gltf={gltf} />
        case 'mesh': return <MeshPanel mesh={item} gltf={gltf} />
        // case 'primitive': return <PrimitivePanel prim={item} gltf={gltf} />
        default: return <div />
    }
}

const PrimitiveCard: React.FC<{prim: glPrimitive, gltf: glTF}> = ({ prim, gltf }) => {
    const attributes = Object.keys(prim.attributes).map((a,i) => {
        const attribIdx = prim.attributes[a]
        const attrib = gltf.accessors[attribIdx]
        return (
            <div>
                <div>
                    <div>{ a }</div>
                    <div>{ attribIdx }</div>
                    <div>{ attrib.count }</div>
                    <div>{ attrib.type }</div>
                </div>
            </div>
        )
    })
    return (
        <Paper elevation={6} className={ styles.primitiveCard }>
            <div>
                { attributes }
            </div>
        </Paper>
    )
}

const MeshPanel: React.FC<{mesh: glMesh, gltf: glTF}> = ({ mesh, gltf }) => {
    const numPrimitives = mesh.primitives.length
    let totalSize = 0
    mesh.primitives.forEach(p => {
        const attributes = Object.keys(p.attributes)
        attributes.forEach(a => {
            const accessor = gltf.accessors[p.attributes[a]]
            const view = gltf.bufferViews[accessor.bufferView]
            totalSize += view.byteLength - accessor.byteOffset
        })

        const ind = gltf.accessors[p.indices]
        const indView = gltf.bufferViews[ind.bufferView]
        const indLength = indView.byteLength - ind.byteOffset

        totalSize += indLength
    })
    return (
        <div>
            <div>Mesh Info</div>
            <div>
                <div>Total Size:</div>
                <div>{ totalSize } bytes</div>
            </div>

            <div>
                <div>Primitives</div>
                <div style={{ padding: '10px' }}>
                    {
                        mesh.primitives.map((p,i) => {
                            return (
                                <PrimitiveCard key={i} prim={p} gltf={gltf} />
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}

const NodePanel: React.FC<{node: glNode, gltf: glTF}> = ({ node, gltf }) => {
    const [extrasOpen, setExtrasOpen] = React.useState(false)

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
            <div className={ styles.nodeInfoContainer }>
                <div className={ styles.nodeInfoBox }>
                    <div className={ styles.nodeInfoTitle }>Name:</div>
                    <div className={ styles.nodeInfoContent }>
                        {node.name}
                    </div>
                </div>
                <div className={ styles.nodeInfoBox }>
                    <div className={ styles.nodeInfoTitle }>Mesh:</div>
                    <div className={ styles.nodeInfoContent }>
                        {node.mesh || 'none'}
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
            </div>
        </>
    )
}

function formatMatrix(m?: number[]) {
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

function rndZero(num: number) {
    if (num < 1e-14 && num > 0) return 0
    if (num > -1e-14 && num < 0) return 0
    return num
}

export default InfoPanel