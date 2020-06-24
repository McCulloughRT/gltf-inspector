import { 
    WebGLRenderer, Raycaster, Scene, 
    Color, PerspectiveCamera, Vector3, 
    AmbientLight, Vector2, Intersection, 
    Object3D, Mesh, Box3, DirectionalLight,
    LoaderUtils, LoadingManager 
} from 'three'

import OrbitControls from './utils/OrbitControls'
import GLTFLoader from './utils/GLTFLoader/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Evented } from './utils/evented'
import DragEvents from './utils/dragevents'
// import * as THREE from 'three'
import { GLTFThree } from './utils/GLTFLoader/types'
import Stats from 'stats.js'


async function gltfLoaderLocal(url: string, rootPath: string, assetMap: Map<string,File>): Promise<GLTFThree> {
    const baseURL = LoaderUtils.extractUrlBase(url)
    console.log('BASE URL', baseURL)
    return new Promise((resolve, reject) => {
        const manager = new LoadingManager()
        const blobURLs: string[] = []
        manager.setURLModifier((url: string) => {
            // URIs in a glTF file may be escaped, or not. Assume that assetMap is
            // from an un-escaped source, and decode all URIs before lookups.
            // See: https://github.com/donmccurdy/three-gltf-viewer/issues/146
            const normalizedURL = rootPath + decodeURI(url)
              .replace(baseURL, '')
              .replace(/^(\.?\/)/, '')

            console.log('NORM URL', normalizedURL)
    
            if (assetMap.has(normalizedURL)) {
              const blob = assetMap.get(normalizedURL)
              console.log('NORM URL MATCH', normalizedURL, blob)
              const blobURL = URL.createObjectURL(blob)
              blobURLs.push(blobURL)
              return blobURL
            }
            console.log('BLOB URLS', blobURLs)
            return url
        })

        const loader = new GLTFLoader(manager)
        loader.setCrossOrigin('anonymous')

        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('assets/draco/')
        loader.setDRACOLoader(dracoLoader)

        console.log('LOADER URL', url)
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
    public visibleContainer: Object3D = new Object3D()

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

    public Init = (container: HTMLDivElement) => {
        this.container = container

        // Event systems
        this.events = new DragEvents(this.container, {
            onDragStart: this.onDragStart,
            onDrag: this.onDrag,
            onDragEnd: this.onDragEnd,
            onClick: this.onClick,
            onMouseMove: this.onMouseMove
        })

        this.scene.background = new Color(0x444444)
        this.camera = new PerspectiveCamera(50, this.container.clientWidth / this.container.clientHeight, 0.1, 100)
        this.camera.up = new Vector3( 0, 0, 1 )
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

        this.visibleContainer.name = 'visibleContainer'
        this.scene.add(this.visibleContainer)

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

    /**
     * Adapted from https://github.com/donmccurdy/three-gltf-viewer
     */
    public glTFLoadLocal = async (url: string, rootPath: string, assetMap: Map<string,File>) => {
        this.visibleContainer.children = []

        const gltf = await gltfLoaderLocal(url, rootPath, assetMap)

        this.updateCameraToContent(gltf.scene)
        this.addContent(gltf.scene)
        this.updateLights();
        delete gltf.scene
        delete gltf.scenes
        delete gltf.parser

        const sceneCount = this.countMeshes(this.scene, true);
        const visibleCount = this.countMeshes(this.visibleContainer, true);
        console.log(`====== MESH COUNTS ======`)
        console.log(`\tScene Count: ${sceneCount}`)
        console.log(`\tRaycaster Count: ${visibleCount}`)
        console.log(`====== MESH COUNTS ======`)
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
        console.log('ROOT', root)

        this.visibleContainer.add(parsedScene)
    }

    private countMeshes = (root: Object3D, countNonMeshObjects: boolean = false) => {
        let meshCount = 0
        this.traverseWithEscape(root, (obj: Object3D) => {
            if ((obj as Mesh).isMesh === true || countNonMeshObjects) meshCount++
            return true
        })
        return meshCount
    }


    public traverseWithEscape = (object: Object3D, callback: (obj: Object3D) => boolean) => {
        const result = callback(object)
        if (result === false) return // the escape

        for (let i = 0; i < object.children.length; i++) {
            this.traverseWithEscape(object.children[i], callback)
        }
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
            objects = this.visibleContainer.children
        if (options == null) 
            options = { recursive: true, filterSelectable: false }

        this.raycaster.setFromCamera(point, this.camera)
        let intersects = this.raycaster.intersectObjects(objects, options.recursive)

        if (options.filterSelectable) 
            intersects = intersects.filter((intersect: any) => (intersect.object as any).isSelectable === true)
        
        if (intersects.length === 0) return undefined
        return intersects
    }

    public onResize = () => {
        console.log('onResize')
        if (this.container == null) throw new Error('Container does not exist!')
        const { clientWidth, clientHeight } = this.container

        // update the camera
        this.camera.aspect = clientWidth / clientHeight;
        this.camera.updateProjectionMatrix();
        // notify the renderer of its size change
        this.renderer.setSize(clientWidth, clientHeight);
        console.log('onResize end')
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