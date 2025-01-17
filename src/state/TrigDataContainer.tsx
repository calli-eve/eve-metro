import { createContext, useEffect, useState } from 'react'
import { fetchSov, fetchSystems } from '../components/route-planner/utils'
import { TRIG_SYSTEM_IDS } from '../const'
import { Sov } from '../data/esiClient'
import { TrigResponse } from '../types/trig'
import { SimpleSystem } from '../types/types'

export const useTrigData = () => {
    const [trigData, setTrigData] = useState<TrigResponse>(undefined)
    const [boing, setBoing] = useState(false)
    const [boingCount, setBoingCount] = useState(0)
    const [selectedSystem, setSelectedSystem] = useState<number | undefined>(undefined)
    const [systems, setSystems] = useState<SimpleSystem[]>([])
    const [sov, setSov] = useState<Sov[]>([])

    useEffect(() => {
        fetchSystems().then(setSystems).catch(console.log)
        fetchSov().then(setSov).catch(console.log)
    }, [])

    const fetchTrigMap = async () =>
        await fetch('/api/data/trig')
            .then((res) => res.json())
            .then(setTrigData)
            .catch(console.log)

    const clearTrigData = () => {
        setTrigData(undefined)
    }

    const boingTrigData = () => {
        const trigDataWithoutEdges = {
            ...trigData,
            nodes: trigData.nodes.filter((n) => TRIG_SYSTEM_IDS.some((id) => id === n.id))
        }
        setBoing(true)
        setBoingCount(boingCount + 1)
        setTrigData(trigDataWithoutEdges)
        fetchTrigMap()
    }

    return {
        trigData,
        fetchTrigMap,
        clearTrigData,
        boing,
        boingTrigData,
        boingCount,
        setBoingCount,
        selectedSystem,
        setSelectedSystem,
        systems,
        sov
    }
}
export const TrigData = createContext(null)
