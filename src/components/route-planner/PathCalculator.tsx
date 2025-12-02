import { Button, Select, Radio, Checkbox } from 'antd'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { getSystemKills, getSystemJumps } from '../../data/esiClient'
import { getCopyPasteRoute } from '../../utils'
import moment from 'moment'
import { CalculateRouteInput } from '../../pathfinder/pathfinder'
import { ShipSize, RouteSystem, SimpleSystem, SimpleSystemWithKills } from '../../types/types'
import { fetchPath, fetchSystems } from './utils'
import PathHeader from './PathHeader'
import PathRow from './PathRow'

const { Option } = Select

const getStoredAvoid = (): SimpleSystem[] => {
    return typeof window !== 'undefined' && localStorage.getItem('avoid')
        ? JSON.parse(localStorage.getItem('avoid'))
        : []
}

export interface CalculatedRoute {
    route: RouteSystem[]
    error?: string
    timestamp: string
    shipSize: ShipSize
}

const PathCalculator = () => {
    const [startSystem, setStartSystem] = useState<SimpleSystem>(undefined)
    const [endSystem, setEndSystem] = useState<SimpleSystem>(undefined)
    const [avoidSystems, setAvoidSystems] = useState<SimpleSystem[]>(getStoredAvoid())
    const [preferSafe, setPreferSafe] = useState<boolean>(false)
    const [avoidHome, setAvoidHome] = useState<boolean>(true)
    const [avoidWhsReportedExpired, setAvoidWhsReportedExpired] = useState<boolean>(true)

    const [systems, setSystems] = useState<SimpleSystemWithKills[]>([])
    const [routes, setRoutes] = useState<CalculatedRoute[]>([])

    const updateAvoidSystems = (avoidArray: SimpleSystem[]) => {
        setAvoidSystems(avoidArray)
        localStorage.setItem('avoid', JSON.stringify(avoidArray))
    }

    useEffect(() => {
        getSolarSystemData()
    }, [])

    const validateInputs = () => {
        if (!startSystem || !endSystem) {
            toast.error('Cannot route to empty systems')
            return false
        }
        if (startSystem === endSystem) {
            toast.error('Cannot route to same system')
            return false
        }
        if (avoidSystems.indexOf(startSystem) !== -1 || avoidSystems.indexOf(endSystem) !== -1) {
            toast.error('Cannot route to avoided system')
            return false
        }
        return true
    }

    const addNewRoute = (route: RouteSystem[]) => {
        const newRoute: CalculatedRoute = {
            route: route,
            error: route.length > 0 ? undefined : 'No route',
            timestamp: moment().format('YYYY-MM-DD HH:mm'),
            shipSize: 'Frigate'
        }
        setRoutes([newRoute, ...routes.slice(0, 1)])
        if (route.length === 0)
            toast.error(
                `No route found between ${startSystem.solarSystemName} and ${endSystem.solarSystemName} `
            )
    }

    const getRoute = () => {
        if (!validateInputs()) return
        const homeSystemsToAvoid = avoidHome ? [30001372, 30002702, 30003504] : []

        const input: CalculateRouteInput = {
            startSystemId: startSystem.solarSystemId,
            endSystemId: endSystem.solarSystemId,
            avoidSystemIds: [
                ...avoidSystems.map((avoidSystems) => avoidSystems.solarSystemId),
                ...homeSystemsToAvoid
            ],
            useEveScout: true,
            preferSafe,
            shipSize: 'Frigate',
            avoidWhsReportedExpired
        }

        fetchPath(input)
            .then(addNewRoute)
            .catch((e) => {
                toast.error('Failed to calculate path.')
            })
    }

    const getSolarSystemData = async () => {
        try {
            const baseSystemData = await fetchSystems()
            const systemsData = [...baseSystemData]
            const systemKillData = await getSystemKills()
            const systemJumpData = await getSystemJumps()

            const enrichedSystemData = systemsData.map((baseSystem): SimpleSystemWithKills => {
                return {
                    ...baseSystem,
                    esiKills: systemKillData.find(
                        (systemKill) => baseSystem.solarSystemId === systemKill.system_id
                    ),
                    esiJumps: systemJumpData.find(
                        (systemJump) => baseSystem.solarSystemId === systemJump.system_id
                    )
                }
            })
            setSystems(enrichedSystemData)
        } catch (e) {
            toast.error('No syste names to show')
            console.log(e)
        }
    }

    return (
        <div className="PathContainer">
            <div className="flex-column Controls">
                <h2
                    style={{
                        color: 'white',
                        fontSize: '2rem',
                        lineHeight: '1.8rem',
                        marginBottom: '1rem'
                    }}>
                    Find the shortest route
                </h2>
                <h3>1. Select start system:</h3>
                <Select
                    showSearch
                    allowClear
                    style={{ width: 200, marginBottom: '1rem' }}
                    placeholder="Start system"
                    optionFilterProp="children"
                    onSelect={(value) => {
                        setStartSystem(systems.find((s) => s.solarSystemId === value))
                    }}
                    filterOption={(input, option) => {
                        return (
                            option.children
                                .toString()
                                .toLowerCase()
                                .indexOf(input.toString().toLowerCase()) >= 0
                        )
                    }}
                    filterSort={(optionA, optionB) =>
                        optionA.children
                            .toString()
                            .toLowerCase()
                            .localeCompare(optionB.children.toString().toLowerCase())
                    }>
                    {systems.map((system) => {
                        return (
                            <Option key={system.solarSystemId} value={system.solarSystemId}>
                                {system.solarSystemName}
                            </Option>
                        )
                    })}
                </Select>
                <h3>2. Select end system:</h3>
                <Select
                    showSearch
                    allowClear
                    style={{ width: 200, marginBottom: '1rem' }}
                    placeholder="End system"
                    optionFilterProp="children"
                    onSelect={(value) => {
                        setEndSystem(systems.find((s) => s.solarSystemId === value))
                    }}
                    filterOption={(input, option) =>
                        option.children
                            .toString()
                            .toLowerCase()
                            .indexOf(input.toString().toLowerCase()) >= 0
                    }
                    filterSort={(optionA, optionB) =>
                        optionA.children
                            .toString()
                            .toLowerCase()
                            .localeCompare(optionB.children.toString().toLowerCase())
                    }>
                    {systems.map((system) => {
                        return (
                            <Option key={system.solarSystemId} value={system.solarSystemId}>
                                {system.solarSystemName}
                            </Option>
                        )
                    })}
                </Select>
                <h3>3. Select systems to avoid:</h3>
                <Select
                    showSearch
                    allowClear={true}
                    style={{ width: 200, marginBottom: '1rem' }}
                    placeholder="Avoid systems"
                    optionFilterProp="children"
                    onSelect={(value) => {
                        const systemToAdd = systems.find((system) => system.solarSystemId === value)
                        if (
                            !avoidSystems.some((s) => s.solarSystemId === systemToAdd.solarSystemId)
                        )
                            updateAvoidSystems([...avoidSystems, systemToAdd])
                    }}
                    filterOption={(input, option) =>
                        option.children
                            .toString()
                            .toLowerCase()
                            .indexOf(input.toString().toLowerCase()) >= 0
                    }
                    filterSort={(optionA, optionB) =>
                        optionA.children
                            .toString()
                            .toLowerCase()
                            .localeCompare(optionB.children.toString().toLowerCase())
                    }>
                    {systems.map((system) => {
                        return (
                            <Option key={system.solarSystemId} value={system.solarSystemId}>
                                {system.solarSystemName}
                            </Option>
                        )
                    })}
                </Select>
                {avoidSystems.length > 0 && (
                    <div className="Avoid" style={{ color: 'white', marginBottom: '1.2rem' }}>
                        List of avoided systems below. (Click to remove)
                        <div className="flex-row flex-wrap">
                            {avoidSystems.map((system) => {
                                return (
                                    <a
                                        href="#"
                                        key={`avoid-${system.solarSystemId}`}
                                        className="AvoidSystem"
                                        onClick={() =>
                                            updateAvoidSystems(
                                                avoidSystems.filter(
                                                    (systemToAvoid) =>
                                                        systemToAvoid.solarSystemId !==
                                                        system.solarSystemId
                                                )
                                            )
                                        }>
                                        {system.solarSystemName}{' '}
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                )}
                <Checkbox
                    checked={avoidHome}
                    style={{ color: 'white', marginBottom: '1rem' }}
                    onChange={() => setAvoidHome(!avoidHome)}>
                    Avoid Home Systems
                </Checkbox>
                <Checkbox
                    checked={avoidWhsReportedExpired}
                    style={{ color: 'white', marginBottom: '1rem', marginLeft: '0rem' }}
                    onChange={() => setAvoidWhsReportedExpired(!avoidWhsReportedExpired)}>
                    Avoid connections reported as expired
                </Checkbox>
                <h3>4. Select security bias:</h3>
                <Radio.Group
                    style={{ marginBottom: '1.2rem' }}
                    onChange={(event) => {
                        setPreferSafe(event.target.value)
                    }}
                    value={preferSafe}>
                    <Radio value={true} style={{ color: 'white' }}>
                        Safer
                    </Radio>
                    <Radio value={false} style={{ color: 'white' }}>
                        Shorter
                    </Radio>
                </Radio.Group>
                <div className="flex-row">
                    <Button
                        onClick={() => getRoute()}
                        className="PathButton"
                        style={{ maxWidth: '200px', marginRight: '1rem' }}>
                        Calculate optimal path
                    </Button>
                    <Button
                        onClick={() => setRoutes([])}
                        className="PathButton"
                        style={{ maxWidth: '200px' }}>
                        Clear routes
                    </Button>
                </div>
            </div>

            {routes.length > 0 && (
                <div className="Result">
                    <div className="PathsContainer">
                        {routes.map((calculatedRoute, index) => {
                            if (calculatedRoute.error) {
                                return (
                                    <div className="flex-column Route">
                                        <div>
                                            Route {index + 1}:{'  '} - {calculatedRoute.timestamp}
                                            {' - '}
                                            {calculatedRoute.shipSize}
                                            {'  '}
                                        </div>
                                        <div>{calculatedRoute.error}</div>
                                    </div>
                                )
                            }
                            return (
                                <div key={`Route-${index}`} className={'Route'}>
                                    <div className="flex-column-mobile">
                                        Route {index + 1}:{'  '} - {calculatedRoute.timestamp}
                                        <a
                                            style={{ marginLeft: '0.5rem' }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    getCopyPasteRoute(calculatedRoute.route)
                                                )
                                            }}>
                                            Copy
                                        </a>
                                    </div>
                                    <PathHeader />
                                    {calculatedRoute.route.map((system, index) => {
                                        const systemData = systems.find(
                                            (baseSystem) =>
                                                baseSystem.solarSystemId === system.currentSystemId
                                        )
                                        return (
                                            <PathRow
                                                key={`path-${system.currentSystemName}`}
                                                systemData={systemData}
                                                system={system}
                                                index={index}
                                            />
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            <style jsx>{`
                tr th td {
                    border: 1px solid white;
                }
                .PathContainer {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    color: white;
                }
                .PathsContainer {
                    display: flex;
                    overflow: hidden;
                }
                @media (max-width: 1000px) {
                    .PathsContainer {
                        display: flex;
                        flex-direction: column;
                        overflow: scroll;
                    }
                }
                .Route {
                    margin-top: 1rem;
                    margin-right: 1rem;
                    min-width: 30vw;
                }
                .Controls {
                    color: black;
                }
                .QuickSystem {
                    margin-right: 0.5rem;
                }
                .Toggle {
                    color: white;
                }
                input {
                    margin: 1rem 0.5rem 1rem 0;
                }
                .PathInput {
                    margin: 0.5rem 0rem;
                    height: 2rem;
                }
                .Critical {
                    color: RED;
                    margin-left: 1rem;
                }
                .page-title {
                    margin-left: 1rem;
                }
                .AvoidSystem {
                    color: red;
                    margin-right: 0.5rem;
                }
                .flex-row {
                    align-items: center;
                }
                .Description {
                    max-width: 40rem;
                    margin-bottom: 1rem;
                }
                .PathRow {
                    align-items: center;
                }
                .PathRowSystem {
                    display: flex;
                    align-items: center;
                    margin-right: 1rem;
                }
                .NullSec {
                    color: red;
                }
                .LowSec {
                    color: orange;
                }
                .HighSec {
                    color: green;
                }
                .copyPaste {
                    width: 0;
                    height: 0;
                }
                .CheckBox {
                    width: 1rem;
                }
                .QuickInput {
                    align-items: flex-end;
                }
            `}</style>
            <style global jsx>{`
                input {
                    width: 20rem;
                }
            `}</style>
        </div>
    )
}

export default PathCalculator
