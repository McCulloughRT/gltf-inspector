import React from 'react'
import styles from './MaterialTree.module.css'
import { glMaterial } from '../../../../types/gltf'
import { FormControl, InputLabel, Input, InputAdornment } from '@material-ui/core'
import { Search } from '@material-ui/icons'
import { Table, AutoSizer, Column } from 'react-virtualized'

interface IMaterialTreeProps {
    materials: glMaterial[]
    onMaterialSelect: (material: glMaterial) => void
}

const MaterialTree: React.FC<IMaterialTreeProps> = ({ materials, onMaterialSelect }) => {
    const [selectedIdx, setSelectedIdx] = React.useState<number | undefined>()
    const [searchTerm, setSearchTerm] = React.useState<string | undefined>()

    const handleSearchTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const handleClick = ({event, index, rowData}: {event: React.MouseEvent, index: number, rowData: any}) => {
        const selectedNode = filteredMats[index]
        setSelectedIdx(index)
        onMaterialSelect(selectedNode)
    }

    const matSearchFilter = (mats: glMaterial[], term?: string) => {
        if (term != null) {
            return mats.filter(n => n.name?.includes(term))
        } else return mats
    }

    const filteredMats = matSearchFilter(materials, searchTerm)

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
            <AutoSizer>
                {({height, width}) => (
                    <Table
                        width={ width }
                        height={ height }
                        headerHeight={ 25 }
                        // headerClassName={ styles.nodeHeader }
                        noRowsRenderer={() => <div className={styles.noRows}>No rows</div>}
                        rowClassName={ ({index}) => index < 0 ? styles.nodeHeader : styles.nodeRow }
                        rowStyle={ ({index}) => {
                            const style: React.CSSProperties = {}
                            if (filteredMats[index]?.hierarchy != null) style['paddingLeft'] = `${filteredMats[index].hierarchy! * 25}px`
                            if (index === selectedIdx) style['backgroundColor'] = '#e1e1e9'
                            return style
                        }}
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
    )
}

export default MaterialTree