import React from 'react'
import styles from './NodeTree.module.css'

import { glNode } from '../../../../types/gltf'
import { AutoSizer, Table, Column } from 'react-virtualized'
import { FormControl, Input, InputLabel, InputAdornment, IconButton } from '@material-ui/core'
import { Search } from '@material-ui/icons'
import { observer, inject } from 'mobx-react'
import { AppState } from '../../../../stores/app.store'
import { useForceUpdate } from '../../../../hooks'

interface INodeTreeProps {
    appState?: AppState
}

const NodeTree: React.FC<INodeTreeProps> = inject('appState')(observer(({ appState }) => {
    const [searchTerm, setSearchTerm] = React.useState<string | undefined>()

    const forceUpdate = useForceUpdate()

    const handleClick = ({event, index, rowData}: {event: React.MouseEvent, index: number, rowData: any}) => {
        appState?.nodeInspector.onNodeSelect(rowData.selfIndex)
    }

    React.useEffect(() => {
        if (appState?.nodeInspector.customIndexFilter == null) return
        setSearchTerm('::custom::')
    }, [appState?.nodeInspector.customIndexFilter])

    React.useEffect(() => {
        console.log('forcing update')
        forceUpdate()
    }, [appState?.nodeInspector.selectedIndex])

    const handleSearchTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (appState?.nodeInspector.customIndexFilter != null)  {
            appState?.nodeInspector.setIndexFilter(undefined)
        }
        setSearchTerm(event.target.value)
    }

    const nodeSearchFilter = (nodes: glNode[], term?: string, customIndexFilter?: number[]) => {
        if (term != null && term !== '::custom::' && term !== '') {
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

    const filteredNodes = nodeSearchFilter(appState?.gltfManager?.gltf?.nodes || [], searchTerm, appState?.nodeInspector.customIndexFilter)

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div>
                <FormControl style={{ width: '100%', marginBottom: '10px' }}>
                    <InputLabel style={{ paddingLeft: '10px' }} htmlFor='node-search-box'>Search Node Names</InputLabel>
                    <Input
                        id='node-search-box'
                        type='text'
                        value={searchTerm}
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
                            noRowsRenderer={() => <div className={styles.noRows}>No rows</div>}
                            rowClassName={ ({index}) => index < 0 ? styles.nodeHeader : styles.nodeRow }
                            rowStyle={ ({index}) => {
                                const style: React.CSSProperties = {}
                                if (index === appState?.nodeInspector.selectedIndex) style['backgroundColor'] = '#e1e1e9'
                                if (filteredNodes[index]?.hierarchy != null) style['paddingLeft'] = `${filteredNodes[index]!.hierarchy! * 10}px`
                                return style
                            }}
                            scrollToIndex={ appState?.nodeInspector.scrollToIndex }
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