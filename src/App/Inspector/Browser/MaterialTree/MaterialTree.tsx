import React from 'react'
import styles from './MaterialTree.module.css'
import { glMaterial } from '../../../../types/gltf'
import { FormControl, InputLabel, Input, InputAdornment } from '@material-ui/core'
import { Search } from '@material-ui/icons'
import { Table, AutoSizer, Column } from 'react-virtualized'
import { AppState } from '../../../../stores/app.store'
import { observer, inject } from 'mobx-react'
import { useForceUpdate } from '../../../../hooks'

interface IMaterialTreeProps {
    appState?: AppState
}

const MaterialTree: React.FC<IMaterialTreeProps> = inject('appState')(observer(({ appState }) => {
    const [searchTerm, setSearchTerm] = React.useState<string | undefined>()

    const forceUpdate = useForceUpdate()

    const handleClick = ({event, index, rowData}: {event: React.MouseEvent, index: number, rowData: any}) => {
        appState?.materialInspector.onMaterialSelect(rowData.selfIndex)
    }

    React.useEffect(() => {
        if (appState?.materialInspector.customIndexFilter == null) return
        setSearchTerm('::custom::')
    }, [appState?.materialInspector.customIndexFilter])

    React.useEffect(() => {
        forceUpdate()
    }, [appState?.materialInspector.selectedIndex])

    const handleSearchTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const matSearchFilter = (mats: glMaterial[], term?: string, customIndexFilter?: number[]) => {
        if (term != null && term !== '::custom::') {
            return mats.filter(n => n.name?.includes(term))
        } else if (customIndexFilter != null) {
            let output: glMaterial[] = []
            for (let i = 0; i < customIndexFilter.length; i++) {
                const idx = customIndexFilter[i];
                const mat = mats.find(m => m.selfIndex === idx)
                if (mat != null) output.push(mat)
            }
            return output
        } else return mats
    }

    const filteredMats = matSearchFilter(appState?.gltfManager?.gltf?.materials || [], searchTerm, appState?.materialInspector.customIndexFilter)

    return (
        <div style={{ height: '100%' }}>
            <div>
                <FormControl style={{ width: '100%', marginBottom: '10px' }}>
                    <InputLabel style={{ paddingLeft: '10px' }} htmlFor='node-search-box'>Search Material Names</InputLabel>
                    <Input
                        id='node-search-box'
                        type='text'
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
                            rowClassName={ ({index}) => index < 0 ? styles.nodeHeader : styles.nodeRow }
                            rowStyle={ ({index}) => {
                                const style: React.CSSProperties = {}
                                if (index === appState?.materialInspector.selectedIndex) style['backgroundColor'] = '#e1e1e9'
                                return style
                            }}
                            scrollToIndex={ appState?.materialInspector.scrollToIndex }
                            rowHeight={ 25 }
                            rowCount={ filteredMats.length }
                            rowGetter={ ({index}) => filteredMats[index] }
                            onRowClick={ handleClick }
                        >
                            <Column label='Idx' dataKey='selfIndex' width={width * .1} />
                            <Column label='Name' dataKey='name' width={width * .75} />
                            <Column label='Refs' dataKey='referenceCount' width={width * .15} />
                        </Table>
                    )}
                </AutoSizer>
            </div>
        </div>
    )
}))

export default MaterialTree