import React from 'react'
import styles from './App.module.css'

import {
    BrowserRouter as Router,
    Switch,
    Route
} from 'react-router-dom'
import Dropper from './Dropper/Dropper'
import { IGLTFPackage, IFilePackage } from '../types'
import Inspector from './Inspector/Inspector'
import { glTF, glNode, glMesh, glPrimitive, glBuffer } from '../types/gltf'
import { GLTFManager } from '../utils/GLTFManager/GLTFManager'

interface IAppProps {

}

interface IAppState {
    gltfManager?: GLTFManager
}

export default class App extends React.Component<IAppProps,IAppState> {
    public state: IAppState = {
        gltfManager: undefined
    }
    public render() {
        return (
            <Router>
                <Switch>
                    <Route path='/model'>
                        <Inspector gltfManager={this.state.gltfManager} />
                    </Route>
                    <Route path='/'>
                        <Dropper onFileLoad={ this.onFileLoad } />
                    </Route>
                </Switch>
            </Router>
        )
    }

    private onFileLoad = async (filePackage: IFilePackage) => {
        console.log(filePackage)
        const mgr = new GLTFManager(
            filePackage.rootFile,
            filePackage.rootPath || '/',
            filePackage.fileMap
        )
        await mgr.ParseGltf()
        this.setState({ gltfManager: mgr })
    }
}