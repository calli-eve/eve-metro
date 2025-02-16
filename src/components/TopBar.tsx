import { MenuOutlined } from '@ant-design/icons'
import { Button, Layout, Menu } from 'antd'
import { useContext, useState, useEffect } from 'react'
import { Session } from '../state/SessionContainer'
import Character from './Character'
import SsoLogin from './SsoLogin'
import { DateTime } from 'luxon'

export const TobBar = ({ activeKey, setActiveKey }) => {
    const { Header } = Layout
    const session = useContext(Session)
    const [collapsed, setCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768)
            if (window.innerWidth > 768) {
                setCollapsed(false)
            }
        }
        
        checkIfMobile()
        window.addEventListener('resize', checkIfMobile)
        return () => window.removeEventListener('resize', checkIfMobile)
    }, [])

    const hideNonSubElements = session?.character?.level === undefined || session?.character?.level < 2
    const hideNonAdminElements = !session?.character?.admin
    const loggedIn = session?.character
    const subbedUntill = session?.character?.subUntill
        ? `Sub untill: ${DateTime.fromISO(session?.character?.subUntill).toISODate()} `
        : ''

    const menuItems = [
        {
            key: '0',
            label: 'Home',
            onClick: () => setActiveKey('0')
        },
        {
            key: '1',
            label: 'Map',
            onClick: () => setActiveKey('1')
        },
        !hideNonSubElements && {
            key: '2',
            label: 'Connections',
            onClick: () => setActiveKey('2')
        },
        !hideNonSubElements && {
            key: '3',
            label: 'Route planner',
            onClick: () => setActiveKey('3')
        },
        {
            key: '4',
            label: 'Scan Stats',
            onClick: () => setActiveKey('4')
        },
        !hideNonAdminElements && {
            key: '5',
            label: 'Admin',
            onClick: () => setActiveKey('5')
        }
    ].filter(Boolean)

    return (
        <Header className="responsive-header">
            <div className="menu-container">
                {isMobile && (
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        className="menu-trigger"
                    />
                )}
                <Menu
                    theme="dark"
                    mode={isMobile ? "vertical" : "horizontal"}
                    selectedKeys={[activeKey]}
                    className={`responsive-menu ${isMobile ? (collapsed ? 'collapsed' : 'mobile') : 'desktop'}`}
                    items={menuItems}
                    disabledOverflow={!isMobile}
                />
            </div>
            <div className="user-section">
                {loggedIn ? <Character setActiveKey={setActiveKey} /> : <SsoLogin />}
                <span className="sub-status">{subbedUntill}</span>
            </div>
        </Header>
    )
}
