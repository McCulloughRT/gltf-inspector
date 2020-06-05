import React from 'react'
import styles from './Inspector.module.css'

import { IGLTFPackage } from '../../types'
import { Redirect } from 'react-router-dom'
import { glNode, glPrimitive, glMesh } from '../../types/gltf'
import InfoPanel from './InfoPanel/InfoPanel'
import Browser from './Browser/Browser'

interface IInspectorProps {
    gltfPackage?: IGLTFPackage
}

interface IInspectorState {
    selectedItem?: glNode | glMesh
}

export default class Inspector extends React.Component<IInspectorProps,IInspectorState> {
    public state: IInspectorState = {}

    public render() {
        if (this.props.gltfPackage == null) return <Redirect to='/' />
        
        return (
            <div className={ styles.container }>
                <div className={ styles.nodeTree}>
                    <Browser 
                        gltfPackage={this.props.gltfPackage} 
                        onNodeSelect={this.onItemSelect}
                        onMeshSelect={this.onItemSelect}
                    />
                </div>
                <div className={ styles.info }>
                    <InfoPanel 
                        gltf={ this.props.gltfPackage.gltf } 
                        item={ this.state.selectedItem } 
                    />
                </div>
                {/* <div className={ styles.buffer }></div>
                <div className={ styles.viewer }></div> */}
            </div>
        )
    }

    private onItemSelect = (item: glNode | glMesh) => {
        this.setState({ selectedItem: item })
    }
}