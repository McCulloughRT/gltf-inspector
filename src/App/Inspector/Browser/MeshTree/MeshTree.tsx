import React from 'react'
import styles from './MeshTree.module.css'
import { glMesh, glPrimitive } from '../../../../types/gltf'
import { AutoSizer, List, Table, Column } from 'react-virtualized'
import { FormControl, InputLabel, Input, InputAdornment } from '@material-ui/core'
import { Search } from '@material-ui/icons'
import { AppState } from '../../../../stores/app.store'
import { observer, inject } from 'mobx-react'
import { useForceUpdate } from '../../../../hooks'

interface IMeshTreeProps {
    appState?: AppState

    // meshes: glMesh[]
    // customIndexFilter?: number[]
    // scrollToIndex?: number
    // onMeshSelect: (mesh: glMesh) => void
}

const MeshTree: React.FC<IMeshTreeProps> = inject('appState')(observer(({ appState }) => {
    // const [selectedIdx, setSelectedIdx] = React.useState<number | undefined>()
    const [searchTerm, setSearchTerm] = React.useState<string | undefined>()

    const forceUpdate = useForceUpdate()

    const handleClick = ({event, index, rowData}: {event: React.MouseEvent, index: number, rowData: any}) => {
        // setSelectedIdx(index)
        appState?.meshInspector.onMeshSelect(rowData.selfIndex)
    }

    React.useEffect(() => {
        if (appState?.meshInspector.customIndexFilter == null) return
        setSearchTerm(undefined)
    }, [appState?.meshInspector.customIndexFilter])

    React.useEffect(() => {
        console.log('forcing update')
        forceUpdate()
    }, [appState?.meshInspector.selectedIndex])

    // React.useEffect(() => {
    //     if (scrollToIndex != null) {
    //         setSelectedIdx(scrollToIndex)
    //         onMeshSelect(meshes[scrollToIndex])
    //     }
    // }, [scrollToIndex])

    const handleSearchTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (appState?.meshInspector.customIndexFilter != null) 
        setSearchTerm(event.target.value)
    }

    const meshSearchFilter = (meshes: glMesh[], term?: string, customIndexFilter?: number[]) => {
        if (term != null) {
            return meshes.filter(n => n.name?.includes(term))
        } else if (customIndexFilter != null) {
            let output: glMesh[] = []
            for (let i = 0; i < customIndexFilter.length; i++) {
                const idx = customIndexFilter[i];
                const node = meshes.find(n => n.selfIndex === idx)
                if (node != null) output.push(node)
            }
            return output
        } else return meshes
    }

    const filteredMeshes = meshSearchFilter(appState?.gltfManager?.gltf?.meshes || [], searchTerm, appState?.meshInspector.customIndexFilter)

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div>
                <FormControl style={{ width: '100%', marginBottom: '10px' }}>
                    <InputLabel style={{ paddingLeft: '10px' }} htmlFor='node-search-box'>Search Node Names</InputLabel>
                    <Input
                        id='node-search-box'
                        type='text'
                        value={searchTerm}
                        onChange={handleSearchTextChange}
                        style={{ paddingLeft: '10px' }}
                        endAdornment={
                            <InputAdornment position='end'>
                                <Search />
                            </InputAdornment>
                        }
                    />
                </FormControl>
            </div>
            <div style={{ height: '100%' }}>
                <AutoSizer>
                    {({height, width}) => (
                        <Table
                            width={ width }
                            height={ height }
                            headerHeight={ 25 }
                            noRowsRenderer={() => <div className={styles.noRows}>No rows</div>}
                            rowClassName={ ({index}) => index < 0 ? styles.meshHeader : styles.meshRow }
                            rowStyle={ ({index}) => {
                                const style: React.CSSProperties = {}
                                if (index === appState?.meshInspector.selectedIndex) style['backgroundColor'] = '#e1e1e9'
                                return style
                            }}
                            scrollToIndex={ appState?.meshInspector.meshScrollToIndex }
                            rowHeight={ 25 }
                            rowCount={ filteredMeshes.length }
                            rowGetter={ ({index}) => filteredMeshes[index] }
                            onRowClick={ handleClick }
                        >
                            <Column label='Idx' dataKey='selfIndex' width={width * .1} />
                            <Column label='Name' dataKey='name' width={width * .375} cellDataGetter={
                                ({columnData, dataKey, rowData}) => {
                                    return rowData[dataKey] || `Unnamed Mesh #${rowData.selfIndex}`
                                }
                            } />
                            <Column label='Refs' dataKey='referenceCount' width={width * .375} />
                            <Column label='Size' dataKey='size' width={width * .15} />
                        </Table>
                    )}
                </AutoSizer>
            </div>
        </div>
    )
}))

export default MeshTree