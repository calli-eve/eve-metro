import { Input } from 'antd'

const FilterWhTable = ({ systemFilter, setSystemFilter }) => {
    return (
        <Input
            placeholder="Filter by Pochven system"
            style={{
                width: '300px',
                marginBottom: '1rem',
                marginRight: '1rem'
            }}
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
        />
    )
}

export default FilterWhTable
