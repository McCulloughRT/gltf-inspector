import React from 'react'
import ThreeViewer from './ThreeViewer'
import { Object3D } from 'three'
import ResizeObserver from 'resize-observer-polyfill'

interface IViewerProps {
    viewer: ThreeViewer
}

export default class Viewer extends React.Component<IViewerProps> {
    private containerRef: React.RefObject<HTMLDivElement> = React.createRef()
    private observer?: ResizeObserver

    public async componentDidMount() {
        const container = this.containerRef.current!
        
        const { viewer } = this.props
        viewer.Init(container)

        viewer.fpsStats.showPanel(0)
        viewer.msStats.showPanel(1)
        viewer.memStats.showPanel(2)
        viewer.callStats.showPanel(3)

        viewer.fpsStats.dom.style.position = 'relative'
        viewer.fpsStats.dom.style.float = 'left'

        viewer.msStats.dom.style.position = 'relative'
        viewer.msStats.dom.style.float = 'left'

        viewer.memStats.dom.style.position = 'relative'
        viewer.memStats.dom.style.float = 'left'

        viewer.callStats.dom.style.position = 'relative'
        viewer.callStats.dom.style.float = 'left'

        const div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.top = '10px'
        div.style.left = '10px'

        div.appendChild(viewer.fpsStats.dom)
        div.appendChild(viewer.msStats.dom)
        div.appendChild(viewer.memStats.dom)
        div.appendChild(viewer.callStats.dom)

        // document.body.appendChild(div)

        this.addResize()

        viewer.on('selection', (ev: { selection: Object3D[] }) => {
            // if (ev.selection && ev.selection.userData.UniqueId) {
            //     viewer.IsolateElements([ev.selection.userData.UniqueId])
            // } else {
            //     viewer.IsolateElements()
            // }
        })
    }

    public componentWillUnmount() {
        this.removeResize()
    }

    render() {
        return (
            <div ref={this.containerRef} style={{ 
                width: '100%', 
                height: '400px',
                overflow: 'hidden'
            }} />
        )
    }

    private addResize = () => {
        const node = this.containerRef.current
        if (node) {
            this.observer = new ResizeObserver((entries: any[]) => {
                // console.log(entries[0].target.clientWidth)
                this.props.viewer.onResize()
            })
            this.observer.observe(node)
        }
    }

    private removeResize = () => {
        const node = this.containerRef.current
        if (node && this.observer) {
            this.observer.unobserve(node)
        }
    }
}