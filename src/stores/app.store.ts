import { observable, action, computed } from 'mobx'
import { GLTFManager } from "../utils/GLTFManager/GLTFManager";
import { glNode, glMaterial, glMesh } from '../types/gltf';

export enum InfoPanels {
    node = 'node',
    mesh = 'mesh',
    material = 'material',
    default = 'default'
}

export class AppState {
    @observable public gltfManager?: GLTFManager

    @observable public browserTab: number = 0
    @action public ChangeBrowserTab = (tab: number) => {
        this.browserTab = tab
    }
    @observable public infoPanel: InfoPanels = InfoPanels.default
    @action public ChangeInfoPanel = (panel: InfoPanels) => {
        this.infoPanel = panel
    }

    @observable public meshInspector: MeshInspectorState = new MeshInspectorState()
    @observable public nodeInspector: NodeInspectorState = new NodeInspectorState()
    @observable public materialInspector: MaterialInspectorState = new MaterialInspectorState()
}
const APP_STATE = new AppState()

export class MeshInspectorState {
    @observable public selectedIndex?: number
    @computed public get selectedMesh(): glMesh | undefined {
        if (this.selectedIndex == null) return undefined
        return APP_STATE.gltfManager?.gltf?.meshes[this.selectedIndex]
    }

    @observable public meshScrollToIndex?: number
    @observable public customIndexFilter?: number[]

    @action public setIndexFilter = (filter?: number[]) => {
        this.customIndexFilter = filter
    }

    @action public onMeshReferenceClick = (meshIdx: number) => {
        this.meshScrollToIndex = meshIdx + 5
        this.selectedIndex = meshIdx
        // this.selectedMesh = APP_STATE.gltfManager?.gltf?.meshes[meshIdx]
        APP_STATE.ChangeBrowserTab(1)
        APP_STATE.ChangeInfoPanel(InfoPanels.mesh)
    }

    @action public GoToNodeReferences = (mesh?: glMesh) => {
        if (mesh?.selfIndex == null) throw new Error('Mesh was not appropriately initialized with a selfIndex reference.')
        const refs = APP_STATE.gltfManager?.GetNodesFromMesh(mesh.selfIndex)
        const indices: number[] | undefined = refs?.map(r => r.selfIndex).filter(r => r != null) as number[]
        if (indices != null) APP_STATE.nodeInspector.setIndexFilter(indices)
    }

    @action public onMeshSelect = (meshIdx?: number) => {
        console.log('selected mesh', meshIdx)
        this.selectedIndex = meshIdx
        APP_STATE.infoPanel = InfoPanels.mesh
    }
}

export class NodeInspectorState {
    @observable public selectedIndex?: number
    @computed public get selectedNode(): glNode | undefined {
        if (this.selectedIndex == null) return undefined
        return APP_STATE.gltfManager?.gltf?.nodes[this.selectedIndex]
    }
    // @observable public selectedNode?: glNode
    @observable public nodeScrollToIndex?: number
    @observable public customIndexFilterFilter?: number[]

    @action public onNodeSelect = (nodeIdx: number) => {
        console.log('selected node', nodeIdx)
        this.selectedIndex = nodeIdx
        APP_STATE.infoPanel = InfoPanels.node
    }

    @action public setIndexFilter = (filter?: number[]) => {
        this.customIndexFilterFilter = filter
    }
}

export class MaterialInspectorState {
    @observable public selectedMaterial?: glMaterial
    @observable public matScrollToIndex?: number
    @observable public customIndexFilterFilter?: number[]

    @action public onMaterialSelect = (mat?: glMaterial) => {
        console.log('selected material', mat)
        this.selectedMaterial = mat
        APP_STATE.infoPanel = InfoPanels.material
    }
}

const appState = APP_STATE
export default appState