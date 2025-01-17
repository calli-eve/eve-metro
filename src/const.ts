import { Breakpoint } from 'antd/lib/_util/responsiveObserve'

export const MONTHLY_FEE = 50000000

export const TRIG_SYSTEM_IDS = [
    30002702, 30005029, 30003046, 30045329, 30002797, 30001381, 30002652, 30000206, 30020141,
    30045328, 30000021, 30002770, 30002225, 30003504, 30003495, 30002411, 30001413, 30040141,
    30000192, 30002079, 30002737, 30001445, 30001372, 30000157, 30005005, 30031392, 30010141
]

export const VELES_IDS = [
    30002702, 30003046, 30045329, 30002797, 30001381, 30005029, 30002652, 30000206, 30020141
]

export const PERUN_IDS = [
    30010141, 30031392, 30005005, 30000157, 30001372, 30001445, 30002737, 30002079, 30000192
]

export const SVAROG_IDS = [
    30045328, 30000021, 30002770, 30002225, 30003504, 30003495, 30002411, 30001413, 30040141
]

export const CONNECTS_TO_AMARR_IDS = [30003495, 30003504, 30002225]

export const CONNECTS_TO_CALDARI_IDS = [
    30002770, 30045328, 30020141, 30000206, 30045329, 30002797, 30001381, 30010141, 30031392,
    30000157, 30001372, 30001445, 30002737, 30000192, 30040141, 30001413
]

export const CONNECTS_TO_GALLENTE_IDS = [30002652, 30005029, 30002702, 30003046, 30005005]

export const CONNECTS_TO_MINMATAR_IDS = [30002411, 30002079]

export const VELES_COLOR = '#447228'

export const PERUN_COLOR = '#244184'

export const SVAROG_COLOR = '#c91912'

export const getTrigSystemColor = (systemId: number) => {
    if (VELES_IDS.some((v) => v === systemId)) return VELES_COLOR
    if (PERUN_IDS.some((p) => p === systemId)) return PERUN_COLOR
    return SVAROG_COLOR
}

export const SHIP_MASSES = {
    Frigate: 5000000,
    Cruiser: 20000000,
    Battleship: 300000000,
    Freighter: 1000000000,
    Capital: 1350000000
}
export const TRIGLAVIAN_RED = '#c91912'
export const NULLSEC_RED = '#c91912'
export const LOWSEC_YELLOW = '#de581f'
export const HIGHSEC_GREEN = '#42a34c'
export const JSPACE_BLUE = '#009dff'

export const THERA_SYSTEM_ID = 31000005
export const TURNUR_SYSTEM_ID = 30002086

export const NON_CAPITAL_SYSTEM_CLASSES_EVE = [1, 2, 3, 4, 13]

export const POCHVEN_HOLE_TYPES = ['K162', 'C729', 'U372', 'F216', 'R081', 'X450']

export const SESSION_KEY = 'av_session'

