import { useCallback, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Session } from '../../state/SessionContainer'
import { Button, Tooltip, Modal, Input } from 'antd'
import Graph from 'react-graph-vis'
import { DateTime } from 'luxon'
import { TrigData } from '../../state/TrigDataContainer'
import {
    LABEL_NODES,
    TRIG_SYSTEM_IDS
} from '../../const'
import { PochvenConnectionInput, SimpleSystem } from '../../types/types'
import { useWindowSize } from '../../hooks/WindowResizeHook'
import { Connection, TrigResponse } from '../../types/trig'
import { DeleteOutlined, IssuesCloseOutlined, UserOutlined } from '@ant-design/icons'
import { PochvenSignatureInput } from '../../types/sigs'
import AddConnection from './AddConnection'
import queryString from 'query-string'
import Router from 'next/router'
import { getCurrentLocation } from '../../data/esiClient'

/* API helpers */
const postSignatures = async (systemId: number, signatures: PochvenSignatureInput[]) => {
    try {
        return await fetch(`/api/sigs/${systemId}`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify(signatures)
        })
    } catch (e) {
        return console.error(e)
    }
}

const deleteSignature = async (systemId: number, signature: PochvenSignatureInput | undefined) => {
    try {
        return await fetch(`/api/sigs/${systemId}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify(signature)
        })
    } catch (e) {
        return console.error(e)
    }
}

const getSignatures = async (systemId: number) => {
    try {
        const response = await fetch(`/api/sigs/${systemId}`);
        return response.json()
    } catch (e) {
        console.error(e)
    }
}

const deleteConnection = async (input: PochvenConnectionInput) => {
    try {
        return await fetch('/api/data/trig', {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ ...input })
        })
    } catch (e) {
        return console.error(e)
    }
}

const putConnectionCritical = async (input: PochvenConnectionInput) => {
    try {
        return await fetch('/api/data/trig', {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ ...input })
        })
    } catch (e) {
        return console.error(e)
    }
}

const getStaticEmpireRoute = async (systemName: string) => {
    try {
        const response = await fetch(`/api/data/static-empire-route`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ systemName })
        })
        return response.json()
    } catch (e) {
        console.log(e)
    }
}

const { TextArea } = Input

interface RightSideBarWrapperProps {
    children: ReactNode
    style?: CSSProperties
}

/**
 * Simple CSS wrapper for right sidebar components.
 */
const SidebarWrapper = ({ style, children }: RightSideBarWrapperProps) => {
    return (
        <section
            style={{
                border: 'solid 1px white',
                borderRadius: '10px',
                padding: '0.6rem',
                backgroundColor: '#260707',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                ...(style ?? {})
            }}>
            {children}
        </section>
    )
}

interface SelectedSystemSignaturesProps {
    character: any
    isSpecialist: boolean
    onDeleteSignatureClick: typeof deleteSignature
    onMarkAsCriticalClick: typeof putConnectionCritical
    onRemoveConnectionClick: typeof deleteConnection
    onSignaturePaste: typeof postSignatures
    selectedSystem: any
    signatures: any
    trigData: any
}

/**
 * When a Pochven system is currently selected:
 *
 * - shows a button to let the user add a new connection
 * - shows a list of current connections
 *
 */
const SelectedSystemSignatures = ({
    character,
    isSpecialist,
    onDeleteSignatureClick,
    onMarkAsCriticalClick,
    onSignaturePaste,
    onRemoveConnectionClick,
    selectedSystem,
    signatures,
    trigData
}: SelectedSystemSignaturesProps) => {
    if (character?.level < 2 || !trigData || !selectedSystem) return <></>
    const selectedSystemConnections = useMemo<Connection[]>(() => {
        return trigData.connections
            .filter(
                (c: Connection) => [c.pochvenSystemId, c.externalSystemId].includes(selectedSystem.solarSystemId)
            )
            .sort((a, b) => a.comment > b.comment)
    }, [trigData.connections, selectedSystem.solarSystemId]);
    const { solarSystemId } = selectedSystem;

    const [isModalVisible, setIsModalVisible] = useState(false)
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
            onSignaturePaste(selectedSystem, rowsWithCells)
        }
        setIsModalVisible(false)
        setPasteValue('')
    }, [onSignaturePaste, pasteValue, selectedSystem])

    return (
        <SidebarWrapper style={{ minWidth: '14rem' }}>
            <a
                style={{ fontSize: '1.4rem' }}
                href={`https://zkillboard.com/system/${solarSystemId}/`}
                target="_blank">
                {selectedSystem.solarSystemName}
            </a>
            {selectedSystemConnections.length === 0 ? (
                <div>No connections</div>
            ) : (
                selectedSystemConnections.map((s) => {
                    return (
                        <div
                            key={s.comment}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                            <div>
                                {s.pochvenSystemId === solarSystemId
                                    ? s.comment
                                    : `${s.externalSignature} ${s.pochvenSystemName} ${s.externalWormholeType}`}
                            </div>
                            {isSpecialist ? (
                                <div style={{ marginLeft: '0.5rem' }}>
                                    <Tooltip title="Delete connection">
                                        <Button
                                            type="dashed"
                                            shape="circle"
                                            onClick={() =>
                                                onRemoveConnectionClick({ connectionId: s.id })
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
                                                onMarkAsCriticalClick({
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
            {character?.level === 3 ? <AddConnection /> : null}
            <hr style={{ borderTop: '1px solid #bbb', width: '100%' }}></hr>
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
                            {isSpecialist ? (
                                <div style={{ marginLeft: '0.5rem' }}>
                                    <Tooltip title="Delete signature">
                                        <Button
                                            type="dashed"
                                            shape="circle"
                                            onClick={() => onDeleteSignatureClick(solarSystemId, s)}
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
            {isSpecialist ? (
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
                            onDeleteSignatureClick(solarSystemId, undefined)
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
        </SidebarWrapper>
    )
}

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
    const isSpecialist = session?.character?.level > 2
    const [signatures, setSignatures] = useState<PochvenSignatureInput[]>([])
    const [kSpacePossibleConnectionSystems, setKSpacePossibleConnectionSystems] = useState<any[]>([])
    const [trackedCharacter, setTrackedCharacter] = useState<any>(null)
    const [trackedLocation, setTrackedLocation] = useState<number | null>(null)
    const [locationPollInterval, setLocationPollInterval] = useState<NodeJS.Timeout | null>(null)

    const [width, height] = useWindowSize()

    const [hidden, setHidden] = useState(true)

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

    const onFetchSignatures = useCallback<typeof getSignatures>((systemId) => {
        return getSignatures(systemId).then((sigs) => setSignatures(sigs))
    }, []);

    const events = useMemo(() => ({
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
            if (!system?.solarSystemName) return

            if (TRIG_SYSTEM_IDS.some((t) => t === systemId)) {
                trigStorage.setSelectedSystem(systemId)
                setSignatures([])
                onFetchSignatures(systemId)
                getStaticEmpireRoute(system.solarSystemName).then((sigs) => setKSpacePossibleConnectionSystems(sigs))
                return
            }
            if (system.solarSystemName.match(/J[0-9]{1,6}$/)) {
                window.open(`http://anoik.is/systems/${system.solarSystemName}`, '_blank')
            } else {
                window.open(`https://evemaps.dotlan.net/system/${system.solarSystemName}`, '_blank')
            }
        }
    }), [session?.character, trigStorage])

    const selectedSystem = useMemo<SimpleSystem | undefined>(() => {
        return trigStorage.systems.find((s) => s.solarSystemId === trigStorage.selectedSystem)
    }, [trigStorage?.systems, trigStorage?.selectedSystem]);

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

    const removeSignature = useCallback<typeof deleteSignature>((systemId, signature) => {
        return deleteSignature(systemId, signature).then(() => onFetchSignatures(trigStorage.selectedSystem))
    }, [onFetchSignatures, trigStorage.selectedSystem])
    const removeConnection = useCallback<typeof deleteConnection>((connection) => {
        return deleteConnection(connection).then(() => trigStorage.fetchTrigMap())
    }, [trigStorage.fetchTrigMap])
    const markConnectionAsCritical = useCallback<typeof putConnectionCritical>((connection) => {
        return putConnectionCritical(connection).then(() => trigStorage.fetchTrigMap())
    }, [trigStorage.fetchTrigMap])
    const saveSignatures = useCallback<typeof postSignatures>((systemId, signatures) => {
        return postSignatures(systemId, signatures).then(() => onFetchSignatures(systemId))
    }, [onFetchSignatures, selectedSystem]);

    return (
        <div className={hidden ? 'map hide' : 'map'}>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', gap: '1rem', right: '1rem', top: '5rem', zIndex: 1 }}>
                <SelectedSystemSignatures
                    character={session?.character}
                    isSpecialist={isSpecialist}
                    onDeleteSignatureClick={removeSignature}
                    onMarkAsCriticalClick={markConnectionAsCritical}
                    onRemoveConnectionClick={removeConnection}
                    onSignaturePaste={saveSignatures}
                    selectedSystem={selectedSystem}
                    signatures={signatures}
                    trigData={trigStorage?.trigData}
                />
                {selectedSystem !== undefined && session?.character?.level === 3 && (
                    <SidebarWrapper
                        style={{
                            position: 'fixed',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            width: 'auto',
                            minWidth: '5rem',
                            maxWidth: '20rem',
                            left: '1rem',
                            top: '12rem',
                            maxHeight: '50vh',
                            overflow: 'auto'
                        }}
                    >
                        <span style={{ fontSize: '1.4rem'}}>{selectedSystem.solarSystemName} System Candidates</span>
                        <hr style={{ borderTop: '1px solid #bbb', width: '100%' }}></hr>
                        {kSpacePossibleConnectionSystems.map(ksc => (
                            <pre key={ksc.id} style={{ border: '1px solid #CCCCCC', padding: '0 1rem' }}>{...ksc}</pre>
                        ))}
                    </SidebarWrapper>
                )}
                <SidebarWrapper>
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
                </SidebarWrapper>
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
