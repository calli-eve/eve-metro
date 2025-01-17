import { useEffect, useState } from 'react'
import { Table, Typography, Image } from 'antd'
import { ScannerStats } from '../../data/stats'
import CharRow from '../admin/CharRow'
import { TABLE_BREAKPOINT } from '../../const'

const ScanStats = () => {
    const { Title } = Typography

    const [allTimeScanners, setAllTimeScanners] = useState<ScannerStats[]>([])
    const [loading, setLoading] = useState(false)

    const columns = [
        {
            title: 'Portrait/Logo',
            key: 'entity_id',
            render: (_: unknown, record: ScannerStats) => {
                const url = `${process.env.NEXT_PUBLIC_EVE_IMAGES_API_HOST}/characters/${record.user_id}/portrait?size=64`
                return <Image src={url} />
            },
            responsive: TABLE_BREAKPOINT
        },
        {
            title: 'Character',
            key: 'entity_name',
            render: (_: unknown, record: ScannerStats) => <CharRow id={record.user_id} />
        },
        { title: 'Scanned', dataIndex: 'count', key: 'count' }
    ]

    const fetchAllTimeScanners = () => {
        setLoading(true)
        fetch('/api/stats/all-time')
            .then((res) => res.json())
            .then((res) => setAllTimeScanners(res as ScannerStats[]))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchAllTimeScanners()
    }, [])

    return (
        <>
            <Title level={2} style={{ color: 'white', marginTop: '1rem' }}>
                All time scanners:
            </Title>
            <Table
                dataSource={allTimeScanners.map((a) => {
                    return { ...a, key: a.user_id }
                })}
                loading={loading}
                columns={columns}
                style={{ marginTop: '1rem' }}
            />
        </>
    )
}

export default ScanStats
