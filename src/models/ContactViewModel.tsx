import React from "react";
import { Modal, Descriptions } from "antd";

interface ContactViewModelProps {
    visible: boolean;
    onClose: () => void;
    contactData: {
        name?: string;
        phoneNumber?: string;
        email?: string;
        message?: string;
    } | null;
}

const ContactViewModel: React.FC<ContactViewModelProps> = ({
    visible,
    onClose,
    contactData,
}) => {
    return (
        <Modal
            visible={visible}
            title="Contact Details"
            onCancel={onClose}
            footer={null}
            centered
            width={600}
            bodyStyle={{ maxHeight: "400px", overflowY: "auto", padding: "24px" }} // Scrollable content
        >
            {contactData ? (
                <Descriptions column={1} bordered>
                    <Descriptions.Item label="Name">
                        {contactData.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone Number">
                        {contactData.phoneNumber ? (
                            <a href={`tel:${contactData.phoneNumber}`}>
                                {contactData.phoneNumber}
                            </a>
                        ) : (
                            "-"
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                        {contactData.email ? (
                            <a href={`mailto:${contactData.email}`}>
                                {contactData.email}
                            </a>
                        ) : (
                            "-"
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Message">
                        {contactData.message}
                    </Descriptions.Item>
                </Descriptions>
            ) : (
                <p>No contact details available.</p>
            )}
        </Modal>
    );
};

export default ContactViewModel;
