import { useContext, useEffect, useState } from 'react'
import { Session } from '../../state/SessionContainer'
import { Button, Tooltip, Modal, Input } from 'antd'
import Graph from 'react-graph-vis'
import { DateTime } from 'luxon'
import { TrigData } from '../../state/TrigDataContainer'
import {
    LABEL_NODES,
    TRIG_SYSTEM_IDS
} from '../../const'
import { PochvenConnectionInput } from '../../types/types'
import { useWindowSize } from '../../hooks/WindowResizeHook'
import { Connection, TrigResponse } from '../../types/trig'
import { DeleteOutlined, IssuesCloseOutlined, UserOutlined } from '@ant-design/icons'
import { PochvenSignatureInput } from '../../types/sigs'
import AddConnection from './AddConnection'
import queryString from 'query-string'
import Router from 'next/router'
import { getCurrentLocation } from '../../data/esiClient'

const { TextArea } = Input

const edgeColor = (c: Connection) => {
    if (!c) return '#9d9d9e'
    if (c?.timeCritical) return 'red'
    const whDuration =
        c.externalWormholeType === 'C729' || c.pochvenWormholeType === 'C729' ? 12 : 16
    const timeOfDeath = c.timeCriticalTime
        ? DateTime.fromISO(c.timeCriticalTime).plus({ hours: 4 })
        : DateTime.fromISO(c.createdTime).plus({ hours: whDuration })
    const timeNow = DateTime.now()
    const diffHours = Math.floor(timeOfDeath.diff(timeNow, 'hours').hours)
    return diffHours < 4 ? 'red' : '#9d9d9e'
}

const edgeDashes = (c: Connection) => {
    if (c?.already_expired_reports?.length > 0) return true
    return false
}

