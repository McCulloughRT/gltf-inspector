import React from 'react'
import styles from './Inspector.module.css'

import { IGLTFPackage } from '../../types'
import { Redirect } from 'react-router-dom'
import { glNode, glPrimitive, glMesh } from '../../types/gltf'
import InfoPanel from './InfoPanel/InfoPanel'
import Browser from './Browser/Browser'
import { GLTFManager } from '../../utils/GLTFManager/GLTFManager'

interface IInspectorProps {
    gltfManager?: GLTFManager
}

interface IInspectorState {
    selectedItem?: glNode | glMesh
    meshScrollToIndex?: number
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
                        onMeshSelect={this.onItemSelect}
                        meshScrollToIndex={this.state.meshScrollToIndex}
                    />
                </div>
                <div className={ styles.info }>
                    <InfoPanel 
                        gltfManager={ this.props.gltfManager } 
                        item={ this.state.selectedItem } 
                        onMeshScrollTo={this.onMeshScrollTo}
                    />
                </div>
                {/* <div className={ styles.buffer }></div>
                <div className={ styles.viewer }></div> */}
            </div>
        )
    }

    private onMeshScrollTo = (index: number) => {
        this.setState({ meshScrollToIndex: index })
    }

    private onItemSelect = (item: glNode | glMesh) => {
        this.setState({ selectedItem: item })
    }
}