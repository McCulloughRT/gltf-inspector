import React from 'react'
import styles from './Inspector.module.css'

import { IGLTFPackage } from '../../types'
import { Redirect } from 'react-router-dom'
import { glNode, glPrimitive, glMesh, glMaterial } from '../../types/gltf'
import InfoPanel from './InfoPanel/InfoPanel'
import Browser from './Browser/Browser'
import { GLTFManager } from '../../utils/GLTFManager/GLTFManager'

interface IInspectorProps {
    gltfManager?: GLTFManager
}

interface IInspectorState {
    selectedItem?: glNode | glMesh | glMaterial
    meshScrollToIndex?: number
    nodeTreeIndexFilter?: number[]
    meshTreeIndexFilter?: number[]
}

export default class Inspector extends React.Component<IInspectorProps,IInspectorState> {
    public state: IInspectorState = {}

    public render() {
        if (
            this.props.gltfManager == null ||
            this.props.gltfManager.gltf == null
        ) {
            console.log('returning / redirect')
            return <Redirect to='/' />
        }
        
        return (
            <div className={ styles.container }>
                <div className={ styles.nodeTree}>
                    <Browser 
                        gltfManager={this.props.gltfManager} 
                        onNodeSelect={this.onItemSelect}
                        nodeTreeIndexFilter={this.state.nodeTreeIndexFilter}
                        onMeshSelect={this.onItemSelect}
                        meshScrollToIndex={this.state.meshScrollToIndex}
                        onMaterialSelect={ this.onItemSelect }
                    />
                </div>
                <div className={ styles.info }>
                    <InfoPanel 
                        gltfManager={ this.props.gltfManager } 
                        item={ this.state.selectedItem } 
                        onMeshScrollTo={this.onMeshScrollTo}
                        setNodeTreeIndexFilter={ this.setNodeTreeIndexFilter }
                        setMeshTreeIndexFilter={ this.setMeshTreeIndexFilter }
                    />
                </div>
                {/* <div className={ styles.buffer }></div>
                <div className={ styles.viewer }></div> */}
            </div>
        )
    }

    private setNodeTreeIndexFilter = (indices?: number[]) => {
        this.setState({ nodeTreeIndexFilter: indices })
    }

    private setMeshTreeIndexFilter = (indices?: number[]) => {
        this.setState({ meshTreeIndexFilter: indices })
    }

    private onMeshScrollTo = (index: number) => {
        this.setState({ meshScrollToIndex: index })
    }

    private onItemSelect = (item: glNode | glMesh | glMaterial) => {
        this.setState({ selectedItem: item })
    }
}