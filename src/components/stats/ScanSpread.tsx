import { useEffect, useState } from 'react'
import { Typography } from 'antd'
import { DateTime } from 'luxon'
import { useMediaQuery } from 'react-responsive'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { HIGHSEC_GREEN, TRIGLAVIAN_RED } from '../../const'

interface ScanSpreadItem {
    value: number
    count: number
}

const MINIMUM_SIGS_PER_WEEKDAY = 40
const MINIMUM_SIGS_PER_HOUR = 5

const ScanSpread = () => {
    const { Title } = Typography

    const [perWeek, setPerWeek] = useState<ScanSpreadItem[]>([])
    const [perDay, setPerDay] = useState<ScanSpreadItem[]>([])

    const handleMouseOver = (data) => {
        setHoverWeek(data)
    }

    const handleMouseLeave = () => {
        setHoverWeek(undefined)
    }

    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })

    const fetchData = async () => {
        await fetch('/api/stats/weekly')
            .then((res) => res.json())
            .then((res) => {
                setPerWeek(
                    [...Array(7).keys()].map((i) => {
                        const valueFromDb = res.find((r) => r.value === i + 1)
                        return {
                            value: i + 1,
                            count: valueFromDb?.count ? parseInt(valueFromDb?.count) : 0
                        }
                    })
                )
            })

        await fetch('/api/stats/daily')
            .then((res) => res.json())
            .then((res) =>
                setPerDay(
                    [...Array(24).keys()].map((i) => {
                        const valueFromDb = res.find((r) => r.value === i)
                        return {
                            value: i,
                            count: valueFromDb?.count ? parseInt(valueFromDb?.count) : 0
                        }
                    })
                )
            )
    }

    useEffect(() => {
        fetchData().then().catch(console.log)
    }, [])

    const [hoverWeek, setHoverWeek] = useState(undefined)
    const [hoverDay, setHoverDay] = useState(undefined)

    const dayNumberToTooltip = (v) => {
        const weekday = DateTime.local().set({ weekday: v.x }).toFormat('EEE')
        return { title: weekday, value: needsScanningWeek(v) ? 'needs more scanners' : 'ok' }
    }
    const hourNumberToTooltip = (v) => {
        const hour = DateTime.local().set({ hour: v.x }).toFormat('HH')
        return { title: hour, value: needsScanningDay(v) ? 'needs more scanners' : 'ok' }
    }

    const needsScanningWeek = (v): boolean => {
        const average =
            perWeek.reduce((acc, v) => {
                return acc + v.count
            }, 0) / perWeek.length
        return v.y < average || v.y < MINIMUM_SIGS_PER_WEEKDAY
    }

    const needsScanningDay = (v): boolean => {
        const average =
            perDay.reduce((acc, v) => {
                return acc + v.count
            }, 0) / perDay.length
        return v.y < average || v.y < MINIMUM_SIGS_PER_HOUR
    }

    return (
        <>
            <Title level={2} style={{ color: 'white', marginTop: '1rem' }}>
                Scanspread
            </Title>
            <Title level={4} style={{ color: 'white', marginTop: '1rem' }}>
                Graphs of past months scanning spread over week and day.{' '}
                <span style={{ color: TRIGLAVIAN_RED }}>Red</span> valleys need more scanners. Hours
                are EVE time.
            </Title>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                <div>
                    <Title level={4} style={{ color: 'white', marginTop: '1rem' }}>
                        Per weekday
                    </Title>
                    <ResponsiveContainer
                        width={isTabletOrMobile ? 150 : 300}
                        height={isTabletOrMobile ? 150 : 300}>
                        <BarChart
                            data={perWeek.map((i) => ({
                                x: i.value,
                                y: i.count,
                                color: needsScanningWeek({ x: i.value, y: i.count })
                                    ? TRIGLAVIAN_RED
                                    : HIGHSEC_GREEN
                            }))}
                            onMouseLeave={handleMouseLeave}>
                            <XAxis
                                dataKey="x"
                                tickFormatter={(v) =>
                                    DateTime.local().set({ weekday: v }).toFormat('EEE')
                                }
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const { x, y } = payload[0].payload
                                        return <div>{dayNumberToTooltip({ x, y })}</div>
                                    }
                                    return null
                                }}
                            />
                            <Bar dataKey="y" onMouseOver={(data) => handleMouseOver(data.payload)}>
                                {perWeek.map((i, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            needsScanningWeek({ x: i.value, y: i.count })
                                                ? TRIGLAVIAN_RED
                                                : HIGHSEC_GREEN
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <Title level={4} style={{ color: 'white', marginTop: '1rem' }}>
                        Per hour
                    </Title>
                    <ResponsiveContainer
                        width={isTabletOrMobile ? 150 : 300}
                        height={isTabletOrMobile ? 150 : 300}>
                        <BarChart
                            data={perWeek.map((i) => ({
                                x: i.value,
                                y: i.count,
                                color: needsScanningWeek({ x: i.value, y: i.count })
                                    ? TRIGLAVIAN_RED
                                    : HIGHSEC_GREEN
                            }))}
                            onMouseLeave={handleMouseLeave}>
                            <XAxis
                                dataKey="x"
                                tickFormatter={(v) =>
                                    DateTime.local().set({ weekday: v }).toFormat('EEE')
                                }
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const { x, y } = payload[0].payload
                                        return <div>{dayNumberToTooltip({ x, y })}</div>
                                    }
                                    return null
                                }}
                            />
                            <Bar dataKey="y" onMouseOver={(data) => handleMouseOver(data.payload)}>
                                {perWeek.map((i, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            needsScanningDay({ x: i.value, y: i.count })
                                                ? TRIGLAVIAN_RED
                                                : HIGHSEC_GREEN
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    )
}

export default ScanSpread
