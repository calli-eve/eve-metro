export interface TrigResponse {
    nodes: Node[]
    edges: Edge[]
    connections: Connection[]
}

export interface Connection {
    id: number
    pochvenSystemId: number
    pochvenSystemName: string
    pochvenWormholeType?: string
    pochvenSignature?: string
    externalSystemId: number
    externalSystemName: string
    externalWormholeType?: string
    externalSignature?: string
    createdTime: string
    massCritical: boolean
    timeCritical: boolean
    comment?: string
    timeCriticalTime?: string
    already_expired_reports?: [
        {
            time: string
            userId: number
        }
    ]
}

export interface Edge {
    from: number
    to: number
}

export interface Node {
    label: string
    id: number
    x?: number
    y?: number
    fixed?: Fixed
    physics: boolean
    edges: Connection[]
    color?: string
}

export interface Fixed {
    x: boolean
    y: boolean
}
