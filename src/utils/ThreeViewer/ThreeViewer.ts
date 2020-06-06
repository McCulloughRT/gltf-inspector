import { BoxHelper, WebGLRenderer, Raycaster, Scene, Color, PerspectiveCamera, Vector3, PointLight, PointLightHelper, AmbientLight, Vector2, Intersection, Object3D, Sphere, MeshBasicMaterial, Mesh, SphereGeometry, Box3, DirectionalLight, Material, BufferGeometry, Geometry, Matrix4, Plane, PlaneHelper, LoaderUtils, LoadingManager } from 'three'
import OrbitControls from './utils/OrbitControls'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import {GLTF, GLTFLoader as gltfl} from 'three/examples/jsm/loaders/GLTFLoader'
// import GLTFLoader from './utils/gltfLoader'
import GLTFLoader from './utils/GLTFLoader/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Evented } from './utils/evented'
import DragEvents from './utils/dragevents'
import * as THREE from 'three'
// import { SectionBox } from './utils/ResizableCube'
import SelectionManager from './Managers/SelectionManager.simple'
import { GLTFThree } from './utils/GLTFLoader/types'
import Stats from 'stats.js'
import { glMesh, glAccessor, glMaterial, glPrimitive } from '../../types/gltf'
// import TransformManager from './Managers/TransformManager'

async function gltfLoader(url: string): Promise<GLTFThree> {
    return new Promise((resolve,reject) => {
        const loader = new GLTFLoader() as gltfl
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('assets/draco/')
        loader.setCrossOrigin('anonymous')
        loader.setDRACOLoader(dracoLoader)

        loader.load(url, 
            (gltf) => {
                // console.log('gltf resolved')
                resolve(gltf as any)
            },
            xhr => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
            error => {
                console.error('ERROR', error)
                reject(error)
            }
        )
    })
}

async function gltfLoaderLocal(url: string, rootPath: string, assetMap: Map<string,File>): Promise<GLTFThree> {
    const baseURL = LoaderUtils.extractUrlBase(url)
    return new Promise((resolve, reject) => {
        const manager = new LoadingManager()
        const blobURLs = []
        manager.setURLModifier((url: string) => {
            // URIs in a glTF file may be escaped, or not. Assume that assetMap is
            // from an un-escaped source, and decode all URIs before lookups.
            // See: https://github.com/donmccurdy/three-gltf-viewer/issues/146
            const normalizedURL = rootPath + decodeURI(url)
              .replace(baseURL, '')
              .replace(/^(\.?\/)/, '')
    
            if (assetMap.has(normalizedURL)) {
              const blob = assetMap.get(normalizedURL)
              const blobURL = URL.createObjectURL(blob)
              blobURLs.push(blobURL)
              return blobURL
            }
            return url
        })

        const loader = new GLTFLoader(manager)
        loader.setCrossOrigin('anonymous')

        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('assets/draco/')
        loader.setDRACOLoader(dracoLoader)

        loader.load(url,
            gltf => resolve(gltf), 
            xhr => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
            error => reject(error)
        )
    })
}

interface IMaterialToObjectMap {
    [key: string]: Mesh[]
}

export interface IntersectOptions {
    recursive?: boolean
    filterSelectable?: boolean
}

export default class ThreeViewer extends Evented {
    public memStats: Stats = new Stats()
    public fpsStats: Stats = new Stats()
    public msStats: Stats = new Stats()
    public callStats: Stats = new Stats()
    public callPanel = this.callStats.addPanel(new Stats.Panel('c', '#ff8', '#221'))

    public renderer: WebGLRenderer = new WebGLRenderer({antialias: true})
    public raycaster: Raycaster = new Raycaster()
    public scene: Scene = new Scene()
    
    // public pickingScene: Scene = new Scene()
    public raycastingContainer: Object3D = new Object3D()
    public visibleContainer: Object3D = new Object3D()
    // public hideModeContainer: Object3D = new Object3D()

