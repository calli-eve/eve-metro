import { useEffect, useState } from 'react'
import { Table, Typography } from 'antd'
import { TodoItem } from '../../data/todo'
import CharRow from './CharRow'

const AuditLog = () => {
    const { Title } = Typography
    const [todoList, setTodoList] = useState<TodoItem[]>([])
    const [loading, setLoading] = useState(false)
    const columns = [
        {
            title: 'Character',
            key: 'entity_name',
            render: (_: unknown, record: TodoItem) => <CharRow id={record.entity_id} />
        },
        { title: 'Type', dataIndex: 'type', key: 'type' },
        { title: 'Level', dataIndex: 'level', key: 'level' },
        { title: 'Created', dataIndex: 'created_at', key: 'created_at' },
        { title: 'Action', dataIndex: 'action', key: 'action' },
        {
            key: 'completed',
            render: (_: unknown, record: TodoItem) => (
                <a
                    className="ant-dropdown-link"
                    onClick={(e) => {
                        e.preventDefault()
                        removeTodo(record)
                    }}>
                    Done!
                </a>
            )
        }
    ]

    const fetchTodoList = () => {
        setLoading(true)
        fetch('/api/admin/todo')
            .then((res) => res.json())
            .then((res) => setTodoList(res as TodoItem[]))
            .finally(() => setLoading(false))
    }

    const removeTodo = (record: TodoItem) => {
        fetch('/api/admin/todo', {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...record })
        }).then(fetchTodoList)
    }

    useEffect(() => {
        fetchTodoList()
    }, [])

    return (
        <>
            <Title level={2} style={{ color: 'white', marginTop: '1rem' }}>
                Todo list:
            </Title>
            <Table
                dataSource={todoList.map((a) => {
                    return { ...a, key: a.id }
                })}
                loading={loading}
                columns={columns}
                style={{ marginTop: '1rem' }}
            />
        </>
    )
}

export default AuditLog
