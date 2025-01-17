import queryString from 'query-string'
import Router from 'next/router'
import { Button, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { getCharacter } from '../../data/esiClient'

interface EmailBotState {
    character_name: string
    character_id: number
    created_at?: string
    status?: string
}

const RegisterEmailBot = () => {
    const { Title } = Typography

    const [emailBotCharacter, setEmailBotCharacter] = useState<EmailBotState>(undefined)

    const eveSsoLogin = () => {
        const ssoUrl = `${process.env.NEXT_PUBLIC_EVE_SSO_AUTH_HOST}/v2/oauth/authorize/?`
        const state = Math.random().toString(36).substring(1)
        const request = {
            response_type: 'code',
            redirect_uri: `${process.env.NEXT_PUBLIC_DOMAIN}/redirect`,
            client_id: process.env.NEXT_PUBLIC_EVE_SSO_ID,
            scope: 'esi-mail.send_mail.v1',
            state
        }

        const stringified = queryString.stringify(request)
        sessionStorage.setItem('savedState', state)
        Router.push(`${ssoUrl}${stringified}`)
    }

    const addCharacterAsEmailBot = () => {
        fetch('/api/admin/email', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        }).then((_) => getEmailBotCharacter())
    }

    const disableEmailBot = () => {
        fetch('/api/admin/email', {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({})
        }).then((_) => getEmailBotCharacter())
    }

    const getEmailBotCharacter = async () => {
        try {
            const bots = await fetch('/api/admin/email').then((res) => res.json())

            if (bots.length === 0) return setEmailBotCharacter(undefined)

            const character = await getCharacter(bots[0].character_id)
            setEmailBotCharacter({
                ...bots[0],
                character_name: character.name
            })
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        getEmailBotCharacter()
    }, [])

    return (
        <>
            <Title level={2} style={{ color: 'white', marginTop: '1rem' }}>
                Email bot:
            </Title>
            {emailBotCharacter && (
                <div
                    style={{
                        padding: '1rem',
                        color: 'black',
                        background: 'white',
                        marginBottom: '1rem',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                    <div>Character: {emailBotCharacter.character_name}</div>
                    <div>Status: {emailBotCharacter.status}</div>
                </div>
            )}
            <Button onClick={() => eveSsoLogin()}>Login with email scope</Button>
            <Button style={{ marginLeft: '1rem' }} onClick={() => addCharacterAsEmailBot()}>
                Add character as the email bot
            </Button>
            <Button style={{ marginLeft: '1rem' }} onClick={() => disableEmailBot()}>
                Disable email bot
            </Button>
        </>
    )
}

export default RegisterEmailBot
