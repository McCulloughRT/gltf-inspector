import React from 'react'
import styles from './InfoPanel.module.css'

import { glMesh, glPrimitive, glNode, glMaterial } from '../../../types/gltf'
import { GLTFManager } from '../../../utils/GLTFManager/GLTFManager';
import NodePanel from './NodePanel/NodePanel';
import MeshPanel from './MeshPanel/MeshPanel';
import MaterialPanel from './MaterialPanel/MaterialPanel';
import { AppState, InfoPanels } from '../../../stores/app.store';
import { inject, observer } from 'mobx-react';

interface IInfoPanelProps {
    appState?: AppState
}

const InfoPanel: React.FC<IInfoPanelProps> = inject('appState')(observer(({ appState }) => {
    return (
        <div className={ styles.container }>
            { getPanel(appState?.infoPanel) }
        </div>
    )
}))

function getPanel(panelState?: InfoPanels): JSX.Element {
    switch(panelState) {
        case InfoPanels.node: return <NodePanel />
        case InfoPanels.mesh: return <MeshPanel />
        // case InfoPanels.material: return <MaterialPanel />
        case InfoPanels.default:
        default: return <div />
    }
}

export default InfoPanel