import Head from 'next/head'

import 'antd/dist/antd.css'
import '../styles/global.css'
import { Session, useSession } from '../state/SessionContainer'
import { TrigData, useTrigData } from '../state/TrigDataContainer'
import { Toaster } from 'react-hot-toast'

const _APP = ({ Component, pageProps }) => {
    const session = useSession()
    const trigData = useTrigData()
    return (
        <>
            <script>0</script>
            <Head>
                <title>EVE Metro</title>
                <meta name="keywords" content="eveonline, eve, pochven, mapper, wh, triglavian" />
                <meta
                    name="description"
                    content="EVE Metro - EVE online Pochven map, wormholes and connections service. Access every part of eve fast. Find the shortest route to anywhere. Pochven mapper."></meta>
                <link rel="icon" href="/img/favicon.ico" />
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.css"
                    rel="stylesheet"
                />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
                <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
                <script
                    defer
                    data-domain="evemetro.com"
                    src="https://plausible.io/js/script.js"></script>
            </Head>
            <Session.Provider value={session}>
                <TrigData.Provider value={trigData}>
                    <Component {...pageProps} />
                </TrigData.Provider>
                <Toaster />
            </Session.Provider>
        </>
    )
}

export default _APP
