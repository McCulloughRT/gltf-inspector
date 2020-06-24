import React from 'react'
import styles from './Inspector.module.css'

import { Redirect } from 'react-router-dom'
import InfoPanel from './InfoPanel/InfoPanel'
import Browser from './Browser/Browser'
import { inject, observer } from 'mobx-react'
import { AppState, InfoPanels } from '../../stores/app.store'
import TwoColumnFlex from '../_components/TwoColumnFlex/TwoColumnFlex'

interface IInspectorProps {
    appState?: AppState
}

const Inspector: React.FC<IInspectorProps> = inject('appState')(observer(({ appState}) => {
    if (
        appState?.gltfManager == null ||
        appState?.gltfManager.gltf == null
    ) return <Redirect to='/' />

    return (
        <TwoColumnFlex 
            columnOne = {(
                <div className={ styles.nodeTree}>
                    <div className={ styles.columnTitle }>
                        <div>glTF Browser</div>
                    </div>
                    <Browser />
                </div>
            )}
            columnTwo={(
                <div className={ styles.info }>
                    <div className={ styles.columnTitle }>
                        <div>{ getInfoMessage(appState?.infoPanel) }</div>
                    </div>
                    <InfoPanel />
                </div>
            )}
            allowDrag={ true }
            defaultLeftWidth={ window.innerWidth / 2 }
        />
        // <div className={ styles.container }>
        //     <div className={ styles.nodeTree}>
        //         <div style={{ height: '40px' }}>glTF Browser</div>
        //         <Browser />
        //     </div>
        //     <div className={ styles.info }>
        //         <div style={{ height: '40px' }}>{ getInfoMessage(appState?.infoPanel) }</div>
        //         <InfoPanel />
        //     </div>
        // </div>
    )
}))

function getInfoMessage(panelType?: InfoPanels): string {
    switch(panelType) {
        case InfoPanels.node: return 'Node Information'
        case InfoPanels.mesh: return 'Mesh Information'
        case InfoPanels.material: return 'Material Information'
        case InfoPanels.default: 
        default: return 'glTF Information'
    }
}

export default Inspector