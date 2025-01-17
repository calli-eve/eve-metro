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
import Item from 'antd/lib/list/Item'

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

    return (
        <Layout className="layout">
            <Header className="header flex-end">
                <TobBar activeKey={activeKey} setActiveKey={onChangeTab} />
            </Header>
            <Content className="content">
                <Tabs activeKey={activeKey} renderTabBar={() => <></>}>
                    <Item key="0">
                        <Home />
                    </Item>
                    <Item key="1" className="frame" style={{ overflow: 'hidden' }}>
                        <Legend />
                        <div style={{ height: '95vh', overflow: 'hidden' }}>
                            <Map />
                        </div>
                    </Item>
                    <Item key="2" style={{ padding: '1rem 0.5rem' }}>
                        <Row justify="center" align="top">
                            <Col span={2} />
                            <Col span={20} style={{ maxWidth: '1400px' }}>
                                <WormholeTable fetchRoutes={activeKey === '2'} />
                            </Col>
                            <Col span={2} />
                        </Row>
                    </Item>
                    <Item key="3" style={{ padding: '1rem 0.5rem' }}>
                        <Row justify="center" align="top">
                            <Col span={2} />
                            <Col span={20} style={{ maxWidth: '1400px' }}>
                                <PathFinder />
                            </Col>
                            <Col span={2} />
                        </Row>
                    </Item>
                    <Item key="4" style={{ padding: '1rem 0.5rem' }}>
                        <Row justify="center" align="top">
                            <Col span={2} />
                            <Col span={20} style={{ maxWidth: '1400px' }}>
                                <Stats />
                            </Col>
                            <Col span={2} />
                        </Row>
                    </Item>
                    <Item key="5" style={{ padding: '1rem 0.5rem' }}>
                        <Row justify="center" align="top">
                            <Col span={2} />
                            <Col span={20} style={{ maxWidth: '1400px' }}>
                                <AdminTable />
                            </Col>
                            <Col span={2} />
                        </Row>
                    </Item>
                </Tabs>
            </Content>
        </Layout>
    )
}

export default Index