const Map = ({ dragView = true, zoomView = true, mapHeight = '100%', mapWidth = '100%' }) => {
    const [map, setMap] = useState(undefined)
    const trigStorage = useContext(TrigData)
    const session = useContext(Session)
    const isSpesialist = session?.character?.level > 2
    const [signatures, setSignatures] = useState<PochvenSignatureInput[]>([])
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [trackedCharacter, setTrackedCharacter] = useState<any>(null)
    const [trackedLocation, setTrackedLocation] = useState<number | null>(null)
    const [locationPollInterval, setLocationPollInterval] = useState<NodeJS.Timeout | null>(null)

    const [width, height] = useWindowSize()

    const [hidden, setHidden] = useState(true)

    const saveSignatures = (systemId: number, signatures: PochvenSignatureInput[]) => {
        fetch(`/api/sigs/${systemId}`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify(signatures)
        })
            .then(() => fetchSignatures(trigStorage.selectedSystem))
            .catch((e) => console.log(e))
    }

    const removeSignature = (systemId: number, signature: PochvenSignatureInput | undefined) => {
        fetch(`/api/sigs/${systemId}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify(signature)
        }).then(() => fetchSignatures(trigStorage.selectedSystem))
    }

    const fetchSignatures = async (systemId: number) =>
        await fetch(`/api/sigs/${systemId}`)
            .then((res) => res.json())
            .then((sigs) => setSignatures(sigs))

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

    useEffect(() => {
        if (!map) return
        map.setSize(width, height)
        map.redraw()
        map.fit()
    }, [width, height])

    useEffect(() => {
        if (!map) return
        map.setSize(width, height)
        setTimeout(() => {
            map.fit()
            setHidden(false)
        }, 500)
    }, [map])

    useEffect(() => {
        // Check for stored tracking session
        const storedSession = localStorage.getItem('trackingSession')
        if (storedSession) {
            try {
                const session = JSON.parse(storedSession)
                startTracking(session)
            } catch (error) {
                console.error('Error parsing stored session:', error)
                localStorage.removeItem('trackingSession')
            }
        }
    }, [])

    const events = {
        select: (event) => {
            if (!session.character || session?.character?.level < 2) {
                return
            }
            if (event.nodes.length !== 1) {
                trigStorage.setSelectedSystem(undefined)
                return
            }
            const systemId = event.nodes[0]
            if (systemId === trigStorage.selectedSystem) return
            const system = trigStorage.systems.find((s) => s.solarSystemId === systemId)
            if (TRIG_SYSTEM_IDS.some((t) => t === systemId)) {
                trigStorage.setSelectedSystem(systemId)
                setSignatures([])
                fetchSignatures(systemId)
                return
            }
            if (system.solarSystemName.match(/J[0-9]{1,6}$/)) {
                window.open(`http://anoik.is/systems/${system.solarSystemName}`, '_ blank')
            } else {
                window.open(
                    `https://evemaps.dotlan.net/system/${system.solarSystemName}`,
                    '_ blank'
                )
            }
        }
    }

    const selectedSystemSignatures = (selectedSystem: number) => {
        if (session?.character?.level < 2 || !trigStorage.trigData || !selectedSystem) return <></>
        const selectedSystemSignatures: Connection[] = trigStorage.trigData.connections
            .filter(
                (c: Connection) =>
                    c.pochvenSystemId === selectedSystem || c.externalSystemId === selectedSystem
            )
            .sort((a, b) => a.comment > b.comment)
        const system = trigStorage.systems.find((s) => s.solarSystemId === selectedSystem)
        return (
            <div
                style={{
                    minWidth: '14rem',
                    border: 'solid 1px white',
                    borderRadius: '10px',
                    padding: '0.6rem',
                    backgroundColor: '#260707'
                }}>
                <a
                    style={{ fontSize: '1.4rem' }}
                    href={`https://zkillboard.com/system/${system.solarSystemId}/`}>
                    {system.solarSystemName}
                </a>
                {selectedSystemSignatures.length === 0 ? (
                    <div style={{ marginBottom: '0.4rem', marginTop: '0.2rem' }}>
                        No connections
                    </div>
                ) : (
                    selectedSystemSignatures.map((s) => {
                        return (
                            <div
                                key={s.comment}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: '0.2rem',
                                    marginBottom: '0.4rem'
                                }}>
                                <div>
                                    {s.pochvenSystemId === selectedSystem
                                        ? s.comment
                                        : `${s.externalSignature} ${s.pochvenSystemName} ${s.externalWormholeType}`}
                                </div>
                                {isSpesialist ? (
                                    <div style={{ marginLeft: '0.5rem' }}>
                                        <Tooltip title="Delete connection">
                                            <Button
                                                type="dashed"
                                                shape="circle"
                                                onClick={() =>
                                                    removeConnection({ connectionId: s.id })
                                                }
                                                icon={<DeleteOutlined />}
                                            />
                                        </Tooltip>
                                        <Tooltip title="Mark connection EOL">
                                            <Button
                                                type="dashed"
                                                shape="circle"
                                                style={{ marginLeft: '0.2rem' }}
                                                onClick={() =>
                                                    setConnectionCritical({
                                                        connectionId: s.id
                                                    })
                                                }
                                                icon={<IssuesCloseOutlined />}
                                            />
                                        </Tooltip>
                                    </div>
                                ) : (
                                    <></>
                                )}
                            </div>
                        )
                    })
                )}
                {session?.character?.level === 3 ? <AddConnection /> : <></>}
                <hr style={{ borderTop: '1px solid #bbb' }}></hr>
                {signatures.length === 0 ? (
                    <div>No signatures</div>
                ) : (
                    signatures.map((s) => {
                        return (
                            <div
                                key={s.sig}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: '0.2rem'
                                }}>
                                <div>{s.sig}</div>
                                <div style={{ width: '100%', marginLeft: '0.5rem' }}>{s.name}</div>
                                {isSpesialist ? (
                                    <div style={{ marginLeft: '0.5rem' }}>
                                        <Tooltip title="Delete signature">
                                            <Button
                                                type="dashed"
                                                shape="circle"
                                                onClick={() => removeSignature(selectedSystem, s)}
                                                icon={<DeleteOutlined />}
                                            />
                                        </Tooltip>
                                    </div>
                                ) : (
                                    <></>
                                )}
                            </div>
                        )
                    })
                )}
                {isSpesialist ? (
                    <div style={{ marginTop: '0.6rem' }}>
                        <Button
                            onClick={() => {
                                setIsModalVisible(true)
                            }}>
                            Paste
                        </Button>
                        <Button
                            style={{ marginLeft: '0.5rem' }}
                            onClick={() => {
                                removeSignature(selectedSystem, undefined)
                            }}>
                            Clear
                        </Button>
                    </div>
                ) : (
                    <></>
                )}
                <Modal
                    title="Paste signatures:"
                    open={isModalVisible}
                    onOk={() => setIsModalVisible(false)}
                    onCancel={() => setIsModalVisible(false)}>
                    <TextArea
                        rows={12}
                        value={pasteValue}
                        onChange={(e) => {
                            setPasteValue(e.target.value)
                        }}
                    />
                </Modal>
            </div>
        )
    }

    const [pasteValue, setPasteValue] = useState('')

    useEffect(() => {
        if (pasteValue.length > 0) {
            const rows = pasteValue.match(/^.*((\r\n|\n|\r)|$)/gm)
            const rowsWithCells = rows
                .map((r) => r.split('\t'))
                .map((r) => {
                    return {
                        sig: r[0],
                        type: r[2],
                        name: r[3]
                    }
                })
            saveSignatures(trigStorage.selectedSystem, rowsWithCells)
        }
        setIsModalVisible(false)
        setPasteValue('')
    }, [pasteValue])

    const options = {
        interaction: {
            zoomView,
            dragNodes: false,
            dragView,
            zoomSpeed: 0.1,
            hover: true,
            selectable: true
        },
        layout: {
            randomSeed: undefined,
            hierarchical: {
                enabled: false
            }
        },
        edges: {
            color: '#9d9d9e',
            width: 2,
            arrows: { to: { enabled: false } }
        },
        nodes: {
            font: {
                size: 20,
                face: 'Shentox',
                color: 'white'
            }
        },
        autoResize: false,
        height: mapHeight,
        width: mapWidth,
        clickToUse: false,
        physics: {
            enabled: true,
            barnesHut: {
                theta: 0.1,
                gravitationalConstant: -1000,
                centralGravity: -11,
                springLength: 30,
                springConstant: 0.09,
                damping: 0.1,
                avoidOverlap: 1
            },
            repulsion: {
                centralGravity: -1.3,
                springLength: 70,
                springConstant: 0.1,
                nodeDistance: 180,
                damping: 0.09
            },
            hierarchicalRepulsion: {
                centralGravity: -100,
                springLength: 20,
                springConstant: 1,
                nodeDistance: 180,
                damping: trigStorage.boing ? 0.1 : 1,
                avoidOverlap: 0
            },
            forceAtlas2Based: {
                theta: 0.001,
                gravitationalConstant: -2000,
                centralGravity: -1,
                springConstant: 0.5,
                springLength: 20,
                damping: 0.4,
                avoidOverlap: 1
            },
            solver: 'hierarchicalRepulsion',
            stabilization: {
                enabled: true,
                iterations: 100,
                updateInterval: 100,
                onlyDynamicEdges: true
            }
        }
    }

    const nodeTooltip = (node) => {
        const system = trigStorage.systems.find((s) => s.solarSystemId === node.id)
        const regionPart = system && system.regionName ? `Region: ${system.regionName} \n` : ''
        const connectionsPart =
            node.edges && node.edges.length > 0
                ? node.edges.reduce((acc, edge) => {
                      if (edge.externalSystemId === node.id)
                          return (
                              acc +
                              `${edge.externalSignature ?? '??'}(${
                                  edge.externalSystemName ?? '??'
                              }) -> ${edge.pochvenSystemName} \n`
                          )
                      return (
                          acc +
                          `${edge.pochvenSignature ?? '??'}(${
                              edge.pochvenWormholeType ?? '??'
                          }) -> ${edge.externalSystemName} \n`
                      )
                  }, '')
                : 'Connections: Encrypted'
        return `${regionPart}${connectionsPart}`
    }

    const edgeCurve = (edge) => {
        if (
            edge.ext &&
            TRIG_SYSTEM_IDS.some((i) => i === edge.to) &&
            TRIG_SYSTEM_IDS.some((i) => i === edge.from)
        )
            return 'curvedCCW'
        else return 'continuous'
    }

    const resolveImageLink = (systemId: number): string | undefined => {
        if (systemId === 31000005)
            return 'https://images.evetech.net/corporations/1000130/logo?size=128'
        const sovNode = trigStorage.sov.find((s) => s.system_id === systemId)
        const system = trigStorage.systems.find((s) => s.solarSystemId === systemId)
        if (sovNode?.faction_id)
            return `https://images.evetech.net/corporations/${sovNode.faction_id}/logo?size=128`
        if (sovNode?.corporation_id)
            return `https://images.evetech.net/corporations/${sovNode.corporation_id}/logo?size=128`
        if (sovNode?.alliance_id)
            return `https://images.evetech.net/alliance/${sovNode.alliance_id}/logo?size=128`
        if (!system) return undefined
        return `api/data/class-icon?classId=${system.class}`
    }

    const modifyTrigData = (trigData: TrigResponse) => {
        return {
            nodes: [
                ...trigData.nodes.map((node) => {
                    const isTrigSystem = TRIG_SYSTEM_IDS.some((id) => node.id === id)
                    const factionIconLink = resolveImageLink(node.id)
                    const isTrackedLocation = trackedLocation && node.id === trackedLocation
                    
                    return {
                        ...node,
                        title: nodeTooltip(node),
                        shape: isTrigSystem ? 'box' : factionIconLink ? 'circularImage' : 'dot',
                        image: !isTrigSystem && factionIconLink ? factionIconLink : undefined,
                        size: isTrackedLocation ? 30 : 25,
                        widthConstraint: { minimum: isTrigSystem ? 130 : 80 },
                        heightConstraint: { minimum: isTrigSystem ? 50 : 10 },
                        shadow: {
                            enabled: isTrigSystem ? false : true,
                            color: node.color,
                            size: 30
                        },
                        borderWidth: isTrackedLocation ? 3 : 1,
                        color: {
                            background: node.color,
                            border: isTrackedLocation ? 'yellow' : 'black',
                            highlight: {
                                background: node.color,
                                border: 'white'
                            },
                            hover: {
                                background: `${node.color}`,
                                border: 'white'
                            }
                        }
                    }
                }),
                ...LABEL_NODES
            ],
            edges: trigData.edges
                .reduce((acc, edge) => {
                    if (acc.find((e) => e.to === edge.from && e.from === edge.to)) return acc
                    return [...acc, edge]
                }, [])
                .map((edge) => {
                    const matchingConnection = trigData.connections.find((con) => {
                        return con.pochvenSystemId === edge.to && con.externalSystemId == edge.from
                    })
                    return {
                        ...edge,
                        color: edgeColor(matchingConnection),
                        dashes: edgeDashes(matchingConnection),
                        smooth: {
                            enabled: true,
                            type: edgeCurve(edge)
                        }
                    }
                })
        }
    }

    const eveSsoLogin = () => {
        const ssoUrl = `${process.env.NEXT_PUBLIC_EVE_SSO_AUTH_HOST}/v2/oauth/authorize/?`
        const state = Math.random().toString(36).substring(1)
        const request = {
            response_type: 'code',
            redirect_uri: `${process.env.NEXT_PUBLIC_DOMAIN}/redirect`,
            client_id: process.env.NEXT_PUBLIC_EVE_SSO_ID,
            scope: 'esi-location.read_location.v1',
            state
        }

        const stringified = queryString.stringify(request)
        sessionStorage.setItem('savedState', state)
        sessionStorage.setItem('trackingLogin', 'true')
        Router.push(`${ssoUrl}${stringified}`)
    }

    const startTracking = async (characterSession: any) => {
        setTrackedCharacter(characterSession)
        // Start polling location every 10 seconds
        const interval = setInterval(async () => {
            try {
                const location = await getCurrentLocation(characterSession)
                if (location) {
                    setTrackedLocation(location.solar_system_id)
                }
            } catch (error) {
                console.error('Error fetching location:', error)
                stopTracking()
            }
        }, 10000)
        setLocationPollInterval(interval)
    }

    const stopTracking = () => {
        if (locationPollInterval) {
            clearInterval(locationPollInterval)
            setLocationPollInterval(null)
        }
        setTrackedCharacter(null)
        setTrackedLocation(null)
    }

    useEffect(() => {
        return () => {
            if (locationPollInterval) {
                clearInterval(locationPollInterval)
            }
        }
    }, [locationPollInterval])

    return (
        <div className={hidden ? 'map hide' : 'map'}>
            <div style={{ position: 'absolute', right: '1rem', top: '5rem', zIndex: 1 }}>
                {selectedSystemSignatures(trigStorage.selectedSystem)}
                <div style={{ marginTop: '1rem', border: 'solid 1px white', borderRadius: '10px', padding: '0.6rem', backgroundColor: '#260707' }}>
                    {!trackedCharacter ? (
                        <Button 
                            icon={<UserOutlined />} 
                            onClick={eveSsoLogin}
                            style={{ width: '100%' }}
                        >
                            Track Character
                        </Button>
                    ) : (
                        <div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                Tracking: {trackedCharacter.character.CharacterName}
                            </div>
                            {trackedLocation && (
                                <div>
                                    Location: {trigStorage.systems.find(s => s.solarSystemId === trackedLocation)?.solarSystemName}
                                </div>
                            )}
                            <Button 
                                onClick={stopTracking}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            >
                                Stop Tracking
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {trigStorage.trigData ? (
                <Graph
                    graph={modifyTrigData(trigStorage.trigData)}
                    options={options}
                    getNetwork={(network) => {
                        setMap(network)
                    }}
                    events={events}
                />
            ) : (
                <></>
            )}
        </div>
    )
}

export default Map
