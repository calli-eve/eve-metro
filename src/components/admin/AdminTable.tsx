import { useEffect, useState } from 'react'
import { Table, Image, Typography, Dropdown, Menu, Input } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import {
    ESIAlliance,
    ESICharacter,
    ESICorporation,
    getAlliance,
    getCharacter,
    getCorporation
} from '../../data/esiClient'
import { AllowedEntity } from '../../pages/api/admin/allowed'
import AddAllowed from './AddAllowed'
import AuditLog from './AuditLog'
import TodoTable from './TodoTable'
import RegisterWallet from './RegisterWallet'
import WalletTransactions from './WalletTransactions'
import RegisterEmailBot from './RegisterEmailBot'
import { TABLE_BREAKPOINT } from '../../const'

export interface ExtendedAllowedEntity extends AllowedEntity {
    name: string
}

const AdminTable = () => {
    const { Title } = Typography

    const [adminUsers, setAdminUsers] = useState([])
    const [allowed, setAllowed] = useState([])
    const [filterAllowed, setFilterAllowed] = useState('')

    const removeAllowed = (input: ExtendedAllowedEntity) => {
        fetch('/api/admin/allowed', {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ ...input })
        }).then(() => fetchAllowedList())
    }

    const menu = (record: ExtendedAllowedEntity) => (
        <Menu>
            <Menu.Item
                onClick={() => {
                    removeAllowed({ ...record })
                }}
                danger>
                Delete
            </Menu.Item>
        </Menu>
    )

    const columnsAdmin = [
        {
            title: 'Portrait',
            key: 'id',
            render: (_: unknown, record) => (
                <Image
                    src={`${process.env.NEXT_PUBLIC_EVE_IMAGES_API_HOST}/characters/${record.id}/portrait?size=64`}
                />
            ),
            responsive: TABLE_BREAKPOINT
        },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Id', dataIndex: 'id', key: 'id' }
    ]

    const columnsAllowed = [
        {
            title: 'Portrait/Logo',
            key: 'entity_id',
            render: (_: unknown, record: ExtendedAllowedEntity) => {
                const url = resolveEntityImage(record)
                return <Image src={url} />
            },
            responsive: TABLE_BREAKPOINT
        },
        {
            title: 'Name',
            key: 'name',
            render: (_: unknown, record: ExtendedAllowedEntity) => {
                return (
                    <div>
                        <a
                            title="Click to copy to clipboard"
                            className="ant-dropdown-link"
                            onClick={() => {
                                navigator.clipboard.writeText(`${record.name}`)
                            }}>
                            {record.name}
                        </a>
                        <div>{record.entity_id}</div>
                    </div>
                )
            }
        },
        { title: 'Level', dataIndex: 'level', key: 'level' },
        { title: 'Untill', dataIndex: 'valid_untill', key: 'valid_untill' },
        {
            key: 'action',
            render: (_: unknown, record: ExtendedAllowedEntity) => (
                <Dropdown overlay={menu(record)}>
                    <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
                        Modify <DownOutlined />
                    </a>
                </Dropdown>
            )
        }
    ]

    const adminCharacterDataSource = async () => {
        const adminUserIds = await fetch('/api/admin').then((res) => res.json())
        const characters = await Promise.all(
            adminUserIds.map(async (id) => {
                const char = await getCharacter(id)
                return { ...char, id }
            })
        )
        return characters
    }

    const resolveEntity = async (
        a: AllowedEntity
    ): Promise<ESICharacter | ESICorporation | ESIAlliance> => {
        switch (a.type) {
            case 'Character':
                return await getCharacter(a.entity_id)
            case 'Alliance':
                return await getAlliance(a.entity_id)
            case 'Corporation':
                return await getCorporation(a.entity_id)
        }
    }

    const resolveEntityImage = (a: AllowedEntity): string => {
        switch (a.type) {
            case 'Character':
                return `${process.env.NEXT_PUBLIC_EVE_IMAGES_API_HOST}/characters/${a.entity_id}/portrait?size=64`
            case 'Alliance':
                return `${process.env.NEXT_PUBLIC_EVE_IMAGES_API_HOST}/alliances/${a.entity_id}/logo?size=64`
            case 'Corporation':
                return `${process.env.NEXT_PUBLIC_EVE_IMAGES_API_HOST}/corporations/${a.entity_id}/logo?size=64`
        }
    }

    const allowedDataSource = async () => {
        const allowedList: AllowedEntity[] = await fetch('/api/admin/allowed').then((res) =>
            res.json()
        )
        const extended = await Promise.all(
            allowedList.map(async (a): Promise<ExtendedAllowedEntity> => {
                const entity = await resolveEntity(a)
                return {
                    ...a,
                    name: entity ? entity.name : `${a.type}: ${a.entity_id}`
                }
            })
        )
        return extended
    }

    const fetchAllowedList = () => {
        allowedDataSource().then(setAllowed).catch(console.log)
    }

    useEffect(() => {
        adminCharacterDataSource().then(setAdminUsers).catch(console.log)
        fetchAllowedList()
    }, [])

    return (
        <>
            <Title className="white-text" level={2}>
                Allowed entities:
            </Title>
            <Input
                placeholder="Filter by name"
                style={{
                    width: '300px',
                    marginBottom: '1rem',
                    marginRight: '1rem'
                }}
                value={filterAllowed}
                onChange={(e) => setFilterAllowed(e.target.value)}
            />
            <AddAllowed refresh={fetchAllowedList} />
            <Table
                dataSource={allowed
                    .map((a) => {
                        return { ...a, key: a.entity_id }
                    })
                    .filter(
                        (a: ExtendedAllowedEntity) =>
                            a.name.toLowerCase().indexOf(filterAllowed.toLowerCase()) !== -1
                    )}
                columns={columnsAllowed}
            />
            <TodoTable />
            <WalletTransactions />
            <AuditLog />
            <Title className="white-text" level={2}>
                Admin users:
            </Title>
            <Table
                dataSource={adminUsers.map((a) => {
                    return { ...a, key: a.id }
                })}
                columns={columnsAdmin}
                pagination={false}
            />
            <RegisterWallet />
            <RegisterEmailBot />
        </>
    )
}

export default AdminTable
