import { Layout } from 'antd'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const RedirectSession = ({ code, state }) => {
    const router = useRouter()

    useEffect(() => {
        const savedState = sessionStorage.getItem('savedState')
        if (code && state && savedState === state) {
            sessionStorage.removeItem('savedState')
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: code })
            })
                .then()
                .finally(() => router.push('/'))
        } else {
            router.push('/')
        }
    }, [])

    return <></>
}

const Redirect = () => {
    const router = useRouter()
    const { code, state } = router.query
    const { Header } = Layout

    if (typeof window === 'undefined') {
        return null
    }

    if (!code && !state) return null

    return (
        <Layout className="layout">
            <Header className="header flex-end">
                <RedirectSession code={code} state={state} />
            </Header>
        </Layout>
    )
}

export default Redirect
