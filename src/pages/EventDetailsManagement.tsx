import React, { useEffect, useState } from "react";
import {
    Table,
    Input,
    Button,
    Pagination,
    Dropdown,
    Menu,
    DatePicker,
} from "antd";
import { SearchOutlined, MoreOutlined } from "@ant-design/icons";
import apiRequest from "../Utils/api";
import debounce from "lodash/debounce";
import Title from "antd/lib/typography/Title";
import EventDetailsViewModel from "../models/EventDetailsViewModel";
import ExcelExportButton from "../components/ExcelExport";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const EventDetailsManagement: React.FC = () => {
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [fromDate, setFromDate] = useState<string | null>(null);
    const [toDate, setToDate] = useState<string | null>(null);
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchProduct();
    }, [currentPage, pageSize, fromDate, toDate]);

    useEffect(() => {
        const debouncedSearch = debounce(() => {
            setCurrentPage(1);
            fetchProduct();
        }, 300);
        debouncedSearch();
        return () => debouncedSearch.cancel();
    }, [searchText]);

    const fetchProduct = async () => {
        setLoading(true);
        const payload = {
            page: currentPage,
            limit: pageSize,
            searchTerm: searchText,
            fromDate: fromDate,
            toDate: toDate
        };

        try {
            const response = await apiRequest("POST", "seminarRegistrationSelect.php", payload);

            if (response.success && response.data) {
                const { data, totalCount } = response;
                setProductList(
                    data.map((item: any, index: number) => ({
                        ...item,
                        sno: (currentPage - 1) * pageSize + index + 1,
                        key: item.id,
                    }))
                );
                setTotalCount(totalCount);
            } else {
                console.error("Fetch event details failed:", response.message);
            }
        } catch (error) {
            console.error("Error during event details fetch:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            const response = await apiRequest("POST", "seminarCheckinUpdate.php", {
                id: id,
                entry_status: newStatus
            });
            if (response.success) {
                // Refresh list or update local state
                fetchProduct();
            } else {
                console.error("Status update failed:", response.error);
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const columns: any = [
        { title: "S.No", dataIndex: "sno", key: "sno", width: 70 },
        { title: "Name", dataIndex: "name_capital", key: "name_capital", ellipsis: true },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            ellipsis: true,
            render: (email: string) =>
                email ? <a href={`mailto:${email}`}>{email}</a> : "-",
        },
        {
            title: "Contact",
            dataIndex: "contact_number",
            key: "contact_number",
            render: (phone: string) =>
                phone ? <a href={`tel:${phone}`}>{phone}</a> : "-",
        },
        { title: "Qualification", dataIndex: "qualification", key: "qualification", ellipsis: true },
        { title: "Location", dataIndex: "location", key: "location", ellipsis: true },
        { title: "Looking For", dataIndex: "looking_for", key: "looking_for", ellipsis: true },
        { title: "Payment ID", dataIndex: "razorpay_payment_id", key: "razorpay_payment_id", ellipsis: true },
        { title: "Balance Details", dataIndex: "balance_details", key: "balance_details", width: 140 },
        {
            title: "Arrive Status",
            dataIndex: "entry_status",
            key: "entry_status",
            width: 120,
            render: (status: string, record: any) => (
                <Button
                    type={status === "arrived" ? "primary" : "default"}
                    danger={status !== "arrived"}
                    size="small"
                    onClick={() => handleStatusChange(record.id, status === "arrived" ? "not_arrived" : "arrived")}
                >
                    {status === "arrived" ? "Arrived" : "Not Arrived"}
                </Button>
            ),
        },
        { title: "Registered", dataIndex: "created_at", key: "created_at", width: 120 },
        {
            title: "Action",
            key: "action",
            width: 100,
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    <Button
                        type="link"
                        size="small"
                        onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/pro/lycoming/lycoming-website/'}view-ticket.php?id=${record.id}&key=${record.ticket_key}`, '_blank')}
                    >
                        View Ticket
                    </Button>
                    <Dropdown
                        trigger={["click"]}
                        overlay={
                            <Menu>
                                <Menu.Item key="view">
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedRecord(record);
                                            setIsModalVisible(true);
                                        }}
                                    >
                                        View
                                    </span>
                                </Menu.Item>
                            </Menu>
                        }
                    >
                        <Button
                            type="text"
                            icon={<MoreOutlined />}
                            className="hover:bg-gray-200 rounded-full"
                        />
                    </Dropdown>
                </div>
            ),
        },
    ];

    const excelColumns = [
        { title: "S.No", dataIndex: "sno" },
        { title: "Name", dataIndex: "name_capital" },
        { title: "Email", dataIndex: "email" },
        { title: "Contact", dataIndex: "contact_number" },
        { title: "Qualification", dataIndex: "qualification" },
        { title: "Location", dataIndex: "location" },
        { title: "In 12th", dataIndex: "in_12th" },
        { title: "Looking For", dataIndex: "looking_for" },
        { title: "CPL Rating", dataIndex: "cpl_knowledge_rating" },
        { title: "Cabin Crew Rating", dataIndex: "cabin_crew_knowledge_rating" },
        { title: "Ground Staff Rating", dataIndex: "ground_staff_knowledge_rating" },
        { title: "Why Participate", dataIndex: "why_participate" },
        { title: "Previous Experience", dataIndex: "previous_experience" },
        { title: "Guest Relationship", dataIndex: "guest_relationship" },
        { title: "How Know Event", dataIndex: "how_know_event" },
        { title: "Attended 2024", dataIndex: "attended_2024_event" },
        { title: "Payment ID", dataIndex: "razorpay_payment_id" },
        { title: "Order ID", dataIndex: "razorpay_order_id" },
        { title: "Registered At", dataIndex: "created_at" },
    ];

    return (
        <div className="p-0 md:pl-4 lg:pl-6 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <Title level={3}>Event Details (Aviation Seminar Registrations)</Title>
            </div>
            <div className="flex flex-col md:flex-row justify-end items-center mb-4 gap-2 flex-wrap">
                <ExcelExportButton
                    columns={excelColumns}
                    fileName="Event_Registrations"
                    apiEndpoint="seminarRegistrationSelectExcel.php"
                    apiMethod="POST"
                    apiPayload={{
                        searchTerm: searchText,
                        fromDate: fromDate,
                        toDate: toDate
                    }}
                />
                <RangePicker
                    onChange={handleDateChange}
                    format="YYYY-MM-DD"
                    className="!rounded-lg"
                />
                <Input
                    placeholder="Search name, email, contact, location..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={handleSearch}
                    className="!w-[14rem] md:!w-[20rem] !rounded-lg"
                />
            </div>

            <div className="w-full overflow-x-auto">
                <Table
                    columns={columns}
                    dataSource={productList}
                    loading={loading}
                    bordered
                    pagination={false}
                    scroll={{ x: 900 }}
                    tableLayout="auto"
                />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-3 sm:space-y-0">
                <span className="text-sm text-gray-600">
                    {`Showing ${(currentPage - 1) * pageSize + 1} - ${Math.min(
                        currentPage * pageSize,
                        totalCount
                    )} of ${totalCount} records`}
                </span>
                <Pagination
                    className="flex items-center space-x-2"
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalCount}
                    showSizeChanger
                    showQuickJumper={false}
                    onChange={(page, size) => {
                        setCurrentPage(page);
                        setPageSize(size || 10);
                    }}
                />
            </div>

            <EventDetailsViewModel
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                data={selectedRecord}
            />
        </div>
    );
};

export default EventDetailsManagement;
