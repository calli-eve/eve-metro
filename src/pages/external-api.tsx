import { Layout, Col, Typography, Card } from 'antd'
import { CodeBlock, dracula } from 'react-code-blocks'

const { Content } = Layout
const { Title, Paragraph } = Typography

const Api = () => {
    return (
        <Layout className="layout">
            <Content className="content">
                <Col
                    span={24}
                    style={{
                        display: 'flex',
                        color: 'white',
                        padding: '1rem',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <Title style={{ color: 'white' }}>EVE Metro API description</Title>

                    <Card
                        title="EVE Metro Connections"
                        extra="GET"
                        style={{ marginTop: '1rem', maxWidth: '40rem' }}>
                        <Paragraph>
                            Endpoint that returns an array of nodes and edges. Nodes are Pochven
                            systems and edges the connected systems.
                        </Paragraph>
                        <Paragraph style={{ color: 'red' }}>
                            Authenticated with x-api-key header. Talk to EVE metro on discord to get
                            an API key.
                        </Paragraph>
                        <CodeBlock
                            text={`
                    curl https://evemetro.com/api/external/nodes -H 'x-api-key: REPLACE_WITH_KEY'
                            `}
                            language="bash"
                            showLineNumbers={false}
                            theme={dracula}
                        />

                        <Paragraph style={{ marginTop: '1rem' }}>Return types</Paragraph>

                        <CodeBlock
                            text={`
                    export type SystemNode = {
                        systemId: SystemId
                        systemName: string
                        systemSecurityStatus: number
                        shipSize: ShipSize
                        systemEdges: SystemEdge[]
                    }

                    export type SystemEdge = {
                        solarSystemIdDst: number
                        solarSystemNameDst: string
                        solarSystemSecDst: number
                        shipSize: ShipSize
                        edgeSource: EdgeSource
                        signatureSrc?: string
                        signatureDst?: string
                        wormholeTypeSrc?: string
                        wormholeTypeDst?: string
                        wormholeMass?: WormholeStatus
                        wormholeEol?: WormholeStatus
                        creatorName?: string
                        createdTime?: string
                        lastSeenTime?: string
                    }

                    export type ShipSize = 
                        'Frigate' | 
                        'Cruiser' | 
                        'Battleship' | 
                        'Freighter' | 
                        'Capital' | 
                        undefined

                    export type SystemId = number

                    export enum EdgeSource {
                        'k-space',
                        'eve-scout',
                        'trig-map'
                    }

                    export type WormholeStatus = 'critical' | 'stable'
                        `}
                            language="typescript"
                            showLineNumbers={false}
                            theme={dracula}
                        />
                    </Card>
                    <Card
                        title="EVE Metro Connections"
                        extra="POST"
                        style={{ marginTop: '1rem', maxWidth: '40rem' }}>
                        <Paragraph>
                            Endpoint that can be used to calculate shortest route between two
                            systems, using EVE Metro data. Returns an array of RouteSystems.
                        </Paragraph>
                        <Paragraph style={{ color: 'red' }}>
                            Authenticated with x-api-key header. Talk to EVE metro on discord to get
                            an API key.
                        </Paragraph>
                        <CodeBlock
                            text={`
                    curl --request POST \\
                    --url https://evemetro.com/api/external/path \\
                    --header 'Content-Type: application/json' \\
                    --header 'x-api-key: REPLACE_WITH_KEY' \\
                    --data '{
                        "startSystemId":30002187,
                        "endSystemId":30000142,
                        "avoidSystemIds":
                            [
                                30005196,
                                30001372
                            ],
                        "useEveScout":true,
                        "preferSafe":false,
                        "shipSize":"Frigate",
                        "avoidWhsReportedExpired":true
                    }'
                            `}
                            language="bash"
                            showLineNumbers={false}
                            theme={dracula}
                        />
                        <Paragraph style={{ marginTop: '1rem' }}>Request types</Paragraph>
                        <CodeBlock
                            text={`
                    export interface CalculateRouteInput {
                        startSystemId: number
                        endSystemId: number
                        avoidSystemIds: number[]
                        useEveScout: boolean
                        shipSize: ShipSize
                        preferSafe: boolean
                        avoidWhsReportedExpired: boolean
                    }
                        `}
                            language="typescript"
                            showLineNumbers={false}
                            theme={dracula}
                        />
                        <Paragraph style={{ marginTop: '1rem' }}>Return types</Paragraph>
                        <CodeBlock
                            text={`
                    export interface RouteSystem {
                        currentSystemId: number
                        currentSystemName: string
                        currentSystemSecurity: number
                        nextSystemName?: string
                        nextSystemSig?: string
                        lifeCritical?: boolean
                        massCritical?: boolean
                    }
                        `}
                            language="typescript"
                            showLineNumbers={false}
                            theme={dracula}
                        />
                    </Card>
                </Col>
            </Content>
        </Layout>
    )
}

export default Api
