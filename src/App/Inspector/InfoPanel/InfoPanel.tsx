import React from 'react'
import styles from './InfoPanel.module.css'

import SyntaxHighlighter from 'react-syntax-highlighter'
import { colorBrewer } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { glMesh, glPrimitive, glNode, glTF, glMaterial, glAccessor, glBufferView } from '../../../types/gltf'
import { Dialog, DialogTitle, DialogContent, Paper } from '@material-ui/core';
import { IGLTFPackage } from '../../../types';
import ThreeViewer from '../../../utils/ThreeViewer/ThreeViewer';
import Viewer from '../../../utils/ThreeViewer/Viewer'

interface IInfoPanelProps {
    item?: glNode | glMesh | glPrimitive
    gltfPackage: IGLTFPackage
    onMeshScrollTo: (index: number) => void
}

const InfoPanel: React.FC<IInfoPanelProps> = (props) => {
    const panel = getPanel(
        props.gltfPackage.gltf, 
        props.gltfPackage, 
        props.onMeshScrollTo,
        props.item
    )

    return (
        <div className={ styles.container }>
            { panel }
        </div>
    )
}

function getPanel(
    gltf: glTF, 
    pkg: IGLTFPackage, 
    onMeshScrollTo: (item: number) => void,
    item?: glNode | glMesh | glPrimitive,
) {
    if (item == null) return <div />
    switch(item.assetType) {
        case 'node': return <NodePanel onMeshScrollTo={ onMeshScrollTo } node={item} gltf={gltf} pkg={pkg} />
        case 'mesh': return <MeshPanel onMeshScrollTo={ onMeshScrollTo } mesh={item} gltf={gltf} pkg={pkg} />
        // case 'primitive': return <PrimitivePanel prim={item} gltf={gltf} />
        default: return <div />
    }
}

