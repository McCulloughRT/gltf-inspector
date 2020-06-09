import React from 'react'
import styles from './InfoPanel.module.css'

import SyntaxHighlighter from 'react-syntax-highlighter'
import { colorBrewer } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { glMesh, glPrimitive, glNode, glTF, glMaterial, glAccessor, glBufferView, GetComponentArrayType, Targets, AccessorType } from '../../../types/gltf'
import { Dialog, DialogTitle, DialogContent, Paper } from '@material-ui/core';
import { IGLTFPackage } from '../../../types';
import ThreeViewer from '../../../utils/ThreeViewer/ThreeViewer';
import Viewer from '../../../utils/ThreeViewer/Viewer'
import { GLTFManager } from '../../../utils/GLTFManager/GLTFManager';

interface IInfoPanelProps {
    item?: glNode | glMesh | glPrimitive
    gltfManager: GLTFManager
    onMeshScrollTo: (index: number) => void
}

const InfoPanel: React.FC<IInfoPanelProps> = (props) => {
    const panel = getPanel(
        props.gltfManager, 
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
    mgr: GLTFManager, 
    onMeshScrollTo: (item: number) => void,
    item?: glNode | glMesh | glPrimitive,
) {
    if (item == null) return <div />
    switch(item.assetType) {
        case 'node': return <NodePanel onMeshScrollTo={ onMeshScrollTo } node={item} gltfManager={mgr} />
        case 'mesh': return <MeshPanel onMeshScrollTo={ onMeshScrollTo } mesh={item} gltfManager={mgr} />
        // case 'primitive': return <PrimitivePanel prim={item} gltf={gltf} />
        default: return <div />
    }
}

interface IMeshPanelProps {
    mesh: glMesh
    gltfManager: GLTFManager
    onMeshScrollTo: (item: number) => void
}
const MeshPanel: React.FC<IMeshPanelProps> = ({ mesh, gltfManager, onMeshScrollTo }) => {
    const [viewer, setViewer] = React.useState<ThreeViewer>(new ThreeViewer())
    React.useEffect(() => {
        const gltfURL = makeGltfURLFromMesh(mesh, gltfManager) as string
        if (viewer.isInitialized) {
            viewer.glTFLoadLocal(gltfURL, gltfManager.rootPath || '', gltfManager.assetMap)
        } else {
            viewer.on('init', () => {
                viewer.glTFLoadLocal(gltfURL, gltfManager.rootPath || '', gltfManager.assetMap)
            })
        }
    }, [mesh])

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
                                <PrimitiveCard key={i} idx={i} prim={p} gltfManager={gltfManager} />
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
    gltfManager: GLTFManager
    onMeshScrollTo: (item: number) => void
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

function formatBuffer(
    buffer: Float32Array | Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array,
    type: AccessorType
) {
    let columnsPerRow: number // number of columns
    let rowsPerElement: number // number of nested rows
    switch(type) {
        case AccessorType.SCALAR:
            columnsPerRow = 1
            rowsPerElement = 1
            break
        case AccessorType.VEC2:
            columnsPerRow = 2
            rowsPerElement = 1
            break
        case AccessorType.VEC3:
            columnsPerRow = 3
            rowsPerElement = 1
            break
        case AccessorType.VEC4:
            columnsPerRow = 4
            rowsPerElement = 1
            break
        case AccessorType.MAT2:
            columnsPerRow = 2
            rowsPerElement = 2
            break
        case AccessorType.MAT3:
            columnsPerRow = 3
            rowsPerElement = 3
            break
        case AccessorType.MAT4:
            columnsPerRow = 4
            rowsPerElement = 4
            break
    }

    let tableElements: JSX.Element[] = []
    const numElements = (buffer.length / columnsPerRow) / rowsPerElement // 2
    for (let element = 0; element < numElements; element++) {
        let elementRows: JSX.Element[] = []
        for (let row = 0; row < rowsPerElement; row++) {
            let rowData: JSX.Element[] = []
            for (let column = 0; column < columnsPerRow; column++) {
                const elementStartIdx = element * rowsPerElement * columnsPerRow
                const rowStartIdx = row * columnsPerRow
                const num = buffer[elementStartIdx + rowStartIdx + column]
                rowData.push(
                    <td 
                        key={`e${element}_r${row}_c${column}`}
                        className={ styles.bufferRowElement }
                    >
                        { num }
                    </td>
                )
            }
            elementRows.push(
                <tr 
                    key={`e${element}_r${row}`}
                    className={ styles.bufferRow }
                >
                    { rowData }
                </tr>
            )
        }
        tableElements.push(
            <table 
                key={`e${element}`}
                className={ styles.bufferElement }
            >
                { elementRows }
            </table>
        )
    }

    return (
        <table className={ styles.bufferTable }>
            <tr>
                <td>
                    { tableElements }
                </td>
            </tr>
        </table>
    )
}

interface IPrimitiveCardProps {
    prim: glPrimitive
    idx: number
    gltfManager: GLTFManager
}
const PrimitiveCard: React.FC<IPrimitiveCardProps> = ({ prim, gltfManager, idx }) => {
    const [bufferOpen, setBufferOpen] = React.useState(false)
    const [bufferData, setBufferData] = React.useState<JSX.Element | undefined>()

    const getBufferData = async (accessorIdx?: number) => {
        if (accessorIdx == null) return
        setBufferOpen(true)
        gltfManager.LoadAccessorData(accessorIdx)
        .then(data => {
            if (data == null) return
            const acc = gltfManager.gltf?.accessors[accessorIdx]
            const typedBufferConstructor = GetComponentArrayType(acc?.componentType)
            if (typedBufferConstructor == null) return

            const typedBuffer = new typedBufferConstructor(data)
            setBufferData(formatBuffer(typedBuffer, acc!.type))
        })
    }

    const attributes = Object.keys(prim.attributes).map((a,i) => {
        const attribIdx = prim.attributes[a]
        const attrib = gltfManager.gltf?.accessors[attribIdx]
        return (
            <tr>
                <td>{ a }</td>
                <td>{ attribIdx }</td>
                <td>{ attrib?.count }</td>
                <td>{ attrib?.type }</td>
                <td><span className={ styles.bufferViewBtn } onClick={() => getBufferData(attribIdx)}>View</span></td>
            </tr>
        )
    })
    const indicesAccessor = gltfManager.gltf?.accessors[prim.indices]
    attributes.push((
        <tr>
            <td>INDICES</td>
            <td>{ indicesAccessor?.selfIndex }</td>
            <td>{ indicesAccessor?.count }</td>
            <td>{ indicesAccessor?.type }</td>
            <td><span className={ styles.bufferViewBtn } onClick={() => getBufferData(indicesAccessor?.selfIndex)}>View</span></td>
        </tr>
    ))

    let material: glMaterial | undefined
    if (prim.material) material = gltfManager.gltf?.materials[prim.material]

    return (
        <>
            <Dialog open={bufferOpen} onClose={() => setBufferOpen(false)}>
                <DialogTitle>Buffer Data</DialogTitle>
                <DialogContent>
                    { bufferData }
                </DialogContent>
            </Dialog>
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
                                    <th></th>
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
        </>
    )
}

// TODO: both of these can be moved to the gltf manager class
function makeGltfURLFromNode(originalNode: glNode, mgr: GLTFManager): string {
    if (mgr.gltf == null) throw new Error('GLTF file has not been parsed!')
    const gltf = makeGltfURLFromMesh(mgr.gltf.meshes[originalNode.mesh!], mgr, true) as glTF
    gltf.nodes[0] = { ...originalNode, mesh: 0 }

    const blob = new Blob([JSON.stringify(gltf)], {type : 'application/json'});
    const gltfURL = URL.createObjectURL(blob)
    return gltfURL
}

function makeGltfURLFromMesh(originalMesh: glMesh, mgr: GLTFManager, returnObject: boolean = false): string | glTF {
    if (mgr.gltf == null) throw new Error('GLTF file has not been parsed!')
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
                acc = {...mgr.gltf!.accessors[accIdx]}
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
                view = {...mgr.gltf!.bufferViews[viewIdx]}
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
            acc = {...mgr.gltf!.accessors[accIndIndex]}
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
            view = {...mgr.gltf!.bufferViews[viewIdx]}
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
                mat = {...mgr.gltf!.materials[p.material]}
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
        buffers: mgr.gltf.buffers,
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