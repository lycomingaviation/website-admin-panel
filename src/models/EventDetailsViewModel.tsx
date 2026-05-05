import React from "react";
import { Modal, Descriptions } from "antd";

interface EventDetailsViewModelProps {
    visible: boolean;
    onClose: () => void;
    data: {
        name_capital?: string;
        email?: string;
        qualification?: string;
        contact_number?: string;
        location?: string;
        in_12th?: string;
        looking_for?: string;
        cpl_knowledge_rating?: number;
        cabin_crew_knowledge_rating?: number;
        ground_staff_knowledge_rating?: number;
        why_participate?: string;
        previous_experience?: string;
        guest_relationship?: string;
        how_know_event?: string;
        attended_2024_event?: string;
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        ticket_path?: string;
        created_at?: string;
    } | null;
}

const EventDetailsViewModel: React.FC<EventDetailsViewModelProps> = ({
    visible,
    onClose,
    data,
}) => {
    return (
        <Modal
            visible={visible}
            title="Event Registration Details"
            onCancel={onClose}
            footer={null}
            centered
            width={640}
            bodyStyle={{ maxHeight: "500px", overflowY: "auto", padding: "24px" }}
        >
            {data ? (
                <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Name">{data.name_capital}</Descriptions.Item>
                    <Descriptions.Item label="Email">
                        {data.email ? <a href={`mailto:${data.email}`}>{data.email}</a> : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Contact">
                        {data.contact_number ? <a href={`tel:${data.contact_number}`}>{data.contact_number}</a> : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Qualification">{data.qualification || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Location">{data.location || "-"}</Descriptions.Item>
                    <Descriptions.Item label="In 12th">{data.in_12th || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Looking For">{data.looking_for || "-"}</Descriptions.Item>
                    <Descriptions.Item label="CPL Knowledge Rating">{data.cpl_knowledge_rating ?? "-"}</Descriptions.Item>
                    <Descriptions.Item label="Cabin Crew Knowledge Rating">{data.cabin_crew_knowledge_rating ?? "-"}</Descriptions.Item>
                    <Descriptions.Item label="Ground Staff Knowledge Rating">{data.ground_staff_knowledge_rating ?? "-"}</Descriptions.Item>
                    <Descriptions.Item label="Why Participate">{data.why_participate || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Previous Experience">{data.previous_experience || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Guest Relationship">{data.guest_relationship || "-"}</Descriptions.Item>
                    <Descriptions.Item label="How Know Event">{data.how_know_event || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Attended 2024 Event">{data.attended_2024_event || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Payment ID">{data.razorpay_payment_id || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Order ID">{data.razorpay_order_id || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Ticket">{data.ticket_path ? "Yes" : "No"}</Descriptions.Item>
                    <Descriptions.Item label="Registered At">{data.created_at || "-"}</Descriptions.Item>
                </Descriptions>
            ) : (
                <p>No details available.</p>
            )}
        </Modal>
    );
};

export default EventDetailsViewModel;
