import queryString from 'query-string'
import Router from 'next/router'
import { Button, Typography, Table } from 'antd'
import { useEffect, useState } from 'react'
import { WalletWathcerEntry } from '../../data/wallet'

const RegisterWallet = () => {
    const { Title } = Typography

    const [walletWatcherCharacters, setWalletWatcherCharacters] = useState([])
    const columns = [
        { title: 'Character', dataIndex: 'character_id', key: 'character_id' },
        { title: 'Corporation', dataIndex: 'corp_id', key: 'corp_id' },
        { title: 'Created', dataIndex: 'created_at', key: 'created_at' },
        { title: 'Status', dataIndex: 'status', key: 'status' },
        {
            key: 'delete',
            render: (_: unknown, record: WalletWathcerEntry) => (
                <a
                    className="ant-dropdown-link"
                    onClick={(e) => {
                        e.preventDefault()
                        removeCharacterFromWalletWatcher(record)
                    }}>
                    Delete
                </a>
            )
        }
    ]

    const eveSsoLogin = () => {
        const ssoUrl = `${process.env.NEXT_PUBLIC_EVE_SSO_AUTH_HOST}/v2/oauth/authorize/?`
        const state = Math.random().toString(36).substring(1)
        const request = {
            response_type: 'code',
            redirect_uri: `${process.env.NEXT_PUBLIC_DOMAIN}/redirect`,
            client_id: process.env.NEXT_PUBLIC_EVE_SSO_ID,
            scope: 'publicData esi-wallet.read_corporation_wallets.v1',
            state
        }

        const stringified = queryString.stringify(request)
        sessionStorage.setItem('savedState', state)
        Router.push(`${ssoUrl}${stringified}`)
    }

    const addCharacterToWalletWatcher = () => {
        fetch('/api/admin/wallet', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        }).then((_) => getAllCharactersWithWalletWatcher())
    }

    const removeCharacterFromWalletWatcher = (record: WalletWathcerEntry) => {
        fetch('/api/admin/wallet', {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify(record)
        }).then((_) => getAllCharactersWithWalletWatcher())
    }

    const getAllCharactersWithWalletWatcher = () => {
        fetch('/api/admin/wallet')
            .then((res) => res.json())
            .then(setWalletWatcherCharacters)
    }

    useEffect(() => {
        getAllCharactersWithWalletWatcher()
    }, [])

    return (
        <>
            <Title level={2} style={{ color: 'white', marginTop: '1rem' }}>
                Wallet managemet:
            </Title>
            <Table
                dataSource={walletWatcherCharacters.map((a: WalletWathcerEntry) => {
                    return { ...a, key: `${a.character_id}-wallet` }
                })}
                columns={columns}
            />
            <Button onClick={() => eveSsoLogin()}>Login with walletscope</Button>
            <Button style={{ marginLeft: '1rem' }} onClick={() => addCharacterToWalletWatcher()}>
                Add character to wallet watcher
            </Button>
        </>
    )
}

export default RegisterWallet