    private hiddenUniqueIds: string[] = []
    private isolatedUniqueIds: string[] = []

    private materialToObject3DMap: IMaterialToObjectMap = { 'Unnamed': [] }
    private elementToFragmentMap: { [key: string]: string[] } = {}
    private elementToMaterialMap: { [key: string]: string[] } = {}

    public sectionBox? = undefined

    public camera: PerspectiveCamera = new PerspectiveCamera()
    public controls?: any
    public id: number = 0
    public container?: HTMLDivElement
    private events?: DragEvents
    public isInitialized: boolean = false

    private background: any
    private content: any = {}
    private lights: any[] = []
    private state = {
        addLights: true,
        exposure: 1.0,
        textureEncoding: 'sRGB',
        ambientIntensity: 0.3,
        ambientColor: 0xFFFFFF,
        directIntensity: 0.8 * Math.PI, // TODO(#116)
        directColor: 0xFFFFFF,
        bgColor1: '#ffffff',
        bgColor2: '#353535'
    }
    
    // private sphereInter: Mesh = new Mesh(new SphereGeometry(.1), new MeshBasicMaterial({ color: 0xffff00 }))

    public selectionManager?: SelectionManager
    // public sectionManager: SectionManager
    // public transformManager: TransformManager

    public Init = (container: HTMLDivElement) => {
        this.container = container
        this.selectionManager = new SelectionManager(this)

        // Event systems
        this.events = new DragEvents(this.container, {
            onDragStart: this.onDragStart,
            onDrag: this.onDrag,
            onDragEnd: this.onDragEnd,
            onClick: this.onClick,
            onMouseMove: this.onMouseMove
        })

        this.scene.background = new Color(0x444444)
        this.camera = new PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 100)
        this.camera.up = new THREE.Vector3( 0, 0, 1 )
        this.scene.add(this.camera)

        this.renderer.physicallyCorrectLights = true;
        (this.renderer as any).gammaOutput = true;
        this.renderer.gammaFactor = 2.2;
        this.renderer.setClearColor( 0xcccccc );
        this.renderer.setPixelRatio( window.devicePixelRatio );

        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
        this.container.appendChild(this.renderer.domElement)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.screenSpacePanning = true

        this.raycastingContainer.name = 'raycastingContainer'
        this.visibleContainer.name = 'visibleContainer'
        // this.hideModeContainer.name = 'hideModeContainer'
        this.scene.add(this.visibleContainer)
        this.scene.add(this.raycastingContainer)

        this.container.addEventListener('resize', this.onResize, false);

