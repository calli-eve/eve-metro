import { useEffect, useState } from 'react'
import { Button, Table, Typography } from 'antd'
import { PaymentsLogEntry } from '../../data/wallet'
import CharRow from './CharRow'

const WalletTransactions = () => {
    const { Title } = Typography
    const [paymentsLogList, setPaymentsLogList] = useState<PaymentsLogEntry[]>([])
    const [paymentsLogPage, setPaymentsLogPage] = useState(0)
    const [loading, setLoading] = useState(false)
    const columns = [
        { title: 'Date', dataIndex: 'date', key: 'date' },
        {
            title: 'Source',
            key: 'paying_id',
            render: (_: unknown, record: PaymentsLogEntry) => <CharRow id={record.paying_id} />
        },
        { title: 'Amount', dataIndex: 'amount', key: 'amount' },
        {
            title: 'Processed',
            key: 'processed',
            render: (_: unknown, record: PaymentsLogEntry) => (
                <>{record.processed ? 'True' : 'False'}</>
            )
        }
    ]

    useEffect(() => {
        setLoading(true)
        setPaymentsLogList([])
        fetch('/api/admin/transactions', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ page: paymentsLogPage })
        })
            .then((res) => res.json())
            .then((json) => setPaymentsLogList(json))
            .finally(() => setLoading(false))
    }, [paymentsLogPage])

    return (
        <>
            <Title level={2} style={{ color: 'white', marginTop: '1rem' }}>
                Payments log:
            </Title>
            <Table
                dataSource={paymentsLogList.map((a) => {
                    return { ...a, key: a.id }
                })}
                loading={loading}
                columns={columns}
                pagination={false}
            />
            <div
                style={{
                    marginTop: '1rem',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                }}>
                <Button
                    disabled={paymentsLogPage < 1}
                    onClick={() => setPaymentsLogPage(paymentsLogPage - 1)}>
                    Previous
                </Button>
                <Typography style={{ color: 'white', padding: '0 1rem' }}>
                    {paymentsLogPage}
                </Typography>
                <Button
                    disabled={paymentsLogList.length < 10}
                    onClick={() => setPaymentsLogPage(paymentsLogPage + 1)}>
                    Next
                </Button>
            </div>
        </>
    )
}

export default WalletTransactions
