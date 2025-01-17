import { Form, Input, Select, Checkbox, Modal, Divider, Image, Button } from 'antd'
import { DateTime } from 'luxon'
import { useContext, useEffect, useState } from 'react'
import { POCHVEN_HOLE_TYPES, TRIG_SYSTEM_IDS, WH_TYPES } from '../../const'
import { TrigData } from '../../state/TrigDataContainer'
import { TrigConnection } from '../../types/types'

const { Option } = Select

const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 }
}
const tailLayout = {
    wrapperCol: { offset: 8, span: 16 }
}

type EditConnectionProps = {
    refresh: () => any
    selectedForEdit: TrigConnection
    setSelectedForEdit: (TrigConnection) => any
}

const EditConnection = ({ refresh, selectedForEdit, setSelectedForEdit }: EditConnectionProps) => {
    const trigStorage = useContext(TrigData)
    const systems = trigStorage.systems
    const [form] = Form.useForm()

    useEffect(() => {
        form.resetFields()
    }, [])

    const handleOk = () => {
        setSelectedForEdit(undefined)
        form.resetFields()
    }

    const handleCancel = () => {
        setSelectedForEdit(undefined)
        form.resetFields()
    }

    const updateSystem = (inputData: TrigConnection) => {
        fetch('/api/data/trig', {
            method: 'PATCH',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify({ ...inputData, id: selectedForEdit.id })
        }).then((res) => {
            refresh()
            if (res.status === 409) {
                setSigConflict(true)
            } else {
                setSigConflict(false)
                handleOk()
            }
        })
    }

    const onFinish = (values) => {
        const input: TrigConnection = {
            pochvenSystemId: values.pochvenSystemId,
            externalSystemId: values.externalSystemId,
            timeCritical: values.critical ? values.critical.some((c) => c === 'time') : false,
            massCritical: values.critical ? values.critical.some((c) => c === 'mass') : false,
            pochvenSystemName: systems.find(
                (system) => system.solarSystemId === values.pochvenSystemId
            ).solarSystemName,
            externalSystemName: systems.find(
                (system) => system.solarSystemId === values.externalSystemId
            ).solarSystemName,
            createdTime: DateTime.now().toISO(),
            comment: values.comment ?? '',
            pochvenWormholeType: values.pochvenWormholeType ?? '',
            pochvenSignature: values.pochvenSignature ?? '',
            externalWormholeType: values.externalWormholeType ?? '',
            externalSignature: values.externalSignature ?? ''
        }
        updateSystem(input)
    }

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo)
    }

    const [sigConflict, setSigConflict] = useState(false)

    const [invalidPochvenInput, setInvalidPochvenInput] = useState(undefined)

    const formatPochvenBookmark = (bookmark: string) => {
        setInvalidPochvenInput(undefined)
        if (bookmark.length === 0) return
        const connectionParts = bookmark.split(' ')
        if (connectionParts.length < 3) return setInvalidPochvenInput('Malformed bookmark')
        const signature = connectionParts[0].toUpperCase()
        const system = systems.find(
            (s) =>
                s.solarSystemName.toString().toLowerCase() ===
                connectionParts[1].toString().toLowerCase()
        )
        const systemDual = systems.find(
            (s) =>
                s.solarSystemName.toString().toLowerCase() ===
                `${connectionParts[1].toString().toLowerCase()} ${connectionParts[2]
                    .toString()
                    .toLowerCase()}`
        )
        const systemTriple =
            connectionParts.length > 3 &&
            systems.find(
                (s) =>
                    s.solarSystemName.toString().toLowerCase() ===
                    `${connectionParts[1].toString().toLowerCase()} ${connectionParts[2]
                        .toString()
                        .toLowerCase()} ${connectionParts[3].toString().toLowerCase()}`
            )
        if (!system && !systemDual && !systemTriple)
            return setInvalidPochvenInput('Invalid system name')
        const whTypePosition = systemDual ? 3 : systemTriple ? 4 : 2
        const whType = connectionParts[whTypePosition]?.split('	')[0].toUpperCase()
        form.setFieldsValue({
            comment: `${signature.toUpperCase()} ${
                system?.solarSystemName ??
                systemDual?.solarSystemName ??
                systemTriple?.solarSystemName
            } ${whType.toLocaleUpperCase()}`,
            externalSystemId:
                system?.solarSystemId ?? systemDual?.solarSystemId ?? systemTriple.solarSystemId,
            pochvenSignature: signature,
            pochvenWormholeType: whType
        })
    }

    const [invalidExtInput, setInvalidExtInput] = useState(undefined)

    const formatExtBookmark = (bookmark: string) => {
        setInvalidExtInput(undefined)
        if (bookmark.length === 0) return
        const connectionParts = bookmark.split(' ')
        if (connectionParts.length < 3) return setInvalidExtInput('Malformed bookmark')
        const signature = connectionParts[0].toUpperCase()
        const system = systems.find(
            (s) =>
                s.solarSystemName.toString().toLowerCase() ===
                connectionParts[1].toString().toLowerCase()
        )
        const systemDual = systems.find(
            (s) =>
                s.solarSystemName.toString().toLowerCase() ===
                `${connectionParts[1].toString().toLowerCase()} ${connectionParts[2]
                    .toString()
                    .toLowerCase()}`
        )
        if (!system && !systemDual) return setInvalidExtInput('Invalid system name')
        const whTypePosition = systemDual ? 3 : 2
        const whType = connectionParts[whTypePosition]?.split('	')[0].toUpperCase()

        form.setFieldsValue({
            extbook: `${signature.toUpperCase()} ${
                system?.solarSystemName ?? systemDual?.solarSystemName
            } ${whType.toLocaleUpperCase()}`,
            pochvenSystemId: systemDual ? systemDual.solarSystemId : system.solarSystemId,
            externalSignature: signature,
            externalWormholeType: whType
        })
    }

    const formatBookmarkString = (pochvenSide: boolean) => {
        const systemId = pochvenSide
            ? form.getFieldValue('externalSystemId')
            : form.getFieldValue('pochvenSystemId')
        const system = systems.find((s) => s.solarSystemId === systemId)
        const whType = pochvenSide
            ? form.getFieldValue('pochvenWormholeType')
            : form.getFieldValue('externalWormholeType')
        const sig: string = pochvenSide
            ? form.getFieldValue('pochvenSignature')
            : form.getFieldValue('externalSignature')
        if (!system || !whType || !sig) return
        if (pochvenSide) {
            form.setFieldsValue({
                comment: `${sig.toUpperCase()} ${system.solarSystemName} ${whType}`
            })
        } else {
            form.setFieldsValue({
                extbook: `${sig.toUpperCase()} ${system.solarSystemName} ${whType}`
            })
        }
    }

    return (
        <>
            <Modal
                title="Edit connection"
                visible={selectedForEdit ? true : false}
                onOk={() => {
                    form.validateFields()
                        .then(onFinish)
                        .catch((info) => {
                            console.log('Validate Failed:', info)
                        })
                }}
                onCancel={handleCancel}
                footer={[]}>
                <Form
                    form={form}
                    {...layout}
                    layout="horizontal"
                    initialValues={{
                        ...selectedForEdit,
                        critical: [
                            selectedForEdit?.timeCritical ? 'time' : '',
                            selectedForEdit?.massCritical ? 'mass' : ''
                        ]
                    }}
                    onFinishFailed={onFinishFailed}
                    size="small">
                    <Divider>Pochven</Divider>
                    <Form.Item
                        label="Pochven bookmark"
                        name="comment"
                        validateStatus={invalidPochvenInput ? 'error' : 'success'}
                        help={invalidPochvenInput}>
                        <Input
                            placeholder="Input Pochven bookmark for parsing"
                            onChange={(event) => formatPochvenBookmark(event.target.value)}
                        />
                    </Form.Item>
                    <Form.Item
                        name="pochvenSystemId"
                        label="Pochven system"
                        rules={[{ required: true, message: 'Please select Pocven system!' }]}>
                        <Select
                            showSearch
                            allowClear
                            style={{ width: 200 }}
                            placeholder="System"
                            optionFilterProp="children"
                            onChange={() => {
                                formatBookmarkString(false)
                            }}
                            filterOption={(input, option) =>
                                option.children
                                    .toString()
                                    .toLowerCase()
                                    .indexOf(input.toString().toLowerCase()) >= 0
                            }
                            filterSort={(optionA, optionB) =>
                                optionA.children
                                    .toString()
                                    .toLowerCase()
                                    .localeCompare(optionB.children.toString().toLowerCase())
                            }>
                            {systems
                                .filter((s) => TRIG_SYSTEM_IDS.some((t) => t === s.solarSystemId))
                                .map((system) => {
                                    return (
                                        <Option
                                            key={system.solarSystemId}
                                            value={system.solarSystemId}>
                                            {system.solarSystemName}
                                        </Option>
                                    )
                                })}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="pochvenSignature"
                        label="Pochven sig"
                        validateStatus={sigConflict ? 'error' : undefined}
                        help={sigConflict ? 'Signature conflict' : undefined}>
                        <Input
                            onChange={() => {
                                formatBookmarkString(true)
                            }}
                        />
                    </Form.Item>
                    <Form.Item name="pochvenWormholeType" label="Pochven WH type">
                        <Select
                            showSearch
                            allowClear
                            style={{ width: 200 }}
                            placeholder="WH type"
                            optionFilterProp="children"
                            defaultActiveFirstOption={true}
                            onChange={() => {
                                formatBookmarkString(true)
                            }}
                            filterOption={(input, option) =>
                                option.children
                                    .toString()
                                    .toLowerCase()
                                    .indexOf(input.toString().toLowerCase()) >= 0
                            }
                            filterSort={(optionA, optionB) =>
                                optionA.children
                                    .toString()
                                    .toLowerCase()
                                    .localeCompare(optionB.children.toString().toLowerCase())
                            }>
                            {Object.keys(WH_TYPES).map((wh) => {
                                return (
                                    <Option key={`ext-select-type-${wh}`} value={wh}>
                                        {wh}
                                    </Option>
                                )
                            })}
                        </Select>
                    </Form.Item>
                    <Divider>External</Divider>
                    <Form.Item
                        label="External bookmark"
                        name="extbook"
                        validateStatus={invalidExtInput ? 'error' : 'success'}
                        help={invalidExtInput}>
                        <Input
                            onChange={(event) => formatExtBookmark(event.target.value)}
                            placeholder="Input External bookmark for parsing. Not saved!"
                        />
                    </Form.Item>
                    <Form.Item
                        name="externalSystemId"
                        label="External system"
                        rules={[{ required: true, message: 'Please select external system!' }]}>
                        <Select
                            showSearch
                            allowClear
                            style={{ width: 200 }}
                            placeholder="System"
                            optionFilterProp="children"
                            onChange={() => {
                                formatBookmarkString(true)
                            }}
                            filterOption={(input, option) =>
                                option.children
                                    .toString()
                                    .toLowerCase()
                                    .indexOf(input.toString().toLowerCase()) >= 0
                            }
                            filterSort={(optionA, optionB) =>
                                optionA.children
                                    .toString()
                                    .toLowerCase()
                                    .localeCompare(optionB.children.toString().toLowerCase())
                            }>
                            {systems.map((system) => {
                                return (
                                    <Option key={system.solarSystemId} value={system.solarSystemId}>
                                        {system.solarSystemName}
                                    </Option>
                                )
                            })}
                        </Select>
                    </Form.Item>
                    <Form.Item name="externalSignature" label="External sig">
                        <Input
                            onChange={() => {
                                formatBookmarkString(false)
                            }}
                        />
                    </Form.Item>
                    <Form.Item name="externalWormholeType" label="External WH type">
                        <Select
                            showSearch
                            allowClear
                            style={{ width: 200 }}
                            placeholder="WH type"
                            optionFilterProp="children"
                            defaultActiveFirstOption={true}
                            onChange={() => {
                                formatBookmarkString(false)
                            }}
                            filterOption={(input, option) =>
                                option.children
                                    .toString()
                                    .toLowerCase()
                                    .indexOf(input.toString().toLowerCase()) >= 0
                            }
                            filterSort={(optionA, optionB) =>
                                optionA.children
                                    .toString()
                                    .toLowerCase()
                                    .localeCompare(optionB.children.toString().toLowerCase())
                            }>
                            {Object.keys(WH_TYPES).map((wh) => {
                                return (
                                    <Option key={`ext-select-type-${wh}`} value={wh}>
                                        {wh}
                                    </Option>
                                )
                            })}
                        </Select>
                    </Form.Item>
                    <Divider>WH status</Divider>
                    <Form.Item {...tailLayout} name="critical">
                        <Checkbox.Group>
                            <Checkbox value="time">Time critical</Checkbox>
                            <Checkbox value="mass">Mass critical</Checkbox>
                        </Checkbox.Group>
                    </Form.Item>
                </Form>
                <Divider>Confirm</Divider>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button style={{ marginRight: '1rem' }} onClick={handleCancel}>
                        Cancel
                    </Button>{' '}
                    <Button
                        type="primary"
                        onClick={() => {
                            form.validateFields()
                                .then(onFinish)
                                .catch((info) => {
                                    console.log('Validate Failed:', info)
                                })
                        }}>
                        Save
                    </Button>
                </div>
                <Divider>How to</Divider>
                <div className="infographqics" style={{ marginBottom: '4rem' }}>
                    <Image src="img/how-to-bookmark2.png" />
                </div>
            </Modal>
        </>
    )
}

export default EditConnection
