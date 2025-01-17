import { Button, Avatar, Image } from 'antd'
import { useContext } from 'react'
import { Session } from '../state/SessionContainer'
import { TrigData } from '../state/TrigDataContainer'
import { DateTime } from 'luxon'
import { useRouter } from 'next/router'

const Character = ({ setActiveKey }) => {
    const session = useContext(Session)
    const trig = useContext(TrigData)
    const router = useRouter()
    return (
        <div
            className={'CharacterContainer'}
            title={
                session.character.subUntill
                    ? `Subbed untill ${DateTime.fromISO(session.character.subUntill).toISODate()}`
                    : 'Logout'
            }>
            <Avatar
                className="avatar"
                src={
                    <Image
                        src={`${process.env.NEXT_PUBLIC_EVE_IMAGES_API_HOST}/characters/${session.character.CharacterID}/portrait?size=64`}
                    />
                }
            />
            <Button
                style={{ padding: 0 }}
                type="link"
                className="LogoutButton"
                onClick={() => {
                    session
                        .logout()
                        .then()
                        .catch()
                        .finally(() => {
                            trig.clearTrigData()
                            setActiveKey('0')
                            router.reload()
                        })
                }}>
                <span className="Logout">Logout</span>
            </Button>
            <style jsx>{`
                .Logout {
                    font-size: 1.2rem;
                }
                .LogoutButton {
                    padding: 0;
                }
                .CharacterContainer {
                    display: flex;
                    align-items: center;
                    padding: 1rem;
                }
            `}</style>
        </div>
    )
}

export default Character
