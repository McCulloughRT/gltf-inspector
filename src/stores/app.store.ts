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
    @computed public get selectedItem(): glMesh | undefined {
        if (this.selectedIndex == null) return undefined
        return APP_STATE.gltfManager?.gltf?.meshes[this.selectedIndex]
    }

    @observable public scrollToIndex?: number
    @observable public customIndexFilter?: number[]

    @action public setIndexFilter = (filter?: number[]) => {
        this.customIndexFilter = filter
        APP_STATE.ChangeBrowserTab(1)
    }

    @action public onMeshReferenceClick = (meshIdx: number) => {
        this.scrollToIndex = meshIdx + 5
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
    @computed public get selectedItem(): glNode | undefined {
        if (this.selectedIndex == null) return undefined
        return APP_STATE.gltfManager?.gltf?.nodes[this.selectedIndex]
    }
    // @observable public selectedNode?: glNode
    @observable public scrollToIndex?: number
    @observable public customIndexFilter?: number[]

    @action public onNodeSelect = (nodeIdx: number) => {
        console.log('selected node', nodeIdx)
        this.selectedIndex = nodeIdx
        APP_STATE.infoPanel = InfoPanels.node
    }

    @action public setIndexFilter = (filter?: number[]) => {
        this.customIndexFilter = filter
        APP_STATE.ChangeBrowserTab(0)
    }
}

export class MaterialInspectorState {
    @observable public selectedIndex?: number
    @computed public get selectedItem(): glMaterial | undefined {
        if (this.selectedIndex == null) return undefined
        return APP_STATE.gltfManager?.gltf?.materials[this.selectedIndex]
    }

    @observable public scrollToIndex?: number
    @observable public customIndexFilter?: number[]

    @action public onMaterialReferenceClick = (matIdx: number) => {
        this.scrollToIndex = matIdx + 5
        this.selectedIndex = matIdx

        APP_STATE.ChangeBrowserTab(2)
        APP_STATE.ChangeInfoPanel(InfoPanels.material)
    }

    @action public onMaterialSelect = (matIdx?: number) => {
        console.log('selected material', matIdx)
        this.selectedIndex = matIdx
        APP_STATE.infoPanel = InfoPanels.material
    }

    @action public GoToNodeReferences = (material?: glMaterial) => {
        if (material?.selfIndex == null) throw new Error('Material was not appropriately initialized with a selfIndex reference.')
        const refs = APP_STATE.gltfManager?.GetNodesForMaterial(material.selfIndex)
        const indices: number[] | undefined = refs?.map(r => r.selfIndex).filter(r => r != null) as number[]
        if (indices != null) APP_STATE.nodeInspector.setIndexFilter(indices)
    }

    @action public GoToMeshReferences = (material?: glMaterial) => {
        if (material?.selfIndex == null) throw new Error('Material was not appropriately initialized with a selfIndex reference.')
        const refs = APP_STATE.gltfManager?.GetMeshesForMaterial(material.selfIndex)
        const indices: number[] | undefined = refs?.map(r => r.selfIndex).filter(r => r != null) as number[]
        if (indices != null) APP_STATE.meshInspector.setIndexFilter(indices)   
    }
}

const appState = APP_STATE
export default appState