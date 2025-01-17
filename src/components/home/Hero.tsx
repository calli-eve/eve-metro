import { Row } from 'antd'

const Hero = () => {
    return (
        <Row className="hero-background">
            <div className="hero-container">
                <div className="hero-title">EVE Metro</div>
                <p className="hero-text">Your shortcut to anywhere in the EVE Universe</p>
                <p className="hero-pitch" style={{ marginTop: '1rem' }}>
                    <a href="https://discord.gg/BmZSy8xGmT" target="_blank" rel="noreferrer">
                        Our Discord - come talk to us!
                    </a>
                </p>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        marginTop: '1rem'
                    }}>
                    <div style={{ fontSize: '1rem', maxWidth: '40rem', textAlign: 'left' }}>
                        - Pay 50 mil ISK to{' '}
                        <a
                            title="Click to copy corp name to clipboard"
                            onClick={() => navigator.clipboard.writeText('EVE Metro Corporation')}>
                            EVE Metro Corporation
                        </a>{' '}
                        and get access!
                    </div>
                    <div style={{ fontSize: '1rem', maxWidth: '40rem', textAlign: 'left' }}>
                        - Thera connections brought to you by{' '}
                        <a href="https://www.eve-scout.com/thera/ ">EVE-Scout</a>
                    </div>
                    <div style={{ fontSize: '1rem', maxWidth: '40rem', textAlign: 'left' }}>
                        - Get access to maintained bookmarks and route planning
                    </div>
                    <div style={{ fontSize: '1rem', maxWidth: '40rem', textAlign: 'left' }}>
                        - Get anywhere in EVE in a matter of a few jumps
                    </div>
                    <div style={{ fontSize: '1rem', maxWidth: '40rem', textAlign: 'left' }}>
                        -{' '}
                        <a title="Click to copy corp name to clipboard" href="external-api">
                            API available
                        </a>{' '}
                        - Talk to EVE metro team on discord
                    </div>
                    <div
                        style={{
                            fontSize: '1rem',
                            maxWidth: '40rem',
                            textAlign: 'left',
                            marginTop: '1rem'
                        }}></div>
                </div>
            </div>
        </Row>
    )
}

export default Hero
