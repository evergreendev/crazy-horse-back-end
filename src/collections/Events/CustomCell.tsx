import React from 'react'
import type {Props} from 'payload/components/views/Cell'

const baseClass = 'custom-cell'

interface ExtendedProps extends Props {
    handleUp: (id:string|number) => void;
    handleDown: (id:string|number) => void;
}

const CustomCell: React.FC<ExtendedProps> = (props) => {

    const {cellData, rowData, handleDown, handleUp} = props

    // @ts-ignore
    return <span className={baseClass}><button onClick={() => handleDown(rowData.id)}>v</button>
        {cellData}
        <button onClick={() => handleUp(rowData.id)}>^</button></span>
}

export default CustomCell;
