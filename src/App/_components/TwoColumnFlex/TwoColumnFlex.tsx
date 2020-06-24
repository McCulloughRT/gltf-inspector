import React from 'react'
import DragEvents from './DragEvents'

interface ITwoColumnFlexProps {
    columnOne: JSX.Element
    columnTwo: JSX.Element
    allowDrag?: boolean
    defaultLeftWidth?: number
    gapWidth?: number
    gapStyle?: React.CSSProperties
}
const TwoColumnFlex: React.FC<ITwoColumnFlexProps> = (props) => {
    const gapWidth = props.gapWidth ? props.gapWidth : 3
    const gapStyle = props.gapStyle ? props.gapStyle : { backgroundColor: '#888' }

    const [leftWidthState, setLeftWidthState] = React.useState<number | undefined>(props.defaultLeftWidth)
    const leftWidth = leftWidthState === undefined ? 'auto' : leftWidthState + 'px'
    const containerStyle: React.CSSProperties = {
        display: 'grid',
        height: '100vh',
        overflow: 'hidden',
        gridTemplateColumns: `${leftWidth} ${gapWidth}px calc(100vw - ${leftWidth} - ${gapWidth}px)`
    };

    const ref = React.useCallback(node => {
        if (props.allowDrag && node != null) {
            new DragEvents({
                onDragStart: (e: MouseEvent) => console.log('dragStart', e),
                onDrag: (e: MouseEvent) => {
                    console.log('drag', e)
                    setLeftWidthState(e.clientX - (gapWidth / 2))
                },
                onDragEnd: (e: MouseEvent) => console.log('dragEnd', e),
                onClick: () => console.log('click'),
            }).subscribe(node, true)
        }
    },[])

    return (
        <div style={ containerStyle }>
            { props.columnOne }
            <div ref={ref} style={{
                width: '100%',
                height: '100%',
                cursor: 'ew-resize',
                ...gapStyle
            }} />
            { props.columnTwo }
        </div>
    )
}

export default TwoColumnFlex