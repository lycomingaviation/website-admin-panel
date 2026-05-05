import React, { useEffect, useState } from "react";
import { Drawer, Input, Button, Form, Select, notification, DatePicker } from "antd";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday"; // Ensure the weekday plugin is included
import apiRequest from "../Utils/api";
import moment from "moment";
import { uiApiDateFormat } from "../Utils/Common";

dayjs.extend(weekday); // Extend dayjs with the weekday plugin

interface PaymentModelProps {
    isOpen: boolean;
    onSuccess: () => void;
    onClose: () => void;
    orderId?: any;
    invoiceId?: any;
}

const PaymentModel: React.FC<PaymentModelProps> = ({ isOpen, onSuccess, onClose, orderId, invoiceId }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    useEffect(() => {
        if (orderId) {
            setSelectedOrderId(orderId);
            fetchProductSingle(orderId);
        } else {
            form.resetFields();
        }
    }, [orderId]);

    const fetchProductSingle = async (id: string) => {
        const payload = { id };

        try {
            const response = await apiRequest("POST", "paymentSingleSelect.php", payload);

            if (response.success && response.data) {
                const product = response.data[0];
                form.setFieldsValue({
                    ...product,
                    // paymentDate: product.paymentDate ? uiApiDateFormat(product.paymentDate, "DD-MM-YYYY") : null, // Convert to dayjs instance
                    paymentDate: product.paymentDate ? moment(product.paymentDate) : null, // Convert to dayjs instance
                });
            } else {
                notification.error({
                    message: response.error || "Failed to fetch product details.",
                });
            }
        } catch (error) {
            notification.error({
                message: "An error occurred while fetching product details.",
            });
        }
    };

    const handleSave = () => {
        form
            .validateFields()
            .then(async (values) => {
                setLoading(true);
                const payload = {
                    invoiceId,
                    id: selectedOrderId ?? "",
                    price: values.price,
                    paymentDate: values.paymentDate ? uiApiDateFormat(values.paymentDate, 'YYYY-MM-DD') : null,
                    paymentMode: values.paymentMode,
                };
                const api = selectedOrderId ? "paymentUpdate" : "paymentInsert";

                try {
                    const response = await apiRequest("POST", `${api}.php`, payload);

                    if (response.success) {
                        notification.success({ message: response?.message ?? "Success" });
                        form.resetFields();
                        onClose();
                        onSuccess();
                        setSelectedOrderId('');
                    } else {
                        notification.error({
                            message: response?.error ?? "Something went wrong, please try again later.",
                        });
                    }
                } catch (error: any) {
                    console.error("Error during save:", error);
                    notification.error({
                        message: error?.response?.error ?? error?.message ?? "Something went wrong, please try again later.",
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
        <Drawer
            title={selectedOrderId ? "Edit Payment" : "Add Payment"}
            placement="right"
            onClose={() => {
                onClose();
                setSelectedOrderId('');
                form.resetFields();
            }}
            open={isOpen}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Date"
                    name="paymentDate"
                    rules={[{ required: true, message: "Date is required" }]}
                >
                    <DatePicker format="YYYY-MM-DD"   inputReadOnly={true}  className="w-full" />
                </Form.Item>

                <Form.Item
                    label="Amount"
                    name="price"
                    rules={[{ required: true, message: "Amount is required" }]}
                >
                    <Input inputMode="numeric" maxLength={10} placeholder="Enter Amount" />
                </Form.Item>

                <Form.Item
                    label="Payment Mode"
                    name="paymentMode"
                    rules={[{ required: true, message: "Payment Mode is required" }]}
                >
                    <Select placeholder="Select Payment Mode">
                        <Select.Option value="cash">Cash</Select.Option>
                        <Select.Option value="upi">Upi</Select.Option>
                        <Select.Option value="imps">IMPS</Select.Option>
                        <Select.Option value="nefty">NEFTY</Select.Option>
                        <Select.Option value="cheque">Cheque</Select.Option>
                    </Select>
                </Form.Item>

                <div className="flex justify-end gap-2">
                    <Button onClick={onClose} className="!rounded-lg">
                        Cancel
                    </Button>
                    <Button
                        loading={loading}
                        type="primary"
                        className="btn-color !border-none !rounded-lg"
                        onClick={handleSave}
                    >
                        {selectedOrderId ? "Update" : "Save"}
                    </Button>
                </div>
            </Form>
        </Drawer>
    );
};

export default PaymentModel;
