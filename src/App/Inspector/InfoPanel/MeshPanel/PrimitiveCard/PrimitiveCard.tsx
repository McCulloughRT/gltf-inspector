import React from 'react'
import { glPrimitive, GetComponentArrayType, glMaterial, AccessorType } from '../../../../../types/gltf'
import { GLTFManager } from '../../../../../utils/GLTFManager/GLTFManager'
import { Dialog, DialogTitle, DialogContent, Paper } from '@material-ui/core'
import styles from './PrimitiveCard.module.css'
import { AppState } from '../../../../../stores/app.store'
import { observer, inject } from 'mobx-react'


interface IPrimitiveCardProps {
    appState?: AppState
    prim: glPrimitive
    idx: number
    // gltfManager: GLTFManager
}
const PrimitiveCard: React.FC<IPrimitiveCardProps> = inject('appState')(observer(({ appState, prim, idx }) => {
    const [bufferOpen, setBufferOpen] = React.useState(false)
    const [bufferData, setBufferData] = React.useState<JSX.Element | undefined>()

    const getBufferData = async (accessorIdx?: number) => {
        if (accessorIdx == null || appState?.gltfManager == null) return
        setBufferOpen(true)
        appState.gltfManager.LoadAccessorData(accessorIdx)
        .then(data => {
            if (data == null) return
            const acc = appState?.gltfManager?.gltf?.accessors[accessorIdx]
            const typedBufferConstructor = GetComponentArrayType(acc?.componentType)
            if (typedBufferConstructor == null) return

            const typedBuffer = new typedBufferConstructor(data)
            setBufferData(formatBuffer(typedBuffer, acc!.type))
        })
    }

    const attributes = Object.keys(prim.attributes).map((a,i) => {
        const attribIdx = prim.attributes[a]
        const attrib = appState?.gltfManager?.gltf?.accessors[attribIdx]
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
    const indicesAccessor = appState?.gltfManager?.gltf?.accessors[prim.indices]
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
    if (prim.material) material = appState?.gltfManager?.gltf?.materials[prim.material]

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
                            <div 
                                onClick={() => appState?.materialInspector.onMaterialReferenceClick(material?.selfIndex!) } 
                                className={ styles.primitiveSubContainer }
                            >
                                <div style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>
                                    { `${material.selfIndex}: ${material.name}` || `Unnamed Material #${material.selfIndex}` }
                                </div>
                            </div>
                        </div>
                    ) : null
                }
            </Paper>
        </>
    )
}))

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

export default PrimitiveCard