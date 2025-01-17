import { useEffect, useState } from 'react'
import { Typography } from 'antd'
import { HIGHSEC_GREEN } from '../../const'

const Total = () => {
    const { Title } = Typography

    const [total, setTotal] = useState<number>(undefined)

    useEffect(() => {
        fetch('/api/stats/total-scanned')
            .then((res) => res.json())
            .then((res) => setTotal(res.total))
    }, [])

    return (
        <>
            <Title level={2} style={{ color: 'white', marginTop: '1rem' }}>
                Total sigs scanned: <span style={{ color: HIGHSEC_GREEN }}>{total}</span>
            </Title>
        </>
    )
}

export default Total
