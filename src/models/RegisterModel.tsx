import React, { useEffect, useState } from "react";
import { Drawer, Input, Button, Form, notification, DatePicker, Radio, Select } from "antd";
import apiRequest from "../Utils/api";
import TextArea from "antd/lib/input/TextArea";
import customParseFormat from "dayjs/plugin/customParseFormat";
import weekday from "dayjs/plugin/weekday"; // ✅ added
import localeData from "dayjs/plugin/localeData"; // optional but helps DatePicker
import dayjs from "dayjs";

// Extend dayjs with needed plugins
dayjs.extend(customParseFormat);
dayjs.extend(weekday); // ✅ fix for clone.weekday error
dayjs.extend(localeData);

interface CompanyModelProps {
    isOpen: boolean;
    onSuccess: () => void;
    onClose: () => void;
    type?: any;
    productId?: any;
}

const RegisterModel: React.FC<CompanyModelProps> = ({
    isOpen,
    onSuccess,
    onClose,
    productId,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [drawerWidth, setDrawerWidth] = useState(window.innerWidth > 768 ? 600 : "100%");

    // Responsive drawer width
    useEffect(() => {
        const handleResize = () =>
            setDrawerWidth(window.innerWidth > 768 ? 600 : "100%");
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Set/reset form values only when the drawer is open
    useEffect(() => {
        if (isOpen) {
            if (productId) {
                setSelectedProductId(productId);
                fetchProductSingle(productId);
            } else {
                form.resetFields();
            }
        }
    }, [isOpen, productId]);

    const fetchProductSingle = async (id: string) => {
        try {
            const response = await apiRequest("POST", "registerSingleSelect.php", { id });

            if (response.success && response.data) {
                const product = response.data;
                form.setFieldsValue({
                    ...product,
                    date: product?.date ? dayjs(product.date, "DD/MM/YYYY") : null,
                    dob: product?.dob ? dayjs(product.dob, "DD/MM/YYYY") : null,
                    preferredDate: product?.date ? dayjs(product.date, "DD/MM/YYYY") : null
                });
            }
        } catch {
            notification.error({
                message: "An error occurred while fetching gallery details.",
            });
        }
    };

    const handleSave = () => {
        form.validateFields().then(async (values) => {
            setLoading(true);

            const payload = {
                id: selectedProductId ?? "",
                ...values,
                date: values.date ? values.date.format("DD/MM/YYYY") : "",
                dob: values.dob ? values.dob.format("DD/MM/YYYY") : "",
                preferredDate: values.preferredDate ? values.preferredDate.format("DD/MM/YYYY") : ""
            };

            const api = selectedProductId ? "registerUpdate" : "registerInsert";

            try {
                const response = await apiRequest("POST", `${api}.php`, payload);
                if (response.success) {
                    notification.success({ message: response?.message ?? "Success" });
                    form.resetFields();
                    onClose();
                    setSelectedProductId("");
                    onSuccess();
                } else {
                    notification.error({
                        message: response?.error ?? "Something went wrong, please try again later.",
                    });
                }
            } catch (error: any) {
                notification.error({
                    message: error?.response?.message ?? error?.message ?? "Something went wrong, please try again later.",
                });
            } finally {
                setLoading(false);
            }
        });
    };

    return (
        <Drawer
            title={selectedProductId ? "Edit Register" : "Add Register"}
            placement="right"
            width={drawerWidth}
            onClose={() => {
                onClose();
                form.resetFields();
                setSelectedProductId("");
            }}
            open={isOpen}
        >
            <Form form={form} layout="vertical">
                <Form.Item name="name" label="Name (CAPITAL)" rules={[{ required: true, message: "Name is required" }]}>
                    <Input placeholder="First Name + Middle Name + Last Name" />
                </Form.Item>

                <Form.Item name="fatherName" label="Father Name (CAPITAL)" rules={[{ required: true, message: "Father Name is required" }]}>
                    <Input placeholder="Father's Name" />
                </Form.Item>

                <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Gender is required" }]}>
                    <Select placeholder="Select Gender">
                        <Select.Option value="Male">Male</Select.Option>
                        <Select.Option value="Female">Female</Select.Option>
                        <Select.Option value="Other">Other</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item name="address" label="Address" rules={[{ required: true, message: "Address is required" }]}>
                    <TextArea placeholder="Your Address" rows={3} />
                </Form.Item>

                <Form.Item name="city" label="City" rules={[{ required: true, message: "City is required" }]}>
                    <Input placeholder="Your City" />
                </Form.Item>

                <Form.Item name="state" label="State" rules={[{ required: true, message: "State is required" }]}>
                    <Input placeholder="Your State" />
                </Form.Item>

                <Form.Item name="postalCode" label="Postal Code" rules={[{ required: true, message: "Postal Code is required" }]}>
                    <Input placeholder="Your Postal Code" />
                </Form.Item>

                <Form.Item name="mobile" label="Mobile" rules={[{ required: true, message: "Mobile is required" }]}>
                    <Input placeholder="Your Mobile Number" />
                </Form.Item>

                <Form.Item name="email" label="Email" rules={[{ required: true, message: "Email is required" }]}>
                    <Input placeholder="Your Email" />
                </Form.Item>

                <Form.Item name="dob" label="Date of Birth" rules={[{ required: true, message: "Date of Birth is required" }]}>
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item name="placeOfBirth" label="Place of Birth">
                    <Input placeholder="Your Place of Birth" />
                </Form.Item>

                <Form.Item name="citizenship" label="Citizenship" rules={[{ required: true, message: "Citizenship is required" }]}>
                    <Input placeholder="Your Citizenship" />
                </Form.Item>

                <Form.List name="academyHistory">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map((field) => (
                                <div key={field.key} style={{ display: "flex", gap: "8px", marginBottom: 8 }}>
                                    <Form.Item {...field} name={[field.name, "school"]} rules={[{ required: true, message: "School is required" }]}>
                                        <Input placeholder="School or College Name" />
                                    </Form.Item>
                                    <Form.Item {...field} name={[field.name, "percentage"]} rules={[{ required: true, message: "Percentage is required" }]}>
                                        <Input placeholder="Percentage" />
                                    </Form.Item>
                                    <Form.Item {...field} name={[field.name, "passedOutYear"]} rules={[{ required: true, message: "Year is required" }]}>
                                        <Input placeholder="Year of Passing" />
                                    </Form.Item>
                                    <Button onClick={() => remove(field.name)} danger>
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <Button type="dashed" onClick={() => add()} block>
                                Add Row
                            </Button>
                        </>
                    )}
                </Form.List>

                <Form.Item name="course" label="Which course are you looking for" rules={[{ required: true, message: "Course is required" }]}>
                    <Select placeholder="Select Course">
                        <Select.Option value="Commercial Pilot">Commercial Pilot</Select.Option>
                        <Select.Option value="Cabin Crew">Cabin Crew</Select.Option>
                        <Select.Option value="Ground Staff">Ground Staff</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item name="batch" label="When you prefer to start" rules={[{ required: true, message: "Batch selection is required" }]}>
                    <Radio.Group>
                        <Radio value="current-batch">Current Batch</Radio>
                        <Radio value="next-batch">Next Batch</Radio>
                        <Radio value="later">Later</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item name="date" label="Date" rules={[{ required: true, message: "Date is required" }]}>
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <div className="flex justify-end gap-2">
                    <Button
                        onClick={() => {
                            onClose();
                            form.resetFields();
                        }}
                        className="!rounded-lg"
                    >
                        Cancel
                    </Button>
                    <Button
                        loading={loading}
                        disabled={loading}
                        type="primary"
                        className="btn-color !border-none !rounded-lg"
                        onClick={handleSave}
                    >
                        {selectedProductId ? "Update" : "Save"}
                    </Button>
                </div>
            </Form>
        </Drawer>
    );
};

export default RegisterModel;
