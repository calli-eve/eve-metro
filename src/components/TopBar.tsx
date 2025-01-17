import { DownOutlined } from '@ant-design/icons'
import { Dropdown, Layout, Menu } from 'antd'
import { useContext, useState } from 'react'
import { Session } from '../state/SessionContainer'
import Character from './Character'
import SsoLogin from './SsoLogin'
import { DateTime } from 'luxon'

export const TobBar = ({ activeKey, setActiveKey }) => {
    const { Header } = Layout
    const session = useContext(Session)
    const [menuOpen, setMenuOpen] = useState(false)

    const hideNonSubElements = session?.character?.level < 2
    const hideNonAdminElements = !session?.character?.admin
    const loggedIn = session?.character
    const subbedUntill = session?.character?.subUntill
        ? `Sub untill: ${DateTime.fromISO(session?.character?.subUntill).toISODate()} `
        : ''

    const menuDesktop = (
        <Menu className="desktop-menu" theme="dark" mode="horizontal" selectedKeys={[activeKey]}>
            <Menu.Item onClick={() => setActiveKey('0')} key="0">
                <a>Home</a>
            </Menu.Item>
            <Menu.Item onClick={() => setActiveKey('1')} key="1">
                Map
            </Menu.Item>
            <Menu.Item
                hidden={hideNonSubElements}
                onClick={() => {
                    setActiveKey('2')
                }}
                key="2">
                Connections
            </Menu.Item>
            <Menu.Item hidden={hideNonSubElements} onClick={() => setActiveKey('3')} key="3">
                Route planner
            </Menu.Item>
            <Menu.Item onClick={() => setActiveKey('4')} key="4">
                Scan Stats
            </Menu.Item>
            <Menu.Item hidden={hideNonAdminElements} onClick={() => setActiveKey('5')} key="5">
                Admin
            </Menu.Item>
            <Menu.Item style={{ display: 'flex', padding: '0', marginLeft: '1rem' }} key="6">
                {loggedIn ? <Character setActiveKey={setActiveKey} /> : <SsoLogin />}
                {subbedUntill}
            </Menu.Item>
        </Menu>
    )

    const menuMobile = (
        <Menu
            theme="dark"
            mode="vertical"
            selectedKeys={[activeKey]}
            style={{ width: '100vw', display: 'flex', flexDirection: 'column' }}>
            <Menu.Item
                onClick={() => {
                    setActiveKey('0')
                    setMenuOpen(false)
                }}
                key="0">
                <a>Home</a>
            </Menu.Item>
            <Menu.Item
                onClick={() => {
                    setActiveKey('1')
                    setMenuOpen(false)
                }}
                key="1">
                Map
            </Menu.Item>

            <Menu.Item
                hidden={hideNonSubElements}
                onClick={() => {
                    setActiveKey('2')
                    setMenuOpen(false)
                }}
                key="2">
                Connections
            </Menu.Item>

            <Menu.Item
                hidden={hideNonSubElements}
                onClick={() => {
                    setActiveKey('3')
                    setMenuOpen(false)
                }}
                key="3">
                Route planner
            </Menu.Item>

            <Menu.Item
                onClick={() => {
                    setActiveKey('4')
                    setMenuOpen(false)
                }}
                key="4">
                Scan stats
            </Menu.Item>
            <Menu.Item
                hidden={hideNonAdminElements}
                onClick={() => {
                    setActiveKey('5')
                    setMenuOpen(false)
                }}
                key="5">
                Admin
            </Menu.Item>
            <Menu.Item style={{ alignSelf: 'flex-end' }}>
                {loggedIn ? <Character setActiveKey={setActiveKey} /> : <SsoLogin />}
                {subbedUntill}
            </Menu.Item>
        </Menu>
    )

    return (
        <Header className="header" style={{ display: 'flex', padding: '0' }}>
            {menuDesktop}
            <div className="mobile-menu">
                <Dropdown overlay={menuMobile} onOpenChange={setMenuOpen} open={menuOpen}>
                    <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
                        Menu <DownOutlined />
                    </a>
                </Dropdown>
            </div>
        </Header>
    )
}
