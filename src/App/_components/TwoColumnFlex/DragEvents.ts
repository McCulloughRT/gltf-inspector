export interface IDragHandlers {
    onDragStart?: (e: MouseEvent) => any
    onDrag?: (e: MouseEvent) => any
    onDragEnd?: (e: MouseEvent) => any
    onClick?: (e: MouseEvent) => any
}

export default class DragEvents {
    public container?: HTMLDivElement
    public globalListen: boolean = false

    public dragstart: boolean = true
    public handlers: IDragHandlers

    /**
     *
     */
    constructor(handlers: IDragHandlers) {
        this.handlers = handlers
    }

    public subscribe = (container: HTMLDivElement, globalListen: boolean = false) => {
        this.container = container
        this.globalListen = globalListen
        this.container.addEventListener('mousedown', this.down)
    }

    public unsubscribe = () => {
        this.container?.removeEventListener('mousedown', this.down)
    }


    private down = (ev: MouseEvent) => {
        console.log('mousedown')

        if (this.globalListen) {
            window.addEventListener('mouseup', this.clickHandler)
            window.addEventListener('mousemove', this.dragHandler)
        } else {
            this.container?.addEventListener('mouseup', this.clickHandler)
            this.container?.addEventListener('mousemove', this.dragHandler)
        }
    }

    private dragHandler = (ev: MouseEvent) => {
        if (this.globalListen) {
            window.removeEventListener('mouseup', this.clickHandler)
            window.addEventListener('mouseup', this.dragEndHandler)
        } else {
            this.container?.removeEventListener('mouseup', this.clickHandler)
            this.container?.addEventListener('mouseup', this.dragEndHandler)
        }

        if (this.dragstart) {
            if (this.handlers.onDragStart != null) this.handlers.onDragStart(ev)
            this.dragstart = false
            return
        }
        ev.preventDefault()
        if (this.handlers.onDrag != null) this.handlers.onDrag(ev)
    }

    private dragEndHandler = (ev: MouseEvent) => {
        if (this.globalListen) {
            window.removeEventListener('mousemove', this.dragHandler)
            window.removeEventListener('mouseup', this.dragEndHandler)
        } else {
            this.container?.removeEventListener('mousemove', this.dragHandler)
            this.container?.removeEventListener('mouseup', this.dragEndHandler)
        }

        this.dragstart = true
        if (this.handlers.onDragEnd != null) this.handlers.onDragEnd(ev)
    }

    private clickHandler = (ev: MouseEvent) => {
        if (this.globalListen) {
            window.removeEventListener('mousemove', this.dragHandler)
            window.removeEventListener('mouseup', this.clickHandler)
        } else {
            this.container?.removeEventListener('mousemove', this.dragHandler)
            this.container?.removeEventListener('mouseup', this.clickHandler)
        }

        if (this.handlers.onClick != null) this.handlers.onClick(ev)
    }
}