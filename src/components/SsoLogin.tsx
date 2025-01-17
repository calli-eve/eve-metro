import queryString from 'query-string'
import Router from 'next/router'

const SsoLogin = () => {
    function eveSsoLogin() {
        const ssoUrl = `${process.env.NEXT_PUBLIC_EVE_SSO_AUTH_HOST}/v2/oauth/authorize/?`
        const state = Math.random().toString(36).substring(1)
        const request = {
            response_type: 'code',
            redirect_uri: `${process.env.NEXT_PUBLIC_DOMAIN}/redirect`,
            client_id: process.env.NEXT_PUBLIC_EVE_SSO_ID,
            scope: 'publicData',
            state
        }

        const stringified = queryString.stringify(request)
        sessionStorage.setItem('savedState', state)
        Router.push(`${ssoUrl}${stringified}`)
    }

    return (
        <>
            <img src="/img/eve-sso-login-white-small.png" onClick={() => eveSsoLogin()} />
        </>
    )
}

export default SsoLogin
