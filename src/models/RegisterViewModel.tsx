import React, { useEffect, useState } from "react";
import { Drawer, Descriptions, Table } from "antd";
import apiRequest from "../Utils/api";

interface RegisterViewModelProps {
    visible: boolean;
    onClose: () => void;
    productId: any;
}

const RegisterViewModel: React.FC<RegisterViewModelProps> = ({
    visible,
    onClose,
    productId
}) => {
    const [contactData, setContactData]: any = useState({});

    useEffect(() => {
        if (productId) {
            fetchProductSingle(productId);
        }
    }, [productId]);

    const fetchProductSingle = async (id: string) => {
        try {
            const response = await apiRequest("POST", "registerSingleSelect.php", { id });

            if (response.success && response.data) {
                const product = response.data;
                setContactData(product);
            } else {
                setContactData({});
            }
        } catch { }
    };

    return (
        <Drawer
            title="Register Details"
            placement="right"
            width={700}
            onClose={onClose}
            open={visible}
            bodyStyle={{ padding: "24px", maxHeight: "80vh", overflowY: "auto" }}
        >
            {contactData ? (
                <>
                    <Descriptions column={1} bordered>
                        <Descriptions.Item label="Name">{contactData.name || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Father Name">{contactData.fatherName || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Gender">{contactData.gender || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Address">{contactData.address || "-"}</Descriptions.Item>
                        <Descriptions.Item label="City">{contactData.city || "-"}</Descriptions.Item>
                        <Descriptions.Item label="State">{contactData.state || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Postal Code">{contactData.postalCode || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Mobile">
                            {contactData.mobile ? <a href={`tel:${contactData.mobile}`}>{contactData.mobile}</a> : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                            {contactData.email ? <a href={`mailto:${contactData.email}`}>{contactData.email}</a> : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Date of Birth">{contactData.dob || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Place of Birth">{contactData.placeOfBirth || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Citizenship">{contactData.citizenship || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Course">{contactData.course || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Start Preference">{contactData.batch || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Date">{contactData.date || "-"}</Descriptions.Item>
                    </Descriptions>

                    {contactData.academyHistory && contactData.academyHistory.length > 0 && (
                        <>
                            <h3 style={{ marginTop: "20px" }}>Academic History</h3>
                            <Table
                                dataSource={contactData.academyHistory.map((item: any, index: any) => ({ key: index, ...item }))}
                                columns={[
                                    { title: "School / College", dataIndex: "school", key: "school" },
                                    { title: "Percentage", dataIndex: "percentage", key: "percentage" },
                                    { title: "Passed Out Year", dataIndex: "passedOutYear", key: "ypassedOutYearear" },
                                ]}
                                pagination={false}
                                size="small"
                                bordered
                            />
                        </>
                    )}
                </>
            ) : (
                <p>No register details available.</p>
            )}
        </Drawer>
    );
};

export default RegisterViewModel;
