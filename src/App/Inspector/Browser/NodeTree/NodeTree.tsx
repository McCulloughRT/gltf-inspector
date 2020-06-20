import React from 'react'
import styles from './NodeTree.module.css'

// import { TreeItem, TreeView } from '@material-ui/lab'
// import { ExpandMore, ChevronRight } from '@material-ui/icons'
import { glNode } from '../../../../types/gltf'
import { AutoSizer, Table, Column } from 'react-virtualized'
import { FormControl, Input, InputLabel, InputAdornment, IconButton } from '@material-ui/core'
import { Search } from '@material-ui/icons'
import { observer, inject } from 'mobx-react'
import { AppState } from '../../../../stores/app.store'
// import { SortDirection } from '@material-ui/core'

interface INodeTreeProps {
    appState?: AppState

    // nodes: glNode[]
    // customIndexFilter?: number[]
    // onNodeSelect: (node: glNode) => void
}

const NodeTree: React.FC<INodeTreeProps> = inject('appState')(observer(({ appState }) => {
    const [selectedIdx, setSelectedIdx] = React.useState<number | undefined>()
    const [searchTerm, setSearchTerm] = React.useState<string | undefined>()

    // const node = appState?.nodeInspector.selectedNode
    const nodes = appState?.gltfManager?.gltf?.nodes
    const customIndexFilter = appState?.nodeInspector.customIndexFilterFilter

    React.useEffect(() => {
        if (customIndexFilter == null) return
        setSearchTerm(undefined)
    }, [customIndexFilter])

    const handleSearchTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (customIndexFilter != null) 
        setSearchTerm(event.target.value)
    }

    const handleClick = ({event, index, rowData}: {event: React.MouseEvent, index: number, rowData: any}) => {
        // const selectedNode = filteredNodes[index]
        setSelectedIdx(index)
        appState?.nodeInspector.onNodeSelect(rowData.selfIndex)
        // onNodeSelect(selectedNode)
    }

    const nodeSearchFilter = (nodes?: glNode[], term?: string, customIndexFilter?: number[]) => {
        if (nodes == null) return []
        if (term != null) {
            return nodes.filter(n => n.name?.includes(term))
        } else if (customIndexFilter != null) {
            let output: glNode[] = []
            for (let i = 0; i < customIndexFilter.length; i++) {
                const idx = customIndexFilter[i];
                const node = nodes.find(n => n.selfIndex === idx)
                if (node != null) output.push(node)
            }
            return output
        } else return nodes
    }

    const filteredNodes = nodeSearchFilter(nodes, searchTerm, customIndexFilter)

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div>
                <FormControl style={{ width: '100%', marginBottom: '10px' }}>
                    <InputLabel style={{ paddingLeft: '10px' }} htmlFor='node-search-box'>Search Node Names</InputLabel>
                    <Input
                        id='node-search-box'
                        type='text'
                        onChange={handleSearchTextChange}
                        style={{ paddingLeft: '10px' }}
                        endAdornment={
                            <InputAdornment position='end'>
                                <Search />
                            </InputAdornment>
                        }
                    />
                </FormControl>
            </div>
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
                                if (filteredNodes[index]?.hierarchy != null) style['paddingLeft'] = `${filteredNodes[index].hierarchy! * 25}px`
                                if (index === selectedIdx) style['backgroundColor'] = '#e1e1e9'
                                return style
                            }}
                            rowHeight={ 25 }
                            rowCount={ filteredNodes.length }
                            rowGetter={ ({index}) => filteredNodes[index] }
                            onRowClick={ handleClick }
                        >
                            <Column label='Idx' dataKey='selfIndex' width={width * .1} />
                            <Column label='Name' dataKey='name' width={width * .75} />
                            <Column label='Size' dataKey='size' width={width * .15} />
                        </Table>
                    )}
                </AutoSizer>
            </div>
        </div>
    )
}))

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