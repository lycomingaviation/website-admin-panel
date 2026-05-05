import React, { useEffect, useState } from "react";
import { Drawer, Input, Button, Form, notification, DatePicker, Select } from "antd";
import apiRequest from "../Utils/api";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import moment from "moment";
import { uiApiDateFormat } from "../Utils/Common";

interface CompanyModelProps {
    isOpen: boolean;
    onSuccess: () => void;
    onClose: () => void;
    type?: any
    productId?: any;
}

const EmployeModel: React.FC<CompanyModelProps> = ({ isOpen, onSuccess, onClose, productId }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    useEffect(() => {
        if (productId) {
            setSelectedProductId(productId);
            fetchProductSingle(productId);
        } else {
            form.resetFields();
        }
    }, [productId]);

    const fetchProductSingle = async (id: string) => {
        const payload = { id };

        try {
            const response = await apiRequest("POST", "employeeSingleSelect.php", payload);

            if ( response.data) {                
                const product = response.data; // Assuming the API response structure
                form.setFieldsValue({
                    name: product.name,
                    role:product.role,
                    dob:product.dob ? moment(product.dob, "YYYY-MM-DD") : null,
                    dateOfJoining:product.dateOfJoining ? moment(product.dateOfJoining, "YYYY-MM-DD") : null,
                    address: product.address,
                    phoneNumber: product.phoneNumber,
                    password:product.password,
                    email: product.email
                });

            } else {
                notification.error({
                    message: response.error || "Failed to fetch company details.",
                });
            }
        } catch (error) {
            notification.error({
                message: "An error occurred while fetching company details.",
            });
        }
    };

    const handleSave = () => {
        form
            .validateFields()
            .then(async (values) => {
                setLoading(true);
                const payload = {
                    id: selectedProductId ?? "",
                    name: values.name,
                    role:values.role,
                    dob: uiApiDateFormat(values.dob, "YYYY-MM-DD") || null,
                    dateOfJoining: uiApiDateFormat(values.dateOfJoining, "YYYY-MM-DD") || null,
                    address: values.address,
                    phoneNumber: values.phoneNumber,
                    password: values.password,
                    email: values.email,
                }
                const api = selectedProductId ? 'employeeUpdate' : 'employeeInsert';
                try {
                    const response = await apiRequest("POST", `${api}.php`, payload);
                    if (response.success) {
                        notification.success({ message: response?.message ?? 'Success' });
                        form.resetFields();
                        onClose();
                        setSelectedProductId("");
                        onSuccess();
                    } else {
                        notification.error({
                            message:
                                response?.error ??
                                'Something went wrong, please try again later.',
                        });
                        console.error("Login failed:", response.message);
                    }
                } catch (error: any) {
                    console.error("Error during login:", error);
                    notification.error({
                        message:
                            error?.response?.message ??
                            error?.response?.error ??
                            error?.message ??
                            error?.error ??
                            'Something went wrong, please try again later.',
                    });
                    setLoading(false);
                } finally {
                    setLoading(false);
                }
            })
            .catch((errorInfo) => {
                console.log("Validation Failed:", errorInfo);
            });
    };

    return (
        <Drawer title={selectedProductId ? "Edit Employee " : "Add Employee"} placement="right"
            onClose={() => {
                onClose();
                form.resetFields();
                setSelectedProductId("");
            }}
            open={isOpen}>
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Name"
                    name="name"
                    rules={[{ required: true, message: " Name is required" }]}
                >
                    <Input minLength={2} maxLength={70} placeholder="Enter  Name" />
                </Form.Item>

                <Form.Item
                    label="Role"
                    name="role"
                    rules={[{ required: true, message: "Role is required" }]}
                >
                    <Select placeholder="Select role">
                        <Select.Option value="Admin">Admin</Select.Option>
                        <Select.Option value="Staff">Staff</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="DOB"
                    name="dob"
                    rules={[{ required: true, message: "DOB is required" }]}
                >
                    <DatePicker
                        inputReadOnly={true}
                        format="DD-MM-YYYY"
                        className="w-full"
                    />
                </Form.Item>

                <Form.Item
                    label="Date Of Joining"
                    name="dateOfJoining"
                    rules={[{ required: true, message: "Date Of Joining is required" }]}
                >
                    <DatePicker
                        inputReadOnly={true}
                        format="DD-MM-YYYY"
                        className="w-full"
                    />
                </Form.Item>
                <Form.Item
                    label="Address"
                    name="address"
                    rules={[{ required: true, message: "Address is required" }]}
                >
                    <Input.TextArea rows={4} maxLength={200} placeholder="Enter Address" />
                </Form.Item>

                <Form.Item
                    label="Phone Number"
                    name="phoneNumber"
                    rules={[
                        { required: true, message: "Phone Number is required" },
                        {
                            pattern: /^[0-9]{10}$/,
                            message: "Enter a valid 10-digit phone number",
                        },
                    ]}
                >
                    <Input
                        type="tel"
                        placeholder="Enter phone number"
                        maxLength={10}
                    />
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                        { required: true, message: "Password is required" },
                        { min: 6, message: "Password must be at least 6 characters" },
                    ]}
                >
                    <Input.Password
                        placeholder="Enter password"
                        iconRender={(visible) =>
                            visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                        }
                    />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { type: "email", message: "Please enter a valid email address" }
                    ]}
                >
                    <Input placeholder="Enter Email" />
                </Form.Item>

                <div className="flex justify-end gap-2">
                    <Button
                        onClick={() => {
                            onClose();
                            form.resetFields();
                            setSelectedProductId("");
                        }}
                        className=" !rounded-lg">Cancel</Button>
                    <Button
                        loading={loading}
                        disabled={loading}
                        type="primary"
                        className="btn-color !border-none !rounded-lg"
                        onClick={handleSave}
                    >
                        {selectedProductId ? 'Update' : 'Save'}
                    </Button>
                </div>
            </Form>
        </Drawer>
    );
};

export default EmployeModel;