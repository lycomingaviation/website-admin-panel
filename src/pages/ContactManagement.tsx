import React, { useEffect, useState } from "react";
import {
    Table,
    Input,
    Button,
    Pagination,
    Dropdown,
    Menu,
    Popconfirm,
    notification,
    DatePicker,
} from "antd";
import { SearchOutlined, MoreOutlined } from "@ant-design/icons";
import apiRequest from "../Utils/api";
import debounce from "lodash/debounce";
import Title from "antd/lib/typography/Title";
import ContactViewModel from "../models/ContactViewModel";
import ExcelExportButton from "../components/ExcelExport";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const ContactManagement: React.FC = () => {
    const [selectedContact, setSelectedContact] = useState<any>(null);
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
            setCurrentPage(1); // Reset to first page on search
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
            const response = await apiRequest("POST", "contactselect.php", payload);

            if (response.success && response.data) {
                const { data, totalCount } = response;
                setProductList(
                    data.map((product: any, index: number) => ({
                        ...product,
                        sno: (currentPage - 1) * pageSize + index + 1, // Adjust serial number for pagination
                        key: product.id, // Set unique key for table
                    }))
                );
                setTotalCount(totalCount); // Set the total count for pagination
            } else {
                console.error("Fetch contact failed:", response.message);
            }
        } catch (error) {
            console.error("Error during contact fetch:", error);
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

    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    const handleDelete = async (id: any) => {
        try {
            const response = await apiRequest("POST", "contactdelete.php", { id });
            if (response.success) {
                notification.success({ message: response?.message ?? "Success" });
                fetchProduct();
            } else {
                notification.error({
                    message:
                        response?.error ?? "Something went wrong, please try again later.",
                });
            }
        } catch (error) {
            console.error("Error during contact fetch:", error);
        } finally {
            setLoading(false);
        }
    };

    const columns: any = [
        {
            title: "S.No",
            dataIndex: "sno",
            key: "sno",
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Phone Number",
            dataIndex: "phoneNumber",
            key: "phoneNumber",
            render: (phoneNo: string) =>
                phoneNo ? <a href={`tel:${phoneNo}`}>{phoneNo}</a> : "-",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            render: (email: string) =>
                email ? <a href={`mailto:${email}`}>{email}</a> : "-",
        },
        {
            title: "Action",
            key: "action",
            render: (_: any, record: any) => {
                return (
                    <Dropdown
                        trigger={["click"]}
                        overlay={
                            <Menu>
                                <Menu.Item key="view">
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedContact(record);
                                            setIsModalVisible(true);
                                        }}
                                    >
                                        View
                                    </span>
                                </Menu.Item>
                                <Menu.Item key="delete">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Popconfirm
                                            title="Are you sure you want to delete this contact?"
                                            onConfirm={() => handleDelete(record.id)}
                                            okText="Yes"
                                            cancelText="No"
                                        >
                                            <span>Delete</span>
                                        </Popconfirm>
                                    </div>
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
                );
            },
        },
    ];

    const ExcelColumn = [
        ...columns,
        { "title": "Message", "dataIndex": "message" }
    ]

    return (
        <div className="p-0 md:pl-4 lg:pl-6 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <Title level={3}>Contact Details</Title>
            </div>
            <div className="flex flex-col md:flex-row justify-end items-center mb-4 gap-2">
                <ExcelExportButton
                    columns={ExcelColumn.filter((col: any) => col.key != 'action')} // remove action column
                    fileName="Contacts"
                    apiEndpoint="contactselectExcel.php"
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
                    placeholder="Search..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={handleSearch}
                    className="!w-[14rem] md:!w-[20rem] !rounded-lg"
                />
            </div>

            {/* Table Component */}
            <div className="w-full overflow-x-auto">
                <Table
                    columns={columns}
                    dataSource={productList}
                    loading={loading}
                    bordered
                    pagination={false}
                    onChange={handleTableChange}
                    scroll={{ x: 400 }}
                    tableLayout="auto"
                />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-3 sm:space-y-0">
                {/* Records Count */}
                <span className="text-sm text-gray-600">
                    {`Showing ${(currentPage - 1) * pageSize + 1} - ${Math.min(
                        currentPage * pageSize,
                        totalCount
                    )} of ${totalCount} records`}
                </span>

                {/* Pagination */}
                <Pagination
                    className="flex items-center space-x-2"
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalCount}
                    showSizeChanger
                    showQuickJumper={false}
                    onChange={(page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    }}
                />
            </div>

            {/* contact view model */}
            <ContactViewModel
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                contactData={selectedContact}
            />

        </div>
    );
};

export default ContactManagement;