export const WH_TYPES = {
    K162: { life: '16 Hours', leadsTo: 'Unknown', mass: 3000000000, jump: 1350000000 },
    H296: { life: '24 Hours', leadsTo: 'Class 5', mass: 3000000000, jump: 1350000000 },
    B274: { life: '24 Hours', leadsTo: 'High-Sec', mass: 2000000000, jump: 300000000 },
    B041: { life: '48 Hours', leadsTo: 'Class 6', mass: 3000000000, jump: 1000000000 },
    U319: { life: '48 Hours', leadsTo: 'Class 6', mass: 3000000000, jump: 1800000000 },
    Z142: { life: '16 Hours', leadsTo: 'Null-Sec', mass: 3000000000, jump: 1350000000 },
    N944: { life: '24 Hours', leadsTo: 'Low-Sec', mass: 3000000000, jump: 1350000000 },
    N770: { life: '24 Hours', leadsTo: 'Class 5', mass: 3000000000, jump: 300000000 },
    X702: { life: '24 Hours', leadsTo: 'Class 3', mass: 1000000000, jump: 300000000 },
    N290: { life: '24 Hours', leadsTo: 'Low-Sec', mass: 3000000000, jump: 1800000000 },
    N110: { life: '24 Hours', leadsTo: 'High-Sec', mass: 1000000000, jump: 20000000 },
    N062: { life: '24 Hours', leadsTo: 'Class 5', mass: 3000000000, jump: 300000000 },
    M555: { life: '24 Hours', leadsTo: 'Class 5', mass: 3000000000, jump: 1000000000 },
    L614: { life: '24 Hours', leadsTo: 'Class 5', mass: 1000000000, jump: 20000000 },
    N432: { life: '24 Hours', leadsTo: 'Class 5', mass: 3000000000, jump: 1350000000 },
    O128: { life: '24 Hours', leadsTo: 'Class 4', mass: 1000000000, jump: 300000000 },
    R474: { life: '24 Hours', leadsTo: 'Class 6', mass: 3000000000, jump: 300000000 },
    S047: { life: '24 Hours', leadsTo: 'High-Sec', mass: 3000000000, jump: 300000000 },
    Z060: { life: '16 Hours', leadsTo: 'Null-Sec', mass: 1000000000, jump: 20000000 },
    W237: { life: '24 Hours', leadsTo: 'Class 6', mass: 3000000000, jump: 1350000000 },
    V911: { life: '24 Hours', leadsTo: 'Class 5', mass: 3000000000, jump: 1350000000 },
    V753: { life: '24 Hours', leadsTo: 'Class 6', mass: 3000000000, jump: 1350000000 },
    V283: { life: '16 Hours', leadsTo: 'Null-Sec', mass: 3000000000, jump: 1000000000 },
    U574: { life: '24 Hours', leadsTo: 'Class 6', mass: 3000000000, jump: 300000000 },
    U210: { life: '24 Hours', leadsTo: 'Low-Sec', mass: 3000000000, jump: 300000000 },
    S804: { life: '24 Hours', leadsTo: 'Class 6', mass: 1000000000, jump: 20000000 },
    S199: { life: '16 Hours', leadsTo: 'Null-Sec', mass: 3000000000, jump: 1350000000 },
    K346: { life: '16 Hours', leadsTo: 'Null-Sec', mass: 3000000000, jump: 300000000 },
    K329: { life: '16 Hours', leadsTo: 'Null-Sec', mass: 5000000000, jump: 1800000000 },
    D792: { life: '24 Hours', leadsTo: 'High-Sec', mass: 3000000000, jump: 1000000000 },
    D845: { life: '24 Hours', leadsTo: 'High-Sec', mass: 5000000000, jump: 300000000 },
    B520: { life: '48 Hours', leadsTo: 'High-Sec', mass: 3000000000, jump: 1350000000 },
    E545: { life: '16 Hours', leadsTo: 'Null-Sec', mass: 2000000000, jump: 300000000 },
    A982: { life: '24 Hours', leadsTo: 'Class 6', mass: 3000000000, jump: 300000000 },
    A239: { life: '24 Hours', leadsTo: 'Low-Sec', mass: 2000000000, jump: 300000000 },
    C140: { life: '24 Hours', leadsTo: 'Low-Sec', mass: 3000000000, jump: 1350000000 },
    H900: { life: '24 Hours', leadsTo: 'Class 5', mass: 3000000000, jump: 300000000 },
    C391: { life: '48 Hours', leadsTo: 'Low-Sec', mass: 3000000000, jump: 1000000000 },
    C248: { life: '16 Hours', leadsTo: 'Null-Sec', mass: 3000000000, jump: 1350000000 },
    J244: { life: '24 Hours', leadsTo: 'Low-Sec', mass: 1000000000, jump: 20000000 },
    V301: { life: '16 Hours', leadsTo: 'Class 1', mass: 500000000, jump: 20000000 },
    B449: { life: '16 Hours', leadsTo: 'High-Sec', mass: 2000000000, jump: 1000000000 },
    C125: { life: '16 Hours', leadsTo: 'Class 2', mass: 1000000000, jump: 20000000 },
    L477: { life: '16 Hours', leadsTo: 'Class 3', mass: 2000000000, jump: 300000000 },
    X877: { life: '16 Hours', leadsTo: 'Class 4', mass: 2000000000, jump: 300000000 },
    Y683: { life: '16 Hours', leadsTo: 'Class 4', mass: 2000000000, jump: 300000000 },
    Y790: { life: '16 Hours', leadsTo: 'Class 1', mass: 500000000, jump: 20000000 },
    A641: { life: '16 Hours', leadsTo: 'High-Sec', mass: 2000000000, jump: 1000000000 },
    Z457: { life: '16 Hours', leadsTo: 'Class 4', mass: 2000000000, jump: 300000000 },
    Z647: { life: '16 Hours', leadsTo: 'Class 1', mass: 500000000, jump: 20000000 },
    Z971: { life: '16 Hours', leadsTo: 'Class 1', mass: 100000000, jump: 20000000 },
    C247: { life: '16 Hours', leadsTo: 'Class 3', mass: 2000000000, jump: 300000000 },
    T405: { life: '16 Hours', leadsTo: 'Class 4', mass: 2000000000, jump: 300000000 },
    M267: { life: '16 Hours', leadsTo: 'Class 3', mass: 1000000000, jump: 300000000 },
    M609: { life: '16 Hours', leadsTo: 'Class 4', mass: 1000000000, jump: 20000000 },
    H121: { life: '16 Hours', leadsTo: 'Class 1', mass: 500000000, jump: 20000000 },
    G024: { life: '16 Hours', leadsTo: 'Class 2', mass: 2000000000, jump: 300000000 },
    N766: { life: '16 Hours', leadsTo: 'Class 2', mass: 2000000000, jump: 300000000 },
    E175: { life: '16 Hours', leadsTo: 'Class 4', mass: 2000000000, jump: 300000000 },
    N968: { life: '16 Hours', leadsTo: 'Class 3', mass: 2000000000, jump: 300000000 },
    O477: { life: '16 Hours', leadsTo: 'Class 3', mass: 2000000000, jump: 300000000 },
    O883: { life: '16 Hours', leadsTo: 'Class 3', mass: 1000000000, jump: 20000000 },
    P060: { life: '16 Hours', leadsTo: 'Class 1', mass: 500000000, jump: 20000000 },
    Q317: { life: '16 Hours', leadsTo: 'Class 1', mass: 500000000, jump: 20000000 },
    R051: { life: '16 Hours', leadsTo: 'Low-Sec', mass: 3000000000, jump: 1000000000 },
    D382: { life: '16 Hours', leadsTo: 'Class 2', mass: 2000000000, jump: 300000000 },
    R943: { life: '16 Hours', leadsTo: 'Class 2', mass: 750000000, jump: 300000000 },
    D364: { life: '16 Hours', leadsTo: 'Class 2', mass: 1000000000, jump: 300000000 },
    I182: { life: '16 Hours', leadsTo: 'Class 2', mass: 2000000000, jump: 300000000 },
    Q003: { life: '16 Hours', leadsTo: 'Null-Sec', mass: 1000000000, jump: 5000000 },
    E004: { life: '16 Hours', leadsTo: 'Class 1', mass: 1000000000, jump: 5000000 },
    L005: { life: '16 Hours', leadsTo: 'Class 2', mass: 1000000000, jump: 5000000 },
    Z006: { life: '16 Hours', leadsTo: 'Class 3', mass: 1000000000, jump: 5000000 },
    M001: { life: '16 Hours', leadsTo: 'Class 4', mass: 1000000000, jump: 5000000 },
    C008: { life: '16 Hours', leadsTo: 'Class 5', mass: 1000000000, jump: 5000000 },
    G008: { life: '16 Hours', leadsTo: 'Class 6', mass: 1000000000, jump: 5000000 },
    A009: { life: '16 Hours', leadsTo: 'Class 13', mass: 500000000, jump: 5000000 },
    L031: { life: '16 Hours', leadsTo: 'Thera', mass: 3000000000, jump: 1000000000 },
    T458: { life: '16 Hours', leadsTo: 'Thera', mass: 500000000, jump: 20000000 },
    F135: { life: '16 Hours', leadsTo: 'Thera', mass: 750000000, jump: 300000000 },
    F353: { life: '16 Hours', leadsTo: 'Thera', mass: 100000000, jump: 20000000 },
    M164: { life: '16 Hours', leadsTo: 'Thera', mass: 2000000000, jump: 300000000 },
    Q063: { life: '16 Hours', leadsTo: 'High-Sec', mass: 500000000, jump: 20000000 },
    V898: { life: '16 Hours', leadsTo: 'Low-Sec', mass: 2000000000, jump: 300000000 },
    E587: { life: '16 Hours', leadsTo: 'Null-Sec', mass: 3000000000, jump: 1000000000 },
    B735: { life: '16 Hours', leadsTo: 'Class 15', mass: 750000000, jump: 300000000 },
    C414: { life: '16 Hours', leadsTo: 'Class 17', mass: 750000000, jump: 300000000 },
    R259: { life: '16 Hours', leadsTo: 'Class 18', mass: 750000000, jump: 300000000 },
    S877: { life: '16 Hours', leadsTo: 'Class 14', mass: 750000000, jump: 300000000 },
    V928: { life: '16 Hours', leadsTo: 'Class 16', mass: 750000000, jump: 300000000 },
    U372: { life: '16 Hours', leadsTo: 'Pochven', mass: 1000000000, jump: 375000000 },
    F216: {
        life: '16 Hours',
        leadsTo: 'Class 2 to Class 6 W-Space',
        mass: 1000000000,
        jump: 375000000
    },
    C729: { life: '12 Hours', leadsTo: 'High-Sec', mass: 1000000000, jump: 375000000 },
    R081: { life: '16 Hours', leadsTo: 'Class 4 W-Space', mass: 1000000000, jump: 450000000 },
    X450: { life: '16 Hours', leadsTo: 'Drone Nullsec ', mass: 1000000000, jump: 375000000 }
}

