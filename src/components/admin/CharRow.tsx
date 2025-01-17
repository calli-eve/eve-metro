import { useEffect, useState } from 'react'
import { getCharacter } from '../../data/esiClient'

const CharRow = ({ id, showId = true }) => {
    const [char, setChar] = useState(undefined)
    useEffect(() => {
        getCharacter(id)
            .then(setChar)
            .catch((e) => console.log('failed getting character: ', id))
    }, [])
    return (
        <div>
            {showId && <div>{id}</div>}
            {char && (
                <a
                    title="Click to copy to clipboard"
                    className="ant-dropdown-link"
                    onClick={(e) => {
                        navigator.clipboard.writeText(`${char.name}`)
                    }}>
                    {char.name}
                </a>
            )}
        </div>
    )
}

export default CharRow
