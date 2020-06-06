import { Vector2, Object3D, BoxHelper, Color } from 'three'
import Bim3Viewer from '../ThreeViewer'

export default class SelectionManager {
    private bim3: Bim3Viewer
    public selection: Object3D[] = []
    public subSelectionIndex?: Object3D
    public selectionBoundsContainer: Object3D = new Object3D()
    public hoverBoundsContainer: Object3D = new Object3D()

    public allowInteractiveHover: boolean = true
    private _allowInteractiveHoverInternal: boolean = true
    public allowSelection: boolean = true

    /**
     *
     */
    constructor(bim3: Bim3Viewer) {
        this.bim3 = bim3
        this.bim3.scene.add(this.selectionBoundsContainer)
        this.bim3.scene.add(this.hoverBoundsContainer)
        bim3.on('click', this.onClick)
        bim3.on('move', this.onMove)

        bim3.on('dragstart', () => {
            this.setHoverBounds()
            this._allowInteractiveHoverInternal = false
        })
        bim3.on('dragend', () => {
            this._allowInteractiveHoverInternal = true
        })
    }

    private setSelectionBounds = (elements: Object3D[]) => {
        this.selectionBoundsContainer.children = []
        if (elements.length > 0) {
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                const box = new BoxHelper(element, new Color(0x0055ff))
                this.selectionBoundsContainer.add(box)   
            }
        }
    }

    private setHoverBounds = (element?: Object3D) => {
        this.hoverBoundsContainer.children = []
        if (element) {
            const box = new BoxHelper(element, new Color(0xffff00))
            this.hoverBoundsContainer.add(box)
        }
    }

    private onMove = (event: { point: Vector2 }) => {
        if (this.allowInteractiveHover && this._allowInteractiveHoverInternal) {
            const element = this.bim3.intersectElements(event.point)
            this.setHoverBounds(element)
        }
    }

    private onClick = (event: any) => {
        if (this.allowSelection) {
            const isShift = event.event.shiftKey
            const element = this.bim3.intersectElements(event.point)

            if (isShift) {
                if (element) {
                    this.selection.push(element)
                    if ((this.selection as any).onSelect) (this.selection as any).onSelect()
                } else this.selection = []
            } else {
                if (this.selection.length > 0) {
                    for (let i = 0; i < this.selection.length; i++) {
                        const selection = this.selection[i];
                        if ((selection as any).onDeselect) (selection as any).onDeselect()
                    }
                }

                if (element) {
                    this.selection = [element]
                    for (let i = 0; i < this.selection.length; i++) {
                        const selection = this.selection[i];
                        if ((selection as any).onSelect) (selection as any).onSelect()
                    }
                } else this.selection = []
            }
    
            this.setSelectionBounds(this.selection)
    
            console.log({ selection: this.selection })
            this.bim3.fire('selection', { selection: this.selection })
        }
    }
}