export const NODE_POSITIONS = {
    '30000157': {
        x: -26,
        y: -430
    },
    '30000192': {
        x: 349,
        y: -203
    },

    '30001372': {
        x: 45,
        y: -500
    },
    '30001381': {
        x: -328,
        y: -124
    },
    '30001413': {
        x: 524,
        y: -44
    },
    '30001445': {
        x: 125,
        y: -430
    },
    '30002079': {
        x: 260,
        y: -281
    },

    '30002411': {
        x: 609,
        y: 39
    },

    '30002737': {
        x: 180,
        y: -357
    },

    '30002797': {
        x: -400,
        y: -43
    },

    '30005005': {
        x: -95,
        y: -357
    },
    '30010141': {
        x: -252,
        y: -204
    },
    '30031392': {
        x: -172,
        y: -281
    },
    '30040141': {
        x: 437,
        y: -125
    },
    '30045329': {
        x: -469,
        y: 39
    },
    '30002702': {
        x: -630,
        y: 200
    },
    '30003046': {
        x: -538,
        y: 120
    },
    '30003495': {
        x: 700,
        y: 120
    },
    '30003504': {
        x: 790,
        y: 200
    },
    '30045328': {
        x: 162,
        y: 200
    },
    '30020141': {
        x: 3,
        y: 200
    },
    '30002770': {
        x: 474,
        y: 200
    },
    '30005029': {
        x: -474,
        y: 200
    },
    '30002652': {
        x: -316,
        y: 200
    },
    '30002225': {
        x: 632,
        y: 200
    },
    '30000206': {
        x: -158,
        y: 200
    },
    '30000021': {
        x: 317,
        y: 200
    }
}

