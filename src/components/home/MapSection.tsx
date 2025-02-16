import {
    RocketOutlined,
    CompassOutlined,
    MoneyCollectOutlined,
    CrownOutlined
} from '@ant-design/icons'
import { Card, List } from 'antd'

const listCopy = [
    <a
        key="list-item-1"
        onClick={() => {
            navigator.clipboard.writeText('EVE Metro')
        }}>
        1. Join in-game channel: EVE Metro. Click to copy channel name to clipboard
    </a>,
    <a
        key="list-item-2"
        onClick={() => {
            navigator.clipboard.writeText('EVE Metro Corporation')
        }}>
        2. Transfer 50 million ISK to EVE Metro Corporation. Click to copy corp name to clipboard
    </a>,
    <div key="list-item-3">
        3. Your access to the Mapper and Route Planner tool updates in 30 minutes
    </div>,
    <div key="list-item-4">
        4. Your access to BM folders updates in 24 hours. Link to bookmark folder in EVE Metro
        channel
    </div>,
    <a key="list-item-5" href="https://pochven.electusmatari.com/" target="_blank" rel="noreferrer">
        Want to know more how T-Space works? Check out Pochven entry manual!
    </a>
]

const MapSection = () => {
    return (
        <div
            className="map-section"
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
            <div className="how-to-section">
                <h1 style={{ color: 'white', fontSize: '2rem', marginTop: '4rem' }}>How to:</h1>
                <List
                    dataSource={listCopy}
                    renderItem={(item) => <List.Item style={{ color: 'white' }}>{item}</List.Item>}
                />
            </div>
            <div>
                <img
                    src="img/evemetro_logo.png"
                    style={{ maxWidth: '400px', padding: '4rem 1rem' }}
                />
            </div>
            <div className="feature-container">
                <Card style={{ margin: '1rem', width: '300px' }} hoverable>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                        <RocketOutlined style={{ display: 'flex', justifyContent: 'center', fontSize: '4rem', marginBottom: '1rem' }} />
                        From Jita to Amarr in less than 12 jumps 90% of the time
                    </div>
                </Card>
                <Card hoverable style={{ margin: '1rem', width: '300px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                        <CompassOutlined style={{ display: 'flex', justifyContent: 'center', fontSize: '4rem', marginBottom: '1rem' }} />
                        Return from anywhere in EVE to Highsec with filaments in few minutes
                    </div>
                </Card>
                <Card hoverable style={{ margin: '1rem', width: '300px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                        <MoneyCollectOutlined style={{ display: 'flex', justifyContent: 'center', fontSize: '4rem', marginBottom: '1rem' }} />
                        Service available to individual pilots for 50 million ISK / month
                    </div>
                </Card>
                <Card hoverable style={{ margin: '1rem', width: '300px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                        <CrownOutlined style={{ display: 'flex', justifyContent: 'center', fontSize: '4rem', marginBottom: '1rem' }} />
                        Corporations: Come talk to us{' '}
                        <a href="https://discord.gg/BmZSy8xGmT" target="_blank" rel="noreferrer">
                            in EVE Metro Discord
                        </a>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default MapSection