        (window as any).scene = this.scene;
        (window as any).bim3 = this;
        this.isInitialized = true
        this.fire('init')
        this.animate()
    }

    constructor() {
        super()
        Object3D.DefaultUp.set(0,0,1)
    }

    public LoadSingleMesh = async (mesh: glMesh, accessors: glAccessor[], material: glMaterial) => {
        
    }

    public LoadSinglePrimitive = async (primitive: glPrimitive, accessors: glAccessor[], material: glMaterial) => {

    }

    /**
     * Adapted from https://github.com/donmccurdy/three-gltf-viewer
     */
    public glTFLoadLocal = async (url: string, rootPath: string, assetMap: Map<string,File>) => {
        this.visibleContainer.children = []
        this.raycastingContainer.children = []

        const gltf = await gltfLoaderLocal(url, rootPath, assetMap)

        this.updateCameraToContent(gltf.scene)
        this.addContent(gltf.scene)
        this.updateLights();
        delete gltf.scene
        delete gltf.scenes
        delete gltf.parser

        const sceneCount = this.countMeshes(this.scene, true);
        const raycasterCount = this.countMeshes(this.raycastingContainer, true);
        console.log(`====== MESH COUNTS ======`)
        console.log(`\tScene Count: ${sceneCount}`)
        console.log(`\tRaycaster Count: ${raycasterCount}`)
        console.log(`====== MESH COUNTS ======`)
        ;(window as any).THREE = THREE;
    }

    public glTFLoad = async (url: string) => {
        // console.log('starting gltf load')
        Object3D.DefaultUp.set(0,0,1)
        const gltf = await gltfLoader(url)
        // console.log('RESOLVE MUST HAVE ALREADY HAPPENED', gltf)
        // console.log('GLTF:',gltf)
        this.updateCameraToContent(gltf.scene)
        this.addContent(gltf.scene)
        this.updateLights();
        delete gltf.scene
        delete gltf.scenes
        delete gltf.parser

        const sceneCount = this.countMeshes(this.scene, true);
        const raycasterCount = this.countMeshes(this.raycastingContainer, true);
        console.log(`====== MESH COUNTS ======`)
        console.log(`\tScene Count: ${sceneCount}`)
        console.log(`\tRaycaster Count: ${raycasterCount}`)
        console.log(`====== MESH COUNTS ======`)
        this.fire('sceneLoaded')
        ;(window as any).THREE = THREE;
    }

    public updateCameraToContent = (content: Object3D) => {
        const box = new Box3().setFromObject(content)
        const size = box.getSize(new Vector3()).length()
        const center = box.getCenter(new Vector3())

        console.log('box', box)
        console.log('size', size)
        console.log('center', center)
        content.position.set(-center.x, -center.y, -center.z)

        this.controls.enabled = false
        this.controls.maxDistance = size * 10;
        this.camera.near = size / 100;
        this.camera.far = size * 100;
        this.camera.updateProjectionMatrix();

        // this.camera.position.copy(center);
        this.camera.position.x += -size / 2.0;
        this.camera.position.z += size / 5.0;
        this.camera.position.y += size / 2.0;
        // this.camera.lookAt(center);
        this.camera.lookAt(new Vector3(0,0,0))
        this.controls.enabled = true
        this.controls.update()
    }

    public addContent = (parsedScene: Scene) => {
        const root = parsedScene.children[0]
        console.log(`root scene count: ${this.countMeshes(root, true)}`)
        console.log(`root scene direct children count: ${root.children.length}`)
        // this.visibleContainer.add(root)
        // this.scene.add(this.visibleContainer)
        
        console.log('ROOT', root)

        // this.raycastingContainer.add(...rootObject.children)
        this.raycastingContainer.add(parsedScene)
        // this.raycastingContainer.visible = false

        // this.processMeshes(parsedScene, false)
        // this.visibleContainer.add(parsedScene)
        // let iterations = 0
        // for (let i = 0; i < root.children.length; i++) {
        //     const child = root.children[i];
        //     this.visibleContainer.add(new Object3D().copy(child))
        //     // console.log(i, root.children[i])
        //     iterations++
        // }
        // console.log(`Completed ${iterations} iterations`)
        // this.processMeshes(root, false, true)
        // this.scene.add(parsedRoot.children[0])
        // this.scene.add(object);
    }

    private processMeshes = (rootObject: Object3D, mergeMesh: boolean = true, allowRaycast: boolean = true) => {
        console.log('processMeshes start')
        // const object = new Object3D()
        if (mergeMesh) {
            this.materialToObject3DMap = this.createMaterialToObject3DMap(rootObject)
            // console.log('materialToObject3DMap created', this.materialToObject3DMap)

            if (allowRaycast) {
                const { elementToFragmentMap, elementToMaterialMap } = this.createElementMaps(rootObject)
                // console.log('Element Maps created', elementToFragmentMap, elementToMaterialMap)
                this.elementToFragmentMap = elementToFragmentMap
                this.elementToMaterialMap = elementToMaterialMap
            }
    
            // console.log('adding to raycasting container')
            if (allowRaycast) {
                for (let i = 0; i < rootObject.children.length; i++) {
                    const child = rootObject.children[i];
                    this.raycastingContainer.add(child)
                }
                // this.raycastingContainer.add(...rootObject.children)
                this.raycastingContainer.visible = false
                // let stdMat = new MeshBasicMaterial()
                // this.raycastingContainer.traverse((obj: Object3D) => {
                //     if ((obj as Mesh).isMesh) {
                //         let mesh = obj as Mesh
                //         if (mesh.material != null) {
                //             mesh.material = stdMat
                //         }
                //     }
                // })
            }
    
            // console.log('adding to visible container')
            const mergedMeshes = this.mergeMeshes(this.materialToObject3DMap)
            for (let i = 0; i < mergedMeshes.length; i++) {
                const mesh = mergedMeshes[i];
                this.visibleContainer.add(mesh)
            }
            // this.visibleContainer.add(...mergedMeshes)
        } else {
            for (let i = 0; i < rootObject.children.length; i++) {
                const child = rootObject.children[i];
                this.visibleContainer.add(child)
            }
            // this.visibleContainer.add(...rootObject.children)
        }

        // object.add(this.visibleContainer)
        // object.add(this.visibleContainer, this.raycastingContainer, this.hideModeContainer)
        console.log('processMeshes return')
        // return object
    }

    public get SelectedUniqueIds(): string[] {
        if (this.selectionManager == null) throw new Error('Selection Manager does not exist!')
        const selection = this.selectionManager.selection
        const ids = selection.map(e => e.userData.UniqueId)
        return ids
    }

    // public get SectionEnabled(): boolean { return false }
    // public get SectionVisible(): boolean { return false }
    // public ToggleSection = (val: boolean) => {
    //     console.log('Toggling section to ', val)
    //     this.sectionBox?.setEnabled(val)
    // }
    // public ToggleSectionVisible = (val: boolean) => {
    //     this.sectionBox?.setVisible(val)
    // }

    // public HideSelected = () => this.HideElements(this.SelectedUniqueIds)
    // public UnhideAll = () => this.HideElements()
    // public HideElements = (UniqueIds?: string[]): void => {
    //     if (UniqueIds == null) {
    //         this.hiddenUniqueIds = []
    //         this.hideModeContainer.children = []
    //         this.hideModeContainer.visible = false
    //         this.visibleContainer.visible = true
    //         return
    //     }

    //     this.hiddenUniqueIds.push(...UniqueIds)

    //     const uuidsToPrune: string[] = []
    //     const materialsToRecombine: string[] = []
    //     for (let i = 0; i < this.hiddenUniqueIds.length; i++) {
    //         const UniqueId = this.hiddenUniqueIds[i];
    //         uuidsToPrune.push(...this.elementToFragmentMap[UniqueId])
    //         materialsToRecombine.push(...this.elementToMaterialMap[UniqueId])
    //     }

    //     const newMaterialToObjectMap: IMaterialToObjectMap = Object.assign({}, this.materialToObject3DMap)

    //     for (let i = 0; i < materialsToRecombine.length; i++) {
    //         const material = materialsToRecombine[i];
    //         const fragments = newMaterialToObjectMap[material]
    //         if (fragments.length === 0) continue

    //         const prunedFragments = fragments.filter(frag => !uuidsToPrune.includes(frag.uuid))
    //         newMaterialToObjectMap[material] = prunedFragments
    //     }

    //     // TODO: only remerge meshes that have changed
    //     const newMeshes = this.mergeMeshes(newMaterialToObjectMap)
    //     this.hideModeContainer.children = []
    //     this.hideModeContainer.add(...newMeshes)

    //     this.hideModeContainer.visible = true
    //     this.visibleContainer.visible = false
    // }

    // public IsolateSelected = () => this.IsolateElements(this.SelectedUniqueIds)
    // public UnisolateAll = () => this.IsolateElements()
    // public IsolateElements = (UniqueIds?: string[]): void => {
    //     if (UniqueIds == null) {
    //         this.isolatedUniqueIds = []
    //         this.hideModeContainer.children = []
    //         this.hideModeContainer.visible = false
    //         this.visibleContainer.visible = true
    //         return
    //     }

    //     this.isolatedUniqueIds.push(...UniqueIds)

    //     const uuidsToKeep: string[] = []
    //     const materialsToCombine: string[] = []
    //     for (let i = 0; i < this.isolatedUniqueIds.length; i++) {
    //         const UniqueId = this.isolatedUniqueIds[i];
    //         uuidsToKeep.push(...this.elementToFragmentMap[UniqueId])
    //         materialsToCombine.push(...this.elementToMaterialMap[UniqueId])
    //     }

    //     const newMaterialToObjectMap: IMaterialToObjectMap = {}
    //     for (let i = 0; i < materialsToCombine.length; i++) {
    //         const material = materialsToCombine[i];
    //         const fragments = this.materialToObject3DMap[material]
    //         if (fragments.length === 0) continue

    //         const prunedFragments = fragments.filter(frag => uuidsToKeep.includes(frag.uuid))
    //         newMaterialToObjectMap[material] = prunedFragments
    //     }

    //     const newMeshes = this.mergeMeshes(newMaterialToObjectMap)
    //     this.hideModeContainer.children = []
    //     this.hideModeContainer.add(...newMeshes)

    //     this.hideModeContainer.visible = true
    //     this.visibleContainer.visible = false
    // }

    private countMeshes = (root: Object3D, countNonMeshObjects: boolean = false) => {
        let meshCount = 0
        this.traverseWithEscape(root, (obj: Object3D) => {
            if ((obj as Mesh).isMesh === true || countNonMeshObjects) meshCount++
            return true
        })
        return meshCount
    }

    private createElementMaps = (rootObject: Object3D) => {
        const t0 = performance.now()

        // key is UniqueId of Revit Element
        // value is list of uuids for Object3D components of the Element
        const elementToFragmentMap: { [key: string]: string[] } = {}

        // key is UniqueId of Revit Element
        // value is list of material names on components of the Element
        const elementToMaterialMap: { [key: string]: string[] } = {}

        this.traverseWithEscape(rootObject, (obj: Object3D) => {
            // if the object is a Element
            if (obj.userData.UniqueId) {
                const key = obj.userData.UniqueId

                const uuids = [obj.uuid]
                const materials = []
                if ((obj as Mesh).material) materials.push(((obj as Mesh).material as Material).name)

                obj.traverse(child => {
                    uuids.push(child.uuid)
                    if ((child as Mesh).material) materials.push(((child as Mesh).material as Material).name)
                })

                elementToFragmentMap[key] = uuids
                elementToMaterialMap[key] = materials

                // Prevent re-traversing the children of this object
                return false
            }
            // recurse on the children of this object
            return true
        })
        
        const t1 = performance.now()
        console.log(`createElementMaps Performance:       ${t1 - t0} ms`)
        return { elementToFragmentMap, elementToMaterialMap }
    }

    public traverseWithEscape = (object: Object3D, callback: (obj: Object3D) => boolean) => {
        const result = callback(object)
        if (result === false) return // the escape

        for (let i = 0; i < object.children.length; i++) {
            this.traverseWithEscape(object.children[i], callback)
        }
    }

    private createMaterialToObject3DMap = (rootObject: Object3D) => {
        const t0 = performance.now()

        const materialToObject3DMap: IMaterialToObjectMap = { 'Unnamed': [] }
        
        rootObject.traverse(obj => {
            if (obj.type === 'Mesh') {
                // console.log('found mesh')
                const mesh = obj as Mesh
                if (mesh.material) {
                    // console.log('found mesh material')
                    const material = mesh.material as Material
                    if (material.name) {
                        // console.log('pushing named material')
                        if (materialToObject3DMap[material.name] == null) materialToObject3DMap[material.name] = []
                        materialToObject3DMap[material.name].push(mesh)
                    } else {
                        // console.log('pushing unnamed material')
                        materialToObject3DMap['Unnamed'].push(mesh)
                    }
                }
            }
        })

        const t1 = performance.now()
        console.log(`createMaterialToObject3DMap Performance:       ${t1 - t0} ms`, materialToObject3DMap)
        return materialToObject3DMap
    }

    private mergeMeshes = (map: IMaterialToObjectMap) => {
        const t0 = performance.now()

        const meshes = []
        const materialNames = Object.keys(map)
        console.log(`Merging on ${materialNames.length} materials.`)
        for (let i = 0; i < materialNames.length; i++) {
            const materialName = materialNames[i];
            const fragments = map[materialName]
            if (fragments.length === 0) continue

            const material = (fragments[0].material as Material).clone()
            // if (!material.name.includes('AM_Glass')) material.visible = false
            const geometryCollection: BufferGeometry[] = []
            for (let j = 0; j < fragments.length; j++) {
                const frag = fragments[j];
                const clonedGeom = frag.geometry.clone() as BufferGeometry
                clonedGeom.applyMatrix4(frag.matrixWorld)
                if (clonedGeom.type !== 'BufferGeometry') throw Error('non buffer geometry')
                geometryCollection.push(clonedGeom);
            }
            const mergedGeometries = BufferGeometryUtils.mergeBufferGeometries(geometryCollection)
            const mergedMesh = new Mesh(mergedGeometries, material)
            meshes.push(mergedMesh)
            geometryCollection.forEach(geom => geom.dispose()) // TODO: does this help?
        }
        const t1 = performance.now()
        console.log(`mergeMeshes Performance:       ${t1 - t0} ms`)
        return meshes
    }

    updateLights = () => {
        const state = this.state;
        const lights = this.lights;

        if (state.addLights && !lights.length) {
            console.log('adding lights')
            this.addLights();
        } else if (!state.addLights && lights.length) {
            console.log('removing lights')
            this.removeLights();
        }

        this.renderer.toneMappingExposure = state.exposure;

        if (lights.length === 2) {
            lights[0].intensity = state.ambientIntensity;
            lights[0].color.setHex(state.ambientColor);
            lights[1].intensity = state.directIntensity;
            lights[1].color.setHex(state.directColor);
        }
    }
    
    addLights = () => {
        const state = this.state;

        // if (this.options.preset === Preset.ASSET_GENERATOR) {
        //     const hemiLight = new THREE.HemisphereLight();
        //     hemiLight.name = 'hemi_light';
        //     this.scene.add(hemiLight);
        //     this.lights.push(hemiLight);
        //     return;
        // }

        const light1  = new AmbientLight(state.ambientColor, state.ambientIntensity);
        light1.name = 'ambient_light';
        this.camera.add( light1 );
        console.log('added light one')

        const light2  = new DirectionalLight(state.directColor, state.directIntensity);
        light2.position.set(0.5, 0, 0.866); // ~60º
        light2.name = 'main_light';
        this.camera.add( light2 );
        console.log('added light two')

        this.lights.push(light1, light2);
    }

    removeLights = () => {
        this.lights.forEach((light: any) => light.parent.remove(light));
        this.lights.length = 0;
    }

    setCamera = ( name: any ) => {
        this.controls.enabled = false;
        this.content.traverse((node: any) => {
            if (node.isCamera && node.name === name) {
                this.camera = node;
            }
        })
    }

    public intersectElements = (point: Vector2): Object3D | undefined => {
        let intersects = this.intersectObjects(point)
        if (intersects && intersects.length > 0) {

            // if the section box is turned on, filter out intersects
            // that fall outside the section box
            // if (this.sectionBox !== undefined && this.sectionBox.isEnabled) {
            //     let insideSectionBox = []
            //     for (let i = 0; i < intersects.length; i++) {
            //         const element = intersects[i];
            //         const pos = element.point
            //         if (
            //             pos.x > this.sectionBox.MinX && pos.x < this.sectionBox.MaxX &&
            //             pos.y > this.sectionBox.MinY && pos.y < this.sectionBox.MaxY &&
            //             pos.z > this.sectionBox.MinZ && pos.z < this.sectionBox.MaxZ
            //         ) {
            //             insideSectionBox.push(intersects[i])
            //         }
            //     }
            //     intersects = insideSectionBox
            // }

            // only return Elements (intersect objects with a UniqueId property)
            // only return objects that are not hidden in the renderContainer
            const filteredIntersects = intersects
            .map(e => {
                if (e.object.userData.UniqueId) return e.object
                else if (e.object.parent) return e.object.parent
                else return undefined
            }).filter(e => {
                return e != null && !this.hiddenUniqueIds.includes(e.userData.UniqueId)
            })

            const closest = filteredIntersects[0]
            return closest
        }
        return undefined
    }

    public intersectObjects = (point: Vector2, objects?: Object3D[], options?: IntersectOptions): Intersection[] | undefined => {
        // return undefined
        if (objects == null) 
            // objects = this.scene.children
            objects = this.raycastingContainer.children
        if (options == null) 
            options = { recursive: true, filterSelectable: false }

        this.raycaster.setFromCamera(point, this.camera)
        let intersects = this.raycaster.intersectObjects(objects, options.recursive)

        if (options.filterSelectable) 
            intersects = intersects.filter((intersect: any) => (intersect.object as any).isSelectable === true)
        
        if (intersects.length === 0) return undefined
        return intersects
    }

    private onResize = () => {
        if (this.container == null) throw new Error('Container does not exist!')
        const { clientWidth, clientHeight } = this.container

        // update the camera
        this.camera.aspect = clientWidth / clientHeight;
        this.camera.updateProjectionMatrix();
        // notify the renderer of its size change
        this.renderer.setSize(clientWidth, clientHeight);
        console.log('resize')
    }

    private beginStats = () => {
        this.fpsStats.begin()
        this.msStats.begin()
        this.memStats.begin()
        this.callStats.begin()
    }

    private endStats = () => {
        this.fpsStats.end()
        this.msStats.end()
        this.memStats.end()
        this.callStats.end()
    }

    private animate = () => {
        this.id = requestAnimationFrame(this.animate);
        this.beginStats()
        this.renderer.render(this.scene, this.camera);
        const calls = this.renderer.info.render.calls
        this.callPanel.update(calls, 5000)
        this.endStats()
        // this.composer.render()
    }

    private normalizeClick = (event: MouseEvent): Vector2 => {
        const x = ( event.clientX / window.innerWidth ) * 2 - 1,
              y = - ( event.clientY / window.innerHeight ) * 2 + 1
        return new Vector2(x, y)
    }

    private onDragStart = (ev: MouseEvent) => {
        const payload = {
            point: this.normalizeClick(ev)
        }

        // TODO: this is here for a future attempt at resetting the control target
        // const intersects = this.intersectObjects(payload.point, undefined, {recursive:true})
        // if (intersects && intersects.length > 0) {
        //     const point = intersects[0].point
        //     // this.controls.target = point
        //     this.controls.update()
        // }

        this.fire('dragstart', payload)
    }
    private onDrag = (ev: MouseEvent) => {
        const payload = {
            point: this.normalizeClick(ev)
        }
        this.fire('drag', payload)
    }
    private onDragEnd = (ev: MouseEvent) => {
        const payload = {
            point: this.normalizeClick(ev)
        }
        this.fire('dragend', payload)
    }
    private onClick = (ev: MouseEvent) => {
        const payload = {
            point: this.normalizeClick(ev),
            event: ev
        }
        if (ev.button === 0) this.fire('click', payload)
        else if (ev.button === 2) this.fire('contextclick', payload)
    }
    private onMouseMove = (ev: MouseEvent) => {
        const payload = {
            point: this.normalizeClick(ev)
        }
        this.fire('move', payload)
    }
}