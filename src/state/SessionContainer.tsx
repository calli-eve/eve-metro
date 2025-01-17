import { createContext, useState } from 'react'
import { SessionCharacter } from '../types/types'

export const useSession = () => {
    const [character, setCharacter] = useState<SessionCharacter>(undefined)

    const fetchCharacter = async () => {
        try {
            const response = await fetch('/api/auth/user', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            const character = await response.json()
            setCharacter(character)
        } catch (e) {
            setCharacter(undefined)
        }
    }

    const logout = async () => {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })
        setCharacter(undefined)
    }

    return { character, setCharacter, logout, fetchCharacter }
}
export const Session = createContext(null)
