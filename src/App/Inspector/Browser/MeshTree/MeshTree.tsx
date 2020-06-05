import React from 'react'
import styles from './MeshTree.module.css'
import { glMesh, glPrimitive } from '../../../../types/gltf'
import { AutoSizer, List } from 'react-virtualized'

interface IMeshTreeProps {
    meshes: glMesh[]
    onMeshSelect: (mesh: glMesh) => void
}

const MeshTree: React.FC<IMeshTreeProps> = (props) => {

    const rowRendererFn = (list: glMesh[], padding: number) => (rowRenderingProps: {
        key: string,
        index: number,
        isScrolling: boolean,
        isVisible: boolean,
        style: React.CSSProperties
    }) => {
        const item = list[rowRenderingProps.index]
        const leftPad = 0
        const customStyle: React.CSSProperties = {...rowRenderingProps.style, paddingLeft: `${leftPad}px`}
    
        return (
            <div key={rowRenderingProps.key} onClick={() => props.onMeshSelect(item) } className={ styles.nodeRow } style={customStyle}>
                <div className={ styles.nodeRowText }>{ `${item.selfIndex}:   ${item.name || 'Unnamed Mesh'}` }</div>
            </div>
        )
    }

    // const list = organizeMeshes(props.meshes)
    const rowRenderer = rowRendererFn(props.meshes, 25)

    return (
        <div style={{ height: '100%' }}>
        <AutoSizer>
            {({height, width}) => (
                <List 
                    width={ width }
                    height={ height }
                    rowCount={ props.meshes.length }
                    rowHeight={ 25 }
                    rowRenderer={ rowRenderer }
                />
            )}
        </AutoSizer>
    </div>
    )
}

// const organizeMeshes = (meshes: glMesh[]) => {
//     const meshList: (glMesh | glPrimitive)[] = []
//     for (let i = 0; i < meshes.length; i++) {
//         const mesh = meshes[i];
//         mesh.type = 'mesh'
//         mesh.selfIndex = i
//         meshList.push(mesh)
//         for (let j = 0; j < mesh.primitives.length; j++) {
//             const primitive = mesh.primitives[j];
//             primitive.type = 'primitive'
//             primitive.selfIndex = j
//             meshList.push(primitive)
//         }
//     }
//     return meshList
// }

export default MeshTree