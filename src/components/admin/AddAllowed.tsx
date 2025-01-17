import { Form, Input, Button, Modal, Select } from 'antd'
import { useState } from 'react'
import { ExtendedAllowedEntity } from './AdminTable'

const { Option } = Select

const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 }
}

const AddAllowed = ({ refresh }) => {
    const [isModalVisible, setIsModalVisible] = useState(false)

    const showModal = () => {
        setIsModalVisible(true)
    }

    const handleOk = () => {
        setIsModalVisible(false)
    }

    const handleCancel = () => {
        setIsModalVisible(false)
    }

    const addAllowed = (inputData: ExtendedAllowedEntity) => {
        fetch('/api/admin/allowed', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: JSON.stringify(inputData)
        }).then((_) => refresh())
    }

    const onFinish = (values) => {
        const input: ExtendedAllowedEntity = {
            ...values
        }
        addAllowed(input)
        handleOk()
    }

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo)
    }

    const [form] = Form.useForm()

    return (
        <>
            <Button type="primary" onClick={showModal} style={{ marginBottom: 16 }}>
                Add allowed entity
            </Button>
            <Modal
                title="Add allowed"
                open={isModalVisible}
                onOk={() => {
                    form.validateFields()
                        .then((values) => {
                            onFinish(values)
                            form.resetFields()
                        })
                        .catch((info) => {
                            console.log('Validate Failed:', info)
                        })
                }}
                onCancel={handleCancel}>
                <Form
                    form={form}
                    {...layout}
                    layout="horizontal"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    size="small">
                    <Form.Item label="Id" name="entity_id">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Level" name="level">
                        <Select
                            showSearch
                            allowClear
                            style={{ width: 200 }}
                            placeholder="Access level"
                            optionFilterProp="children"
                            defaultActiveFirstOption={true}
                            filterOption={(input, option) =>
                                option.children
                                    .toString()
                                    .toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                            }
                            filterSort={(optionA, optionB) =>
                                optionA.children
                                    .toString()
                                    .toLowerCase()
                                    .localeCompare(optionB.children.toString().toLowerCase())
                            }>
                            <Option value="1">Level-1</Option>
                            <Option value="2">Level-2</Option>
                            <Option value="3">Level-3</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Type" name="type">
                        <Select
                            showSearch
                            allowClear
                            style={{ width: 200 }}
                            placeholder="ID type"
                            optionFilterProp="children"
                            defaultActiveFirstOption={true}
                            filterOption={(input, option) =>
                                option.children
                                    .toString()
                                    .toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                            }
                            filterSort={(optionA, optionB) =>
                                optionA.children
                                    .toString()
                                    .toLowerCase()
                                    .localeCompare(optionB.children.toString().toLowerCase())
                            }>
                            <Option value="Character">Character</Option>
                            <Option value="Corporation">Corporation</Option>
                            <Option value="Alliance">Alliance</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default AddAllowed
