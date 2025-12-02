import { Row, Col } from 'antd'
import { Layout } from 'antd'
import { Tabs } from 'antd'
import { TobBar } from '../components/TopBar'
import Map from '../components/map'
import WormholeTable from '../components/connections'
import { useContext, useEffect, useState } from 'react'
import PathFinder from '../components/route-planner/PathFinder'
import { TrigData } from '../state/TrigDataContainer'
import AdminTable from '../components/admin/AdminTable'
import Legend from '../components/map/Legend'
import { Session } from '../state/SessionContainer'
import Stats from '../components/stats'
import Home from '../components/home'

const { Header, Content } = Layout

const Index = () => {
    const trigStorage = useContext(TrigData)
    const session = useContext(Session)
    const [activeKey, setActiveKey] = useState('0')

    const onChangeTab = (key) => {
        if (activeKey === key) return
        window && window.localStorage.setItem('metro_tab', key)
        if (activeKey === '1' || activeKey === '2')
            trigStorage.fetchTrigMap().then().catch(console.log)
        session.fetchCharacter().then().catch(console.log)
        setActiveKey(key)
    }

    useEffect(() => {
        window && setActiveKey(window.localStorage.getItem('metro_tab') ?? activeKey)
        trigStorage.fetchTrigMap().then().catch(console.log)
        session.fetchCharacter().then().catch(console.log)
    }, [])

    const tabItems = [
        {
            key: '0',
            label: '',
            children: <Home />
        },
        {
            key: '1',
            label: '',
            className: 'frame',
            style: { overflow: 'hidden' },
            children: (
                <>
                    <Legend />
                    <div style={{ height: '95vh', overflow: 'hidden' }}>
                        <Map />
                    </div>
                </>
            )
        },
        {
            key: '2',
            label: '',
            style: { padding: '1rem 0.5rem' },
            children: (
                <Row justify="center" align="top">
                    <Col span={2} />
                    <Col span={20} style={{ maxWidth: '1400px' }}>
                        <WormholeTable fetchRoutes={activeKey === '2'} />
                    </Col>
                    <Col span={2} />
                </Row>
            )
        },
        {
            key: '3',
            label: '',
            style: { padding: '1rem 0.5rem' },
            children: (
                <Row justify="center" align="top">
                    <Col span={2} />
                    <Col span={20} style={{ maxWidth: '1400px' }}>
                        <PathFinder />
                    </Col>
                    <Col span={2} />
                </Row>
            )
        },
        {
            key: '4',
            label: '',
            style: { padding: '1rem 0.5rem' },
            children: (
                <Row justify="center" align="top">
                    <Col span={2} />
                    <Col span={20} style={{ maxWidth: '1400px' }}>
                        <Stats />
                    </Col>
                    <Col span={2} />
                </Row>
            )
        },
        {
            key: '5',
            label: '',
            style: { padding: '1rem 0.5rem' },
            children: (
                <Row justify="center" align="top">
                    <Col span={2} />
                    <Col span={20} style={{ maxWidth: '1400px' }}>
                        <AdminTable />
                    </Col>
                    <Col span={2} />
                </Row>
            )
        }
    ]

    return (
        <Layout className="layout">
            <Header className="header flex-end">
                <TobBar activeKey={activeKey} setActiveKey={onChangeTab} />
            </Header>
            <Content className="content">
                <Tabs activeKey={activeKey} renderTabBar={() => <></>} items={tabItems} />
            </Content>
        </Layout>
    )
}

export default Index
