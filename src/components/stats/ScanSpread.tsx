import { useEffect, useState } from 'react'
import { Typography } from 'antd'
import { DateTime } from 'luxon'
import { useMediaQuery } from 'react-responsive'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts'
import { HIGHSEC_GREEN, TRIGLAVIAN_RED } from '../../const'

interface ScanSpreadItem {
    value: string | number
    count: number
}

const MINIMUM_SIGS_PER_WEEKDAY = 40
const MINIMUM_SIGS_PER_HOUR = 5

const ScanSpread = () => {
    const { Title } = Typography

    const [perWeek, setPerWeek] = useState<ScanSpreadItem[]>([])
    const [perDay, setPerDay] = useState<ScanSpreadItem[]>([])

    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })

    const fetchData = async () => {
        await fetch('/api/stats/weekly')
            .then((res) => res.json())
            .then((res) => {
                setPerWeek(
                    [...Array(7).keys()].map((i) => {
                        const valueFromDb = res.find((r) => parseInt(r.value) === i + 1)
                        return {
                            value: DateTime.local().set({ weekday: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 }).toFormat('EEE'),
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
                        const valueFromDb = res.find((r) => parseInt(r.value) === i + 1)
                        return {
                            value: DateTime.local().set({ hour: i + 1 }).toFormat('HH'),
                            count: valueFromDb?.count ? parseInt(valueFromDb?.count) : 0
                        }
                    })
                )
            )
    }

    useEffect(() => {
        fetchData().then().catch(console.log)
    }, [])

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

    const getBarColor = (value) => {
        return value < MINIMUM_SIGS_PER_HOUR ? TRIGLAVIAN_RED : HIGHSEC_GREEN
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
                        <BarChart width={isTabletOrMobile ? 150 : 300}
                            height={isTabletOrMobile ? 150 : 300}
                            data={perWeek}>
                            <XAxis dataKey="value" />
                            <Bar dataKey="count">
                            {perWeek.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={needsScanningWeek(entry.value) ? TRIGLAVIAN_RED : HIGHSEC_GREEN} />
                            ))}
                            </Bar>
                                
                        </BarChart>
                </div>
                <div>
                    <Title level={4} style={{ color: 'white', marginTop: '1rem' }}>
                        Per hour
                    </Title>
                        <BarChart
                        width={isTabletOrMobile ? 150 : 300}
                        height={isTabletOrMobile ? 150 : 300}
                            data={perDay}>
                            <XAxis
                                dataKey="value"
                          
                            />
                            <Bar dataKey="count"> 
                            {perDay.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={needsScanningDay(entry.value) ? TRIGLAVIAN_RED : HIGHSEC_GREEN} />
                            ))}
                            </Bar>
                        </BarChart>
                </div>
            </div>
        </>
    )
}

export default ScanSpread
