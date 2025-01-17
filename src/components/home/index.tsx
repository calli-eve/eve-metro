import { Col } from 'antd'
import Hero from './Hero'
import MapSection from './MapSection'

const Home = () => {
    return (
        <>
            <Hero />
            <MapSection />
            <Col
                span={24}
                style={{
                    display: 'flex',
                    backgroundColor: '#001529',
                    color: 'white',
                    fontSize: '0.6rem',
                    justifyContent: 'space-around',
                    padding: '1rem'
                }}>
                <div>All EVE related materials are property of CCP Games</div>
                <div>Brought to you by EVE Metro team 2022</div>
                <div>
                    EVE Metro uses{' '}
                    <span
                        style={{
                            margin: '0 0.3rem',
                            fontStyle: 'italic',
                            color: '#1890ff'
                        }}>
                        av_ses
                    </span>
                    - cookie to store your session.
                </div>
            </Col>
        </>
    )
}

export default Home
