import React from 'react'
import styles from './MeshTree.module.css'
import { glMesh, glPrimitive } from '../../../../types/gltf'
import { AutoSizer, List, Table, Column } from 'react-virtualized'

interface IMeshTreeProps {
    meshes: glMesh[]
    scrollToIndex?: number
    onMeshSelect: (mesh: glMesh) => void
}

const MeshTree: React.FC<IMeshTreeProps> = ({ meshes, onMeshSelect, scrollToIndex }) => {
    const [selectedIdx, setSelectedIdx] = React.useState<number | undefined>()

    const handleClick = ({event, index, rowData}: {event: React.MouseEvent, index: number, rowData: any}) => {
        setSelectedIdx(index)
        onMeshSelect(meshes[index])
    }

    React.useEffect(() => {
        if (scrollToIndex != null) {
            setSelectedIdx(scrollToIndex)
            onMeshSelect(meshes[scrollToIndex])
        }
    }, [scrollToIndex])

    return (
        <div style={{ height: '100%' }}>
        <AutoSizer>
            {({height, width}) => (
                <Table
                    width={ width }
                    height={ height }
                    headerHeight={ 25 }
                    noRowsRenderer={() => <div className={styles.noRows}>No rows</div>}
                    rowClassName={ ({index}) => index < 0 ? styles.meshHeader : styles.meshRow }
                    rowStyle={ ({index}) => {
                        const style: React.CSSProperties = {}
                        if (index === selectedIdx) style['backgroundColor'] = '#e1e1e9'
                        return style
                    }}
                    scrollToIndex={ scrollToIndex }
                    rowHeight={ 25 }
                    rowCount={ meshes.length }
                    rowGetter={ ({index}) => meshes[index] }
                    onRowClick={ handleClick }
                >
                    <Column label='Idx' dataKey='selfIndex' width={width * .1} />
                    <Column label='Name' dataKey='name' width={width * .375} cellDataGetter={
                        ({columnData, dataKey, rowData}) => {
                            return rowData[dataKey] || 'Unnamed Mesh'
                        }
                    } />
                    <Column label='Refs' dataKey='referenceCount' width={width * .375} />
                    <Column label='Size' dataKey='size' width={width * .15} />
                </Table>
            )}
        </AutoSizer>
    </div>
    )
}

export default MeshTree