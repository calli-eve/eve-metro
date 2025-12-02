import { Table, Menu, Dropdown, Button, Tooltip, Checkbox, Select } from 'antd'
import { DownOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { DateTime } from 'luxon'

import { PochvenConnectionInput, SimpleSystem, TrigConnection } from '../../types/types'
import AddConnection from '../map/AddConnection'
import EditConnection from '../map/EditConnection'
import FilterWhTable from './FilterWhTable'
import { TrigData } from '../../state/TrigDataContainer'
import { useContext, useEffect, useState } from 'react'
import { Session } from '../../state/SessionContainer'
import CharRow from '../admin/CharRow'
import { Connection } from '../../types/trig'
import { calcRoute } from '../../data/esiClient'
import { TABLE_BREAKPOINT, TRIG_SYSTEM_IDS } from '../../const'
import { SortOrder } from 'antd/lib/table/interface'

const getDiffUntillDeath = (record: TrigConnection): { diffHours: number; diffMinutes: number } => {
    const timeOfDeath = record.timeCriticalTime
        ? DateTime.fromISO(record.timeCriticalTime).plus({ hours: 3 })
        : DateTime.fromISO(record.createdTime).plus({ hours: 15, minutes: 30 })
    const timeOfDeathShort = record.timeCriticalTime
        ? DateTime.fromISO(record.timeCriticalTime).plus({ hours: 3 })
        : DateTime.fromISO(record.createdTime).plus({ hours: 11, minutes: 30 })
    const timeNow = DateTime.now()
    const diffHours =
        record.externalWormholeType === 'C729' || record.pochvenWormholeType === 'C729'
            ? Math.floor(timeOfDeathShort.diff(timeNow, 'hours').hours)
            : Math.floor(timeOfDeath.diff(timeNow, 'hours').hours)
    const diffMinutes =
        record.externalWormholeType === 'C729' || record.pochvenWormholeType === 'C729'
            ? Math.floor(timeOfDeathShort.diff(timeNow, 'minutes').minutes) - diffHours * 60
            : Math.floor(timeOfDeath.diff(timeNow, 'minutes').minutes) - diffHours * 60
    return {
        diffHours,
        diffMinutes
    }
}

const WormholeTable = ({ fetchRoutes }) => {
    const trigStorage = useContext(TrigData)
    const session = useContext(Session)
    const [selectedForEdit, setSelectedForEdit] = useState<TrigConnection | undefined>(undefined)
    const [systemFilter, setSystemFilter] = useState('')
    const [filterExpired, setFilterExpired] = useState(false)
    const [selectedSystem, setSelectedSystem] = useState<SimpleSystem>(undefined)
    const [jumpsToSystem, setJumpsToSystem] = useState<{ start: number; jumps: string }[]>([])

    const { Option } = Select

    useEffect(() => {
        setSelectedSystem(trigStorage.systems.find((sys) => sys.solarSystemId === 30000142))
    }, [])

    useEffect(() => {
        if (!trigStorage.trigData || !selectedSystem || !fetchRoutes) return

        const jumpsPromises = Promise.allSettled<{ start: number; jumps: string }[]>(
            trigStorage.trigData.connections
                .filter((connection: Connection) => {
                    const isWormhole = connection.externalSystemName?.match(/J[0-9]{6}$/) || connection.externalSystemName === 'Thera'
                    const isPochven = TRIG_SYSTEM_IDS.includes(connection.externalSystemId as number)
                    return !isWormhole && !isPochven
                })
                .map(async (connection: Connection) => {
                    return {
                        start: connection.externalSystemId,
                        jumps: await calcRoute(
                            selectedSystem.solarSystemId,
                            connection.externalSystemId
                        )
                    }
                })
        )

        jumpsPromises.then((res) => {
            const jumps = res.map((r) => {
                if (r.status === 'fulfilled') return r.value
                else return undefined
            })
            setJumpsToSystem(jumps)
        })
    }, [trigStorage.trigData, selectedSystem])

    const menu = (record: TrigConnection) => {
        return (
            <Menu>
                <Menu.Item
                    onClick={() => {
                        setSelectedForEdit(
                            trigStorage.trigData.connections?.find((t) => t.id === record.id)
                        )
                    }}>
                    Edit
                </Menu.Item>
                <Menu.Item
                    onClick={() => {
                        removeConnection({ connectionId: record.id })
                    }}
                    danger>
                    Delete
                </Menu.Item>
                {getDiffUntillDeath(record).diffHours < 4 ||
                    (!record.timeCritical && (
                        <Menu.Item
                            onClick={() => {
                                setConnectionCritical({ connectionId: record.id })
                            }}>
                            Set time critical
                        </Menu.Item>
                    ))}
                <Menu.Item
                    onClick={() => {
                        resetConnectionExpired(record)
                    }}>
                    Reset connection expired
                </Menu.Item>
            </Menu>
        )
    }

    const copyPasta = (record: TrigConnection, pochvenSide: boolean) => {
        if (pochvenSide) {
            navigator.clipboard.writeText(
                `${record.pochvenSignature} ${record.externalSystemName} ${record.pochvenWormholeType} `
            )
        } else {
            navigator.clipboard.writeText(
                `${record.externalSignature} ${record.pochvenSystemName} ${record.externalWormholeType} `
            )
        }
    }

    const columns = [
        { title: 'Name', dataIndex: 'comment', key: 'comment', responsive: TABLE_BREAKPOINT },
        {
            title: 'P name',
            key: 'pochvenSystemName',
            render: (_: unknown, record: TrigConnection) => {
                return (
                    <a
                        onClick={() => copyPasta(record, true)}
                        title={`Click to copy bookmark text for ${record.pochvenSystemName} side`}>
                        {record.pochvenSystemName}
                    </a>
                )
            },
            sorter: (a, b) => a.pochvenSystemName.localeCompare(b.pochvenSystemName),
            defaultSortOrder: 'ascend' as SortOrder
        },
        {
            title: 'P sig',
            key: 'pochvenSignature',
            render: (_: unknown, record: TrigConnection) => {
                return (
                    <a
                        onClick={() => copyPasta(record, true)}
                        title={`Click to copy bookmark text for ${record.pochvenSystemName} side`}>
                        {record.pochvenSignature}
                    </a>
                )
            },
            responsive: TABLE_BREAKPOINT
        },
        {
            title: 'E name',
            key: 'externalSystemName',
            render: (_: unknown, record: TrigConnection) => {
                return (
                    <a
                        onClick={() => copyPasta(record, false)}
                        title={`Click to copy bookmark text for ${record.externalSystemName} side`}>
                        {record.externalSystemName}
                    </a>
                )
            },
            sorter: (a, b) => a.externalSystemName.localeCompare(b.externalSystemName)
        },
        {
            title: 'E sig',
            key: 'externalSignature',
            render: (_: unknown, record: TrigConnection) => {
                return (
                    <a
                        onClick={() => copyPasta(record, false)}
                        title={`Click to copy bookmark text for ${record.externalSystemName} side`}>
                        {record.externalSignature}
                    </a>
                )
            },
            responsive: TABLE_BREAKPOINT
        },
        {
            title: 'Creator',
            key: 'creator',
            render: (_: unknown, record: TrigConnection) => {
                return record.creator ? <CharRow id={record.creator} showId={false} /> : undefined
            },
            responsive: TABLE_BREAKPOINT
        },
        {
            title: 'Life',
            key: 'time',
            render: (_: unknown, record: TrigConnection) => {
                const diff = getDiffUntillDeath(record)
                return (
                    <div className={diff.diffHours < 4 ? 'critical' : 'normal'}>
                        {diff.diffHours}h {diff.diffMinutes}m
                    </div>
                )
            }
        },
        {
            title: 'Jumps',
            key: 'jumps',
            render: (_: unknown, record: TrigConnection) => {
                const systemsWithJumps = jumpsToSystem.find(
                    (j) => j.start === record.externalSystemId
                )
                return <div>{systemsWithJumps ? systemsWithJumps.jumps.length : '--'}</div>
            },
            responsive: TABLE_BREAKPOINT
        },
        {
            title: 'Last seen / Expired (UTC)',
            key: 'last_seen',
            render: (_: unknown, record: TrigConnection) => {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {record.last_seen
                            ? DateTime.fromISO(record.last_seen)
                                  .toUTC()
                                  .toFormat('yyyy-LL-dd HH:mm:ss')
                            : DateTime.fromISO(record.updated_at)
                                  .toUTC()
                                  .toFormat('yyyy-LL-dd HH:mm:ss')}
                        <div style={{ color: 'red' }}>
                            {record.already_expired_reports
                                ? `WH Expired reports: ${record.already_expired_reports.length}`
                                : ''}
                        </div>
                        <div>
                            <Tooltip title="Click if WH is still there">
                                <Button onClick={() => setLastSeen(record)}>
                                    <EyeOutlined />
                                </Button>
                            </Tooltip>
                            <Tooltip title="Click if connection is no longer available">
                                <Button onClick={() => reportConnectionExpired(record)}>
                                    <EyeInvisibleOutlined />
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                )
            },
            responsive: TABLE_BREAKPOINT
        },
        {
            key: 'action',
            render: (_: unknown, record: TrigConnection) => (
                <Dropdown overlay={menu(record)}>
                    <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
                        Modify <DownOutlined />
                    </a>
                </Dropdown>
            ),
            responsive: TABLE_BREAKPOINT
        }
    ]

    const removeConnection = (input: PochvenConnectionInput) => {
        fetch('/api/data/trig', {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ ...input })
        }).then(() => trigStorage.fetchTrigMap())
    }

    const setConnectionCritical = (input: PochvenConnectionInput) => {
        fetch('/api/data/trig', {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ ...input })
        }).then(() => trigStorage.fetchTrigMap())
    }

    const setLastSeen = (input: TrigConnection) => {
        fetch('/api/data/trig-last-seen', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ ...input })
        }).then(() => trigStorage.fetchTrigMap())
    }

    const reportConnectionExpired = (input: TrigConnection) => {
        fetch('/api/data/trig-connection-expired', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ ...input })
        }).then(() => trigStorage.fetchTrigMap())
    }

    const resetConnectionExpired = (input: TrigConnection) => {
        fetch('/api/data/trig-connection-expired', {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ ...input })
        }).then(() => trigStorage.fetchTrigMap())
    }

    if (!trigStorage?.trigData) return <></>
    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    marginTop: '1rem',
                    alignItems: 'center'
                }}>
                {session?.character?.level === 3 && <AddConnection />}
                <Button
                    style={{ marginBottom: '1rem', marginRight: '1rem' }}
                    onClick={() => {
                        trigStorage.fetchTrigMap()
                    }}>
                    Refresh
                </Button>
                <FilterWhTable systemFilter={systemFilter} setSystemFilter={setSystemFilter} />
                {selectedForEdit && (
                    <EditConnection
                        refresh={trigStorage.fetchTrigMap}
                        selectedForEdit={selectedForEdit}
                        setSelectedForEdit={setSelectedForEdit}
                    />
                )}
                <Checkbox
                    style={{
                        color: 'white',
                        display: 'flex',
                        marginBottom: '1rem',
                        marginRight: '1rem'
                    }}
                    checked={filterExpired}
                    onChange={() => setFilterExpired(!filterExpired)}>
                    Filter expired reports
                </Checkbox>
                <Select
                    showSearch
                    allowClear
                    style={{ width: 200, marginBottom: '1rem' }}
                    placeholder="System"
                    optionFilterProp="children"
                    value={selectedSystem?.solarSystemId}
                    onChange={(sys) => {
                        setSelectedSystem(trigStorage.systems.find((s) => s.solarSystemId === sys))
                    }}>
                    {trigStorage.systems.map((system) => {
                        return (
                            <Option
                                key={`poch-${system.solarSystemId}`}
                                value={system.solarSystemId}>
                                {system.solarSystemName}
                            </Option>
                        )
                    })}
                </Select>
            </div>
            <Table
                pagination={false}
                dataSource={trigStorage.trigData.connections
                    .map((t) => {
                        return {
                            ...t,
                            key: `${t.externalSystemId}-${t.pochvenSystemId}-${t.pochvenSignature}`
                        }
                    })
                    .filter(
                        (t: TrigConnection) =>
                            t.pochvenSystemName
                                .toLowerCase()
                                .startsWith(systemFilter.toLowerCase()) ||
                            t.externalSystemName
                                .toLowerCase()
                                .startsWith(systemFilter.toLowerCase()) ||
                            t.pochvenSignature
                                .toLowerCase()
                                .startsWith(systemFilter.toLowerCase()) ||
                            t.externalSignature.toLowerCase().startsWith(systemFilter.toLowerCase())
                    )
                    .filter((t: TrigConnection) => {
                        if (!filterExpired) return true

                        return t?.already_expired_reports?.length > 0
                    })}
                columns={columns
                    .filter((column) => {
                        const charInfoPresent = trigStorage.trigData.connections.some(
                            (c) => c.creator !== undefined
                        )
                        if (charInfoPresent) return true
                        return column.key !== 'creator'
                    })
                    .filter((column) => {
                        if (session?.character?.level < 3 && column.key === 'action') return false
                        return true
                    })}
            />
        </div>
    )
}

export default WormholeTable