export const LABEL_NODES = [
    {
        x: -300,
        y: 60,
        fixed: { x: true, y: true },
        label: 'Krai Veles',
        shape: 'image',
        image: 'img/veles_logo.png',
        physics: true,
        size: 50,
        shadow: {
            enabled: true,
            color: TRIGLAVIAN_RED,
            size: 30
        }
    },
    {
        x: 45,
        y: -320,
        fixed: { x: true, y: true },
        label: 'Krai Perun',
        shape: 'image',
        image: 'img/perun_logo.png',
        physics: true,
        size: 50,
        shadow: {
            enabled: true,
            color: TRIGLAVIAN_RED,
            size: 30
        }
    },
    {
        x: 400,
        y: 60,
        fixed: { x: true, y: true },
        label: 'Krai Svarog',
        shape: 'image',
        image: 'img/svarog_logo.png',
        physics: true,
        size: 50,
        shadow: {
            enabled: true,
            color: TRIGLAVIAN_RED,
            size: 30
        }
    },
    {
        x: 50,
        y: -50,
        fixed: { x: true, y: true },
        shape: 'image',
        image: 'img/trig_logo.png',
        physics: true,
        size: 100,
        shadow: {
            enabled: true,
            color: TRIGLAVIAN_RED,
            size: 30
        }
    }
]

export const TABLE_BREAKPOINT = ['lg'] as Breakpoint[]
