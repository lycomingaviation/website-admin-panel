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
    Popconfirm
} from "antd";
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import apiRequest from "../Utils/api";
import debounce from "lodash/debounce";
import Title from "antd/lib/typography/Title";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const EventCheckinManagement: React.FC = () => {
    const [searchText, setSearchText] = useState("");
    const [fromDate, setFromDate] = useState<string | null>(null);
    const [toDate, setToDate] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [checkinList, setCheckinList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchCheckins();
    }, [currentPage, pageSize, fromDate, toDate, statusFilter]);

    useEffect(() => {
        const debouncedSearch = debounce(() => {
            setCurrentPage(1);
            fetchCheckins();
        }, 500);
        debouncedSearch();
        return () => debouncedSearch.cancel();
    }, [searchText]);

    const fetchCheckins = async () => {
        setLoading(true);
        const payload = {
            page: currentPage,
            limit: pageSize,
            searchTerm: searchText,
            fromDate: fromDate,
            toDate: toDate,
            entry_status: statusFilter
        };

        try {
            const response = await apiRequest("POST", "seminarCheckinSelect.php", payload);
            if (response.success && response.data) {
                setCheckinList(
                    response.data.map((item: any, index: number) => ({
                        ...item,
                        sno: (currentPage - 1) * pageSize + index + 1,
                        key: item.id,
                    }))
                );
                setTotalCount(response.totalCount);
            } else {
                notification.error({ message: "Failed to fetch check-in data" });
            }
        } catch (error) {
            console.error("Error fetching checkins:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            const response = await apiRequest("POST", "seminarCheckinUpdate.php", {
                id,
                entry_status: newStatus
            });
            if (response.success) {
                notification.success({ message: "Status updated successfully" });
                fetchCheckins();
            } else {
                notification.error({ message: "Update failed" });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            notification.error({ message: "Error updating status" });
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

    const columns = [
        {
            title: "S.No",
            dataIndex: "sno",
            key: "sno",
            width: 70,
        },
        {
            title: "Ticket No.",
            dataIndex: "ticket_number",
            key: "ticket_number",
            render: (text: string) => <Tag color="purple" style={{ fontWeight: 'bold' }}>{text}</Tag>,
        },
        {
            title: "Name",
            dataIndex: "name_capital",
            key: "name_capital",
        },
        {
            title: "Phone",
            dataIndex: "contact_number",
            key: "contact_number",
        },
        {
            title: "Entry Status",
            dataIndex: "entry_status",
            key: "entry_status",
            render: (status: string) => (
                <Tag color={status === 'arrived' ? 'green' : 'orange'}>
                    {status === 'arrived' ? 'PRESENT' : 'NOT ARRIVED'}
                </Tag>
            ),
        },
        {
            title: "Check-in Time",
            dataIndex: "entry_time",
            key: "entry_time",
            render: (time: string) => time ? dayjs(time).format("DD MMM, hh:mm A") : '-',
        },
        {
            title: "Action",
            key: "action",
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {record.entry_status !== 'arrived' ? (
                        <Popconfirm
                            title="Confirm Check-in?"
                            onConfirm={() => handleStatusUpdate(record.id, 'arrived')}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button type="primary" size="small" icon={<CheckCircleOutlined />}>
                                Check In
                            </Button>
                        </Popconfirm>
                    ) : (
                        <Popconfirm
                            title="Undo Check-in?"
                            onConfirm={() => handleStatusUpdate(record.id, 'not_arrived')}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button danger size="small" icon={<CloseCircleOutlined />}>
                                Undo
                            </Button>
                        </Popconfirm>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="p-0 md:pl-4 lg:pl-6 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <Title level={3}>Event Check-in Management</Title>
            </div>

            <div className="flex flex-col md:flex-row justify-end items-center mb-4 gap-2 flex-wrap">
                <Select
                    className="w-40"
                    placeholder="Filter Status"
                    allowClear
                    onChange={(val) => setStatusFilter(val)}
                >
                    <Option value="arrived">Arrived</Option>
                    <Option value="not_arrived">Not Arrived</Option>
                </Select>

                <RangePicker
                    onChange={handleDateChange}
                    format="YYYY-MM-DD"
                    className="rounded-lg"
                />

                <Input
                    placeholder="Search Name, Phone, Ticket..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full md:w-64 rounded-lg"
                />
            </div>

            <div className="w-full overflow-x-auto bg-white rounded-lg shadow-sm">
                <Table
                    columns={columns}
                    dataSource={checkinList}
                    loading={loading}
                    pagination={false}
                    rowKey="id"
                    scroll={{ x: 800 }}
                />
            </div>

            <div className="flex justify-between items-center mt-4">
                <span className="text-gray-500">
                    Total: {totalCount} records
                </span>
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalCount}
                    onChange={(page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    }}
                    showSizeChanger
                />
            </div>
        </div>
    );
};

export default EventCheckinManagement;