interface IMeshPanelProps {
    mesh: glMesh
    gltf: glTF
    pkg: IGLTFPackage
    onMeshScrollTo: (item: number) => void
}
const MeshPanel: React.FC<IMeshPanelProps> = ({ mesh, gltf, pkg, onMeshScrollTo }) => {
    const [viewer, setViewer] = React.useState<ThreeViewer>(new ThreeViewer())
    React.useEffect(() => {
        const gltfURL = makeGltfURLFromMesh(mesh, pkg) as string
        if (viewer.isInitialized) {
            viewer.glTFLoadLocal(gltfURL, pkg.rootPath || '', pkg.fileMap)
        } else {
            viewer.on('init', () => {
                viewer.glTFLoadLocal(gltfURL, pkg.rootPath || '', pkg.fileMap)
            })
        }
    },[mesh])

    return (
        <div>
            <div className={ styles.panelTitle }>Mesh Info</div>
            <div className={ styles.meshInfoSection }>
                <div>
                    <div className={ styles.infoKey }>Total Size:</div>
                    <div className={ styles.infoValue }>{ mesh.size } bytes</div>
                </div>
                <div>
                    <div className={ styles.infoKey }>References:</div>
                    <div className={ styles.infoValue }>{mesh.referenceCount}</div>
                </div>
            </div>
            <div className={ styles.meshViewerSection }>
                <Viewer viewer={viewer} />
            </div>
            <div>
                <div>Primitives</div>
                <div style={{ padding: '10px' }}>
                    {
                        mesh.primitives.map((p,i) => {
                            return (
                                <PrimitiveCard key={i} idx={i} prim={p} gltf={gltf} />
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}

interface INodePanelProps {
    node: glNode 
    gltf: glTF
    pkg: IGLTFPackage
    onMeshScrollTo: (item: number) => void
}
const NodePanel: React.FC<INodePanelProps> = ({ node, gltf, pkg, onMeshScrollTo }) => {
    const [extrasOpen, setExtrasOpen] = React.useState(false)

    const [viewer, setViewer] = React.useState<ThreeViewer>(new ThreeViewer)
    React.useEffect(() => {
        if (node.mesh == null) return
        const gltfURL = makeGltfURLFromNode(node, pkg)
        if (viewer.isInitialized) {
            viewer.glTFLoadLocal(gltfURL, pkg.rootPath || '', pkg.fileMap)
        } else {
            viewer.on('init', () => {
                viewer.glTFLoadLocal(gltfURL, pkg.rootPath || '', pkg.fileMap)
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
            <div className={ styles.meshViewerSection }>
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
                </div>
            </Paper>
        </>
    )
}

const PrimitiveCard: React.FC<{prim: glPrimitive, gltf: glTF, idx: number}> = ({ prim, gltf, idx }) => {
    const attributes = Object.keys(prim.attributes).map((a,i) => {
        const attribIdx = prim.attributes[a]
        const attrib = gltf.accessors[attribIdx]
        return (
            <tr>
                <td>{ a }</td>
                <td>{ attribIdx }</td>
                <td>{ attrib.count }</td>
                <td>{ attrib.type }</td>
            </tr>
        )
    })
    const indicesAccessor = gltf.accessors[prim.indices]
    attributes.push((
        <tr>
            <td>INDICES</td>
            <td>{ indicesAccessor.selfIndex }</td>
            <td>{ indicesAccessor.count }</td>
            <td>{ indicesAccessor.type }</td>
        </tr>
    ))

    let material: glMaterial | undefined
    if (prim.material) material = gltf.materials[prim.material]

    return (
        <Paper elevation={6} className={ styles.primitiveCard }>
            <div className={ styles.primitiveSection }>
                <div className={ styles.primitiveSubtitle }>Accessors</div>
                <div className={ styles.primitiveSubContainer }>
                <table className={ styles.attributeTable }>
                    <thead>
                            <tr>
                                <th>Attribute</th>
                                <th>Index</th>
                                <th>Count</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            { attributes }
                        </tbody>
                    </table>
                </div>
            </div>
            {
                material != null ? (
                    <div className={ styles.primitiveSection }>
                        <div className={ styles.primitiveSubtitle }>Material</div>
                        <div className={ styles.primitiveSubContainer }>
                            <div>{ material.name || `Unnamed Material #${material.selfIndex}` }</div>
                        </div>
                    </div>
                ) : null
            }
        </Paper>
    )
}

function makeGltfURLFromNode(originalNode: glNode, pkg: IGLTFPackage): string {
    const gltf = makeGltfURLFromMesh(pkg.gltf.meshes[originalNode.mesh!], pkg, true) as glTF
    gltf.nodes[0] = { ...originalNode, mesh: 0 }

    const blob = new Blob([JSON.stringify(gltf)], {type : 'application/json'});
    const gltfURL = URL.createObjectURL(blob)
    return gltfURL
}

function makeGltfURLFromMesh(originalMesh: glMesh, pkg: IGLTFPackage, returnObject: boolean = false): string | glTF {
    const mesh = JSON.parse(JSON.stringify(originalMesh))
    const accIdxMap = new Map<number,number>()
    const viewIdxMap = new Map<number,number>()
    const materialIdxMap = new Map<number,number>()

    let accessors: glAccessor[] = []
    let views: glBufferView[] = []
    let materials: glMaterial[] = []

    mesh.primitives.forEach((p: glPrimitive) => {
        Object.keys(p.attributes).forEach(key => {
            const accIdx = p.attributes[key]
            let acc, newIdx
            if (!accIdxMap.has(accIdx)) {
                acc = {...pkg.gltf.accessors[accIdx]}
                accessors.push(acc)
                newIdx = accessors.length - 1
                accIdxMap.set(accIdx, newIdx)
            } else {
                newIdx = accIdxMap.get(accIdx)!
                acc = accessors[newIdx]
            }
            p.attributes[key] = newIdx
            

            const viewIdx = acc.bufferView
            let view, newViewIdx
            if (!viewIdxMap.has(viewIdx)) {
                view = {...pkg.gltf.bufferViews[viewIdx]}
                views.push(view)
                newViewIdx = views.length - 1
                viewIdxMap.set(viewIdx, newViewIdx)
            } else {
                newViewIdx = viewIdxMap.get(viewIdx)!
                view = views[newViewIdx]
            }
            acc.bufferView = newViewIdx
        })

        const accIndIndex = p.indices
        let acc, newIdx
        if (!accIdxMap.has(accIndIndex)) {
            acc = {...pkg.gltf.accessors[accIndIndex]}
            accessors.push(acc)
            newIdx = accessors.length - 1
            accIdxMap.set(accIndIndex, newIdx)
        } else {
            newIdx = accIdxMap.get(accIndIndex)!
            acc = accessors[newIdx]
        }
        p.indices = newIdx

        const viewIdx = acc.bufferView
        let view, newViewIdx
        if (!viewIdxMap.has(viewIdx)) {
            view = {...pkg.gltf.bufferViews[viewIdx]}
            views.push(view)
            newViewIdx = views.length - 1
            viewIdxMap.set(viewIdx, newViewIdx)
        } else {
            newViewIdx = viewIdxMap.get(viewIdx)!
            view = views[newViewIdx]
        }
        acc.bufferView = newViewIdx

        if (p.material != null) {
            const matIdx = p.material
            let mat, newMatIdx
            if (!materialIdxMap.has(matIdx)) {
                mat = {...pkg.gltf.materials[p.material]}
                materials.push(mat)
                newMatIdx = materials.length - 1
                materialIdxMap.set(matIdx, newMatIdx)
            } else {
                newMatIdx = materialIdxMap.get(matIdx)!
                mat = materials[newMatIdx]
            }
            p.material = newMatIdx
        }
    })

    const gltf: glTF = {
        asset: { version: [2] },
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [mesh],
        buffers: pkg.gltf.buffers,
        bufferViews: views,
        accessors: accessors,
        materials: materials
    }

    if (returnObject) {
        return gltf
    }

    const blob = new Blob([JSON.stringify(gltf)], {type : 'application/json'});
    const gltfURL = URL.createObjectURL(blob)
    return gltfURL
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