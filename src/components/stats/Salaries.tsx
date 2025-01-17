import { useEffect, useState } from 'react'
import { Table, Typography, Image, Button } from 'antd'
import { DateTime } from 'luxon'
import CharRow from '../admin/CharRow'
import { SalaryData, ScannerStatsWithSalary } from '../../data/wallet'
import { startAndEndDateForPeriod } from '../../utils'
import { TABLE_BREAKPOINT } from '../../const'

const ScanStats = () => {
    const { Title } = Typography

    const [loading, setLoading] = useState(false)
    const [selectedPeriod, setSelectedPeriod] = useState(0)
    const [salaryData, setSalaryData] = useState<SalaryData>(undefined)

    const columns = [
        {
            title: 'Portrait/Logo',
            key: 'entity_id',
            render: (_: unknown, record: ScannerStatsWithSalary) => {
                const url = `${process.env.NEXT_PUBLIC_EVE_IMAGES_API_HOST}/characters/${record.user_id}/portrait?size=64`
                return <Image src={url} />
            },
            responsive: TABLE_BREAKPOINT
        },
        {
            title: 'Character',
            key: 'entity_name',
            render: (_: unknown, record: ScannerStatsWithSalary) => <CharRow id={record.user_id} />
        },
        { title: 'Scanned', dataIndex: 'count', key: 'count' },
        {
            title: 'Salary',
            key: 'salary',
            render: (_: unknown, record: ScannerStatsWithSalary) => (
                <a
                    title="Copy to clipboard"
                    onClick={() => {
                        navigator.clipboard.writeText(`${record.salary}`)
                    }}>
                    {record.salary.toLocaleString()}
                </a>
            )
        }
    ]

    const fetchAllTimeScanners = () => {
        setLoading(true)
        fetch('/api/stats/salaries', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ selectedPeriod })
        })
            .then((res) => res.json())
            .then((res) => setSalaryData(res as SalaryData))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchAllTimeScanners()
    }, [selectedPeriod])

    const { startDateForPeriod, endDateForPeriod } = startAndEndDateForPeriod(selectedPeriod)
    return (
        <>
            <Title level={2} style={{ color: 'white', marginTop: '1rem' }}>
                Scan salaries for period{' '}
                {DateTime.fromISO(startDateForPeriod, { zone: 'utc' }).toISODate()} to{' '}
                {DateTime.fromISO(endDateForPeriod, { zone: 'utc' }).toISODate()}:
            </Title>
            <Button
                onClick={() => {
                    setSelectedPeriod(selectedPeriod + 1)
                }}>
                Previous period
            </Button>{' '}
            <Button
                onClick={() => {
                    setSelectedPeriod(selectedPeriod - 1)
                }}
                disabled={selectedPeriod === 0}>
                Next period
            </Button>
            {salaryData && (
                <div style={{ marginTop: '1rem' }}>
                    Total ISK for period: {salaryData.totalSalaries.toLocaleString()}
                </div>
            )}
            {salaryData && <div>Total sigs scanned for period: {salaryData.totalSigsScanned}</div>}
            {salaryData && (
                <div>
                    Current ISK / sig:{' '}
                    {Math.floor(
                        salaryData.totalSalaries / salaryData.totalSigsScanned
                    ).toLocaleString()}{' '}
                </div>
            )}
            <Table
                dataSource={salaryData?.scansWithSalaries.map((a) => {
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
