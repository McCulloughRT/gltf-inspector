import React from 'react'
import styles from './NodeTree.module.css'

// import { TreeItem, TreeView } from '@material-ui/lab'
// import { ExpandMore, ChevronRight } from '@material-ui/icons'
import { glNode } from '../../../../types/gltf'
import { AutoSizer, Table, Column } from 'react-virtualized'
// import { SortDirection } from '@material-ui/core'

interface INodeTreeProps {
    nodes: glNode[]
    onNodeSelect: (node: glNode) => void
}

const NodeTree: React.FC<INodeTreeProps> = ({ nodes, onNodeSelect }) => {
    const [selectedIdx, setSelectedIdx] = React.useState<number | undefined>()

    const handleClick = ({event, index, rowData}: {event: React.MouseEvent, index: number, rowData: any}) => {
        setSelectedIdx(index)
        onNodeSelect(nodes[index])
    }

    return (
        <div style={{ height: '100%' }}>
            <AutoSizer>
                {({height, width}) => (
                    <Table
                        width={ width }
                        height={ height }
                        headerHeight={ 25 }
                        // headerClassName={ styles.nodeHeader }
                        noRowsRenderer={() => <div className={styles.noRows}>No rows</div>}
                        rowClassName={ ({index}) => index < 0 ? styles.nodeHeader : styles.nodeRow }
                        rowStyle={ ({index}) => {
                            const style: React.CSSProperties = {}
                            if (nodes[index]?.hierarchy != null) style['paddingLeft'] = `${nodes[index].hierarchy! * 25}px`
                            if (index === selectedIdx) style['backgroundColor'] = '#e1e1e9'
                            return style
                        }}
                        rowHeight={ 25 }
                        rowCount={ nodes.length }
                        rowGetter={ ({index}) => nodes[index] }
                        onRowClick={ handleClick }
                    >
                        <Column label='Idx' dataKey='selfIndex' width={width * .1} />
                        <Column label='Name' dataKey='name' width={width * .75} />
                        <Column label='Size' dataKey='size' width={width * .15} />
                    </Table>
                )}
            </AutoSizer>
        </div>
    )
}

export default NodeTree

// const structureNodes = (nodes: glNode[]): glRecursiveNode[] => {
//     // mark self indices
//     nodes.forEach((node,i) => node['selfIndex'] = i)

//     const getChildrenRecursive = (node: glNode): glRecursiveNode => {
//         if (node.children == null || node.children.length === 0) {
//             return {...node, selfIndex: node.selfIndex!, children: undefined }
//         }

//         const recNode: glRecursiveNode = { ...node, selfIndex: node.selfIndex!, children: [] }
//         const childNodes = nodes.filter((n,i) => node.children!.includes(i))
//         for (let i = 0; i < childNodes.length; i++) {
//             const child = childNodes[i];
//             recNode.children!.push(getChildrenRecursive(child))
//         }
//         return recNode
//     }

//     // find all child nodes
//     let childIndices: number[] = []
//     for (let i = 0; i < nodes.length; i++) {
//         const node = nodes[i];
//         if (node.children != null && node.children.length > 0) {
//             childIndices.push(...node.children)
//         }
//     }

//     let topLevel: glRecursiveNode[] = []
//     for (let i = 0; i < nodes.length; i++) {
//         if (!childIndices.includes(i)) {
//             const tlNode = nodes[i]
//             const recNode = getChildrenRecursive(tlNode)
//             topLevel.push(recNode)
//         }
//     }

//     return topLevel
// }