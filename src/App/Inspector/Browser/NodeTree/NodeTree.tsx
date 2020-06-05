import React from 'react'
import styles from './NodeTree.module.css'

import { TreeItem, TreeView } from '@material-ui/lab'
import { ExpandMore, ChevronRight } from '@material-ui/icons'
import { glNode } from '../../../../types/gltf'
// import { glRecursiveNode } from '../../../../types'
import { AutoSizer, List, Table, Column } from 'react-virtualized'
import { SortDirection } from '@material-ui/core'

interface INodeTreeProps {
    nodes: glNode[]
    onNodeSelect: (node: glNode) => void
}

interface INodeTreeState {

}

export default class NodeTree extends React.Component<INodeTreeProps, INodeTreeState> {
    public state: INodeTreeState = {}

    public render() {
        // const orderedNodes = this.orderNodes([...this.props.nodes])
        // console.log(orderedNodes)

        // const structNodes = this.structureNodes(this.props.nodes)
        // const tree = structNodes.length === 1 ? structNodes[0] : { name: 'rootNode', children: structNodes, selfIndex: 0 }
        // console.log('STRUCT NODES', structNodes)

        // const renderTree = (nodes: glRecursiveNode) => (
        //     <TreeItem 
        //         key={nodes.name} 
        //         nodeId={nodes.name} 
        //         label={`${nodes.selfIndex}: ${nodes.name}`}
        //         onLabelClick={ () => this.props.onNodeSelect(this.props.nodes[nodes.selfIndex]) }
        //     >
        //         {Array.isArray(nodes.children) ? nodes.children.map(node => renderTree(node)) : null}
        //     </TreeItem>
        // )
        const rowRenderer = this.rowRendererFn(this.props.nodes, 25)

        return (
            <div style={{ height: '100%' }}>
                <AutoSizer>
                    {({height, width}) => (
                        // <List 
                        //     width={ width }
                        //     height={ height }
                        //     rowCount={ this.props.nodes.length }
                        //     rowHeight={ 25 }
                        //     rowRenderer={ rowRenderer }
                        // />
                        <Table
                            width={ width }
                            height={ height }
                            headerHeight={ 25 }
                            // headerClassName={ styles.nodeHeader }
                            noRowsRenderer={() => <div className={styles.noRows}>No rows</div>}
                            rowClassName={ ({index}) => index < 0 ? styles.nodeHeader : styles.nodeRow }
                            rowStyle={ ({index}) => {
                                const leftPad = (this.props.nodes[index]?.hierarchy || 0) * 25
                                return { paddingLeft: `${leftPad}px`}
                            }}
                            rowHeight={ 25 }
                            rowCount={ this.props.nodes.length }
                            rowGetter={ ({index}) => this.props.nodes[index] }
                            onRowClick={ ({event, index, rowData}) => this.props.onNodeSelect(this.props.nodes[index]) }
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

    private rowRendererFn = (list: any[], padding: number) => (rowRenderingProps: {
        key: string,
        index: number,
        isScrolling: boolean,
        isVisible: boolean,
        style: React.CSSProperties
    }) => {
        const item: glNode = list[rowRenderingProps.index]
        const leftPad = item.hierarchy! * padding
        const customStyle: React.CSSProperties = {...rowRenderingProps.style, paddingLeft: `${leftPad}px`}
        return (
            <div key={rowRenderingProps.key} onClick={() => this.props.onNodeSelect(item) } className={ styles.nodeRow } style={customStyle}>
                <div className={ styles.nodeRowText }>{ `${item.selfIndex}:   ${item.name}` }</div>
            </div>
        )
    }

    // private orderNodes = (nodes: glNode[]): glNode[] => {
    //     // mark self indices and init heirarchy
    //     nodes.forEach((node,i) => {
    //         node['selfIndex'] = i
    //         node.type = 'node'
    //     })

    //     let count = 0
    //     const markNodes = (node: glNode, hierarchy: number): void => {
    //         node.hierarchy = hierarchy
    //         node.order = count
    //         count++

    //         if (node.children == null || node.children.length === 0) {
    //             return
    //         }

    //         hierarchy++
    //         for (let i = 0; i < node.children.length; i++) {
    //             const childIdx = node.children[i];
    //             nodes[childIdx].hierarchy = hierarchy
    //             markNodes(nodes[childIdx], hierarchy)
    //         }
    //     }
        
    //     for (let i = 0; i < nodes.length; i++) {
    //         const node = nodes[i];
    //         if (node.order != null) continue
    //         markNodes(node, 0)
    //     }

    //     return nodes.sort((a,b) => {
    //         if (a.order! > b.order!) return 1
    //         else if (a.order! < b.order!) return -1
    //         return 0
    //     })
    // }

    // private structureNodes = (nodes: glNode[]): glRecursiveNode[] => {
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
}