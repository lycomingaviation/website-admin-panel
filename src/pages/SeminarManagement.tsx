import React, { useEffect, useState } from "react";
import {
    Table,
    Input,
    Button,
    Pagination,
    Tag,
    notification,
    DatePicker,
    Select,
    Popconfirm,
    Tooltip,
} from "antd";
import {
    MailOutlined,
    SearchOutlined,
    CopyOutlined,
    ShareAltOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import apiRequest from "../Utils/api";
import debounce from "lodash/debounce";
import Title from "antd/lib/typography/Title";
import dayjs from "dayjs";
import ExcelExportButton from "../components/ExcelExport";

const { RangePicker } = DatePicker;
const { Option } = Select;

type PaymentStatus = "paid" | "pending" | "failed";

const STATUS_COLOR: Record<PaymentStatus, string> = {
    paid: "green",
    pending: "orange",
    failed: "red",
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
};

const SeminarManagement: React.FC = () => {
    const [searchText, setSearchText] = useState("");
    const [fromDate, setFromDate] = useState<string | null>(null);
    const [toDate, setToDate] = useState<string | null>(null);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // ── Fetch ─────────────────────────────────────────────
    useEffect(() => {
        fetchData();
    }, [currentPage, pageSize, fromDate, toDate, paymentStatusFilter]);

    useEffect(() => {
        const debounced = debounce(() => {
            setCurrentPage(1);
            fetchData();
        }, 400);
        debounced();
        return () => debounced.cancel();
    }, [searchText]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await apiRequest("POST", "seminarRegistrationSelect.php", {
                page: currentPage,
                limit: pageSize,
                searchTerm: searchText,
                fromDate,
                toDate,
                paymentStatus: paymentStatusFilter,
            });
            if (response.success && response.data) {
                setList(
                    response.data.map((item: any, i: number) => ({
                        ...item,
                        sno: (currentPage - 1) * pageSize + i + 1,
                        key: item.id,
                    }))
                );
                setTotalCount(response.totalCount);
            } else {
                notification.error({ message: "Failed to fetch registrations" });
            }
        } catch {
            notification.error({ message: "Network error" });
        } finally {
            setLoading(false);
        }
    };

    // ── Payment status update ─────────────────────────────
    const handlePaymentStatusUpdate = async (id: number, newStatus: PaymentStatus) => {
        setUpdatingId(id);
        try {
            const response = await apiRequest("POST", "seminarPaymentStatusUpdate.php", {
                id,
                payment_status: newStatus,
            });
            if (response.success) {
                notification.success({ message: "Payment status updated successfully" });
                fetchData();
            } else {
                notification.error({ message: response.error || "Update failed" });
            }
        } catch {
            notification.error({ message: "Error updating status" });
        } finally {
            setUpdatingId(null);
        }
    };

    // ── Send Email ────────────────────────────────────────
    const handleSendEmail = async (id: number) => {
        setSendingEmailId(id);
        try {
            const response = await apiRequest("POST", "seminarSendTicketEmail.php", { id });
            if (response.success) {
                notification.success({ message: response.message || "Ticket sent successfully!" });
            } else {
                notification.error({ message: response.error || "Failed to send email" });
            }
        } catch {
            notification.error({ message: "Error sending email" });
        } finally {
            setSendingEmailId(null);
        }
    };

    // ── Copy ticket link ──────────────────────────────────
    const handleCopyLink = (url: string) => {
        if (!url) {
            notification.warning({ message: "Ticket link not available yet" });
            return;
        }
        navigator.clipboard.writeText(url).then(() => {
            notification.success({ message: "Ticket link copied to clipboard!" });
        }).catch(() => {
            // Fallback for older browsers
            const ta = document.createElement("textarea");
            ta.value = url;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            notification.success({ message: "Ticket link copied!" });
        });
    };

    // ── Share ticket link ─────────────────────────────────
    const handleShareLink = (record: any) => {
        const url = record.ticket_url;
        const name = record.name_capital;
        const phone = record.contact_number;
        const ticketNo = record.ticket_number;

        if (!url) {
            notification.warning({ message: "Ticket link not available yet" });
            return;
        }

        const waText = encodeURIComponent(
            `🎟️ Aviation Seminar 2026 – Lycoming Aviation Academy\n\n` +
            `Hi ${name}, your registration is confirmed!\n` +
            `Ticket No: ${ticketNo}\n\n` +
            `View & download your ticket here:\n${url}`
        );

        if (navigator.share) {
            navigator.share({ title: "Aviation Seminar 2026 Ticket", url }).catch(() => { });
        } else {
            window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${waText}`, "_blank");
        }
    };

    // ── Date range ────────────────────────────────────────
    const handleDateChange = (dates: any) => {
        if (dates && dates.length === 2) {
            setFromDate(dayjs(dates[0]).format("YYYY-MM-DD"));
            setToDate(dayjs(dates[1]).format("YYYY-MM-DD"));
        } else {
            setFromDate(null);
            setToDate(null);
        }
        setCurrentPage(1);
    };

    // ── Columns ───────────────────────────────────────────
    const columns = [
        { title: "S.No", dataIndex: "sno", key: "sno", width: 60 },
        {
            title: "Ticket No.",
            dataIndex: "ticket_number",
            key: "ticket_number",
            width: 100,
            render: (val: string) =>
                val ? <Tag color="purple" style={{ fontWeight: "bold" }}>{val}</Tag> : <span className="text-gray-400">—</span>,
        },
        { title: "Name", dataIndex: "name_capital", key: "name_capital" },
        {
            title: "Phone",
            dataIndex: "contact_number",
            key: "contact_number",
            render: (p: string) => <a href={`tel:${p}`}>{p}</a>,
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            render: (e: string) => <a href={`mailto:${e}`}>{e}</a>,
        },
        {
            title: "Looking For",
            dataIndex: "looking_for",
            key: "looking_for",
            width: 160,
        },
        {
            title: "Payment",
            dataIndex: "payment_status",
            key: "payment_status",
            width: 110,
            render: (status: PaymentStatus) => (
                <Tag color={STATUS_COLOR[status] ?? "default"}>
                    {STATUS_LABEL[status] ?? status}
                </Tag>
            ),
        },
        {
            title: "Registered",
            dataIndex: "created_at",
            key: "created_at",
            width: 130,
        },
        {
            title: "Actions",
            key: "actions",
            width: 200,
            render: (_: any, record: any) => (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {/* ── Payment status toggle ── */}
                    {record.payment_status !== "paid" ? (
                        <Popconfirm
                            title="Mark this registration as Paid?"
                            onConfirm={() => handlePaymentStatusUpdate(record.id, "paid")}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                loading={updatingId === record.id}
                                style={{ backgroundColor: "#16a34a", border: "none" }}
                            >
                                Mark Paid
                            </Button>
                        </Popconfirm>
                    ) : (
                        <Popconfirm
                            title="Revert payment status to Pending?"
                            onConfirm={() => handlePaymentStatusUpdate(record.id, "pending")}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                size="small"
                                danger
                                loading={updatingId === record.id}
                            >
                                Revert
                            </Button>
                        </Popconfirm>
                    )}

                    {/* ── Send Mail ── */}
                    <Tooltip title="Send ticket to email">
                        <Popconfirm
                            title="Send ticket to this email?"
                            onConfirm={() => handleSendEmail(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                size="small"
                                icon={<MailOutlined />}
                                loading={sendingEmailId === record.id}
                                disabled={record.payment_status !== "paid"}
                                style={{ color: "#6a3de8", borderColor: "#6a3de8" }}
                            />
                        </Popconfirm>
                    </Tooltip>

                    {/* ── Copy ticket link ── */}
                    <Tooltip title="Copy ticket link">
                        <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyLink(record.ticket_url)}
                            disabled={!record.ticket_url}
                        />
                    </Tooltip>

                    {/* ── Share via WhatsApp / Web Share ── */}
                    <Tooltip title="Share ticket (WhatsApp)">
                        <Button
                            size="small"
                            icon={<ShareAltOutlined />}
                            onClick={() => handleShareLink(record)}
                            disabled={!record.ticket_url}
                            style={{ color: "#25D366", borderColor: "#25D366" }}
                        />
                    </Tooltip>
                </div>
            ),
        },
    ];

    const ExcelColumns = [
        { title: "S.No", dataIndex: "sno" },
        { title: "Ticket No.", dataIndex: "ticket_number" },
        { title: "Name", dataIndex: "name_capital" },
        { title: "Email", dataIndex: "email" },
        { title: "Contact", dataIndex: "contact_number" },
        { title: "Qualification", dataIndex: "qualification" },
        { title: "Location", dataIndex: "location" },
        { title: "In 12th", dataIndex: "in_12th" },
        { title: "Looking For", dataIndex: "looking_for" },
        { title: "Guest", dataIndex: "guest_relationship" },
        { title: "Payment Status", dataIndex: "payment_status" },
        { title: "Razorpay ID", dataIndex: "razorpay_payment_id" },
        { title: "Registered At", dataIndex: "created_at" },
    ];

    return (
        <div className="p-0 md:pl-4 lg:pl-6 mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <Title level={3}>Seminar Registrations</Title>
            </div>

            {/* Filters toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Payment status filter */}
                    <Select
                        className="w-40"
                        placeholder="Payment Status"
                        allowClear
                        value={paymentStatusFilter || undefined}
                        onChange={(val) => {
                            setPaymentStatusFilter(val ?? "");
                            setCurrentPage(1);
                        }}
                    >
                        <Option value="paid">✅ Paid</Option>
                        <Option value="pending">🕐 Pending</Option>
                        <Option value="failed">❌ Failed</Option>
                    </Select>

                    {/* Date Range */}
                    <RangePicker
                        onChange={handleDateChange}
                        format="YYYY-MM-DD"
                        className="rounded-lg"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Excel Export */}
                    <ExcelExportButton
                        columns={ExcelColumns}
                        fileName="SeminarRegistrations"
                        apiEndpoint="seminarRegistrationSelect.php"
                        apiMethod="POST"
                        apiPayload={{
                            searchTerm: searchText,
                            fromDate,
                            toDate,
                            paymentStatus: paymentStatusFilter,
                        }}
                    />

                    {/* Search */}
                    <Input
                        placeholder="Search name, email, phone, ticket..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => {
                            setSearchText(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="!w-64 !rounded-lg"
                    />
                </div>
            </div>

            {/* Summary badges */}
            <div className="flex gap-3 mb-4 flex-wrap">
                {(["paid", "pending", "failed"] as PaymentStatus[]).map((s) => (
                    <span
                        key={s}
                        className="cursor-pointer"
                        onClick={() => {
                            setPaymentStatusFilter(paymentStatusFilter === s ? "" : s);
                            setCurrentPage(1);
                        }}
                    >
                        <Tag
                            color={STATUS_COLOR[s]}
                            style={{
                                fontSize: 13,
                                padding: "4px 12px",
                                borderRadius: 20,
                                cursor: "pointer",
                                fontWeight: paymentStatusFilter === s ? 700 : 400,
                                opacity: paymentStatusFilter && paymentStatusFilter !== s ? 0.5 : 1,
                            }}
                        >
                            {STATUS_LABEL[s]}
                        </Tag>
                    </span>
                ))}
                {paymentStatusFilter && (
                    <Button
                        size="small"
                        type="link"
                        onClick={() => { setPaymentStatusFilter(""); setCurrentPage(1); }}
                    >
                        Clear filter
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto bg-white rounded-lg shadow-sm">
                <Table
                    columns={columns}
                    dataSource={list}
                    loading={loading}
                    bordered
                    pagination={false}
                    rowKey="id"
                    scroll={{ x: 1000 }}
                    rowClassName={(record) =>
                        record.payment_status === "paid"
                            ? "bg-green-50"
                            : record.payment_status === "failed"
                                ? "bg-red-50"
                                : ""
                    }
                />
            </div>

            {/* Footer Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-3 sm:space-y-0">
                <span className="text-sm text-gray-600">
                    {`Showing ${Math.min((currentPage - 1) * pageSize + 1, totalCount)} – ${Math.min(
                        currentPage * pageSize,
                        totalCount
                    )} of ${totalCount} records`}
                </span>
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalCount}
                    showSizeChanger
                    onChange={(page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    }}
                />
            </div>
        </div>
    );
};

export default SeminarManagement;
