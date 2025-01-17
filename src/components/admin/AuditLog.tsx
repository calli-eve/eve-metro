import { useEffect, useState } from 'react'
import { Button, Modal, Table, Typography } from 'antd'
import { AuditLogEntry } from '../../data/audit'
import { DownOutlined } from '@ant-design/icons'
import { JSONTree } from 'react-json-tree'

const AuditLog = () => {
    const { Title } = Typography
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry>(undefined)
    const [auditLogList, setAuditLogList] = useState<AuditLogEntry[]>([])
    const [auditLogPage, setAuditLogPage] = useState(0)
    const [loading, setLoading] = useState(false)
    const columns = [
        { title: 'TS', dataIndex: 'timestamp', key: 'timestamp' },
        {
            title: 'User',
            key: 'user_id',
            render: (_: unknown, record: AuditLogEntry) => {
                return <>{record.user_id}</>
            }
        },
        { title: 'Type', dataIndex: 'type', key: 'type' },
        { title: 'Action', dataIndex: 'action', key: 'action' },
        {
            key: 'action',
            render: (_: unknown, record: AuditLogEntry) => (
                <a
                    className="ant-dropdown-link"
                    onClick={(e) => {
                        e.preventDefault()
                        setSelectedEntry(record)
                        showModal()
                    }}>
                    Meta <DownOutlined />
                </a>
            )
        }
    ]

    const showModal = () => {
        setIsModalVisible(true)
    }

    const handleCancel = () => {
        setIsModalVisible(false)
    }

    useEffect(() => {
        setLoading(true)
        setAuditLogList([])
        fetch('/api/admin/audit', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ page: auditLogPage })
        })
            .then((res) => res.json())
            .then((json) => setAuditLogList(json))
            .finally(() => setLoading(false))
    }, [auditLogPage])

    return (
        <>
            <Title level={2} style={{ color: 'white', marginTop: '1rem' }}>
                Audit log:
            </Title>
            <Modal title="Meta" open={isModalVisible} onCancel={handleCancel}>
                {selectedEntry && <JSONTree data={selectedEntry} />}
            </Modal>
            <Table
                dataSource={auditLogList.map((a) => {
                    return { ...a, key: a.timestamp }
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
                    disabled={auditLogPage < 1}
                    onClick={() => setAuditLogPage(auditLogPage - 1)}>
                    Previous
                </Button>
                <Typography style={{ color: 'white', padding: '0 1rem' }}>
                    {auditLogPage}
                </Typography>
                <Button
                    disabled={auditLogList.length < 10}
                    onClick={() => setAuditLogPage(auditLogPage + 1)}>
                    Next
                </Button>
            </div>
        </>
    )
}

export default AuditLog
