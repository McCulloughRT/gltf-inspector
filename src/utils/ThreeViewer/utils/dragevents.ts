export interface IDragHandlers {
    onDragStart: (e: MouseEvent) => any
    onDrag: (e: MouseEvent) => any
    onDragEnd: (e: MouseEvent) => any
    onClick: (e: MouseEvent) => any
    onMouseMove: (e: MouseEvent) => any
}

export default class DragEvents {
    public container: HTMLDivElement
    public dragstart: boolean = true
    public handlers: IDragHandlers

    /**
     *
     */
    constructor(container: HTMLDivElement, handlers: IDragHandlers) {
        this.container = container
        this.handlers = handlers

        this.container.addEventListener('mousedown', this.down)
        this.container.addEventListener('mousemove', this.mouseMove)
    }

    private down = (ev: MouseEvent) => {
        this.container.addEventListener('mousemove', this.dragHandler)
        this.container.addEventListener('mouseup', this.clickHandler)
    }

    private dragHandler = (ev: MouseEvent) => {
        this.container.removeEventListener('mouseup', this.clickHandler)
        this.container.addEventListener('mouseup', this.dragEndHandler)
        if (this.dragstart) {
            this.handlers.onDragStart(ev)
            this.dragstart = false
            return
        }

        this.handlers.onDrag(ev)
    }

    private dragEndHandler = (ev: MouseEvent) => {
        this.container.removeEventListener('mousemove', this.dragHandler)
        this.container.removeEventListener('mouseup', this.dragEndHandler)
        this.dragstart = true
        this.handlers.onDragEnd(ev)
    }

    private clickHandler = (ev: MouseEvent) => {
        this.container.removeEventListener('mousemove', this.dragHandler)
        this.container.removeEventListener('mouseup', this.clickHandler)
        this.handlers.onClick(ev)
    }

    private mouseMove = (ev: MouseEvent) => {
        this.handlers.onMouseMove(ev)
    }
}