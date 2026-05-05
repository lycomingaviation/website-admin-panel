import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  DatePicker,
  Dropdown,
  Menu,
  Pagination,
  notification,
} from "antd";
import { PlusOutlined, SearchOutlined, MoreOutlined } from "@ant-design/icons";

import apiRequest from "../Utils/api";
// import Title from 'antd/es/typography/Title';
import { uiApiDateFormat } from "../Utils/Common";
import { useNavigate } from "react-router-dom";
import Title from "antd/lib/typography/Title";
import DeleteWithOtpModal from "../models/DeleteWithOtpModal";
import InvoiceViewModel from "../models/invoiceViewmodel";
import InvoiceModel from "../models/invoiceModel";

const InvoiceManagement: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({ searchTerm: "" });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<number | null>(null); // State for selected ID
  const [quotationId, setQuotationId] = useState<number | null>(null); // State for selected ID
  const [isConvert, setIsConvert] = useState(false); // State for selected ID
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({ startDate: null, endDate: null });

  // Fetch quotations from API
  const fetchQuotations = async () => {
    const api = "invoiceSelect";
    setLoading(true);
    try {
      const response = await apiRequest("POST", `${api}.php`, {
        ...filters,
        page: currentPage,
        limit: pageSize,
        fromDate: dateRange.startDate,
        toDate: dateRange.endDate,
      });
      if (response.success) {
        setData(response.list);
        setTotalCount(response.totalCount);
      }
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [filters, dateRange]);

  useEffect(() => {
    fetchQuotations();
  }, [currentPage, pageSize]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, searchTerm: e.target.value, page: 1 }));
  };

  const handleTableChange = (pagination: any) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
    }));

    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleEdit = (id: number, isConvert = false) => {
    setSelectedId(id); // Set the selected ID
    setIsDrawerOpen(true); // Open the modal
    setIsConvert(isConvert);
  };

  const handleSearchDateChange = (dates: any) => {
    if (!dates) {
      setDateRange({ startDate: null, endDate: null });
      return;
    }
    const [startDate, endDate] = dates;
    const formattedStartDate = startDate
      ? uiApiDateFormat(startDate, "YYYY-MM-DD")
      : null;
    const formattedEndDate = endDate
      ? uiApiDateFormat(endDate, "YYYY-MM-DD")
      : null;
    const formattedValue = {
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    };
    setDateRange(formattedValue); // Update state
  };

  const handleDelete = async (id: string, otp: string): Promise<void> => {
    try {
      const response = await apiRequest("POST", "invoiceDelete.php", {
        invoiceId: id,
        otp,
      });
      if (response.success) {
        fetchQuotations();
        notification.success({
          message: response.message || "Deleted successfully",
        });
      } else {
        throw new Error(response.message || "Failed to delete");
      }
    } catch (error) {
      notification.error({
        message: error instanceof Error ? error.message : "Failed to delete",
      });
      throw error; // Re-throw to maintain error state in the modal
    }
  };

  const columns = [
    {
      title: "S.No",
      key: "sno",
      render: (_: any, __: any, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
      onCell: () => ({ onClick: () => setIsViewDrawerOpen(true) }),
    },
    {
      title: "Invoice No",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      className: "whitespace-nowrap ",
      render: (_: any, record: any) => (
        <span
          onClick={() => {
            // navigate("/payments", { state: { invoiceId: record.id } });
            setIsViewDrawerOpen(true);
            setQuotationId(record.id);
          }}
          style={{ cursor: "pointer", color: "blue" }}
        >
          {record.invoiceNo}
        </span>
      ),
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
    },
    {
      title: "Total Amount",
      dataIndex: "overallTotal",
      key: "overallTotal",
      render: (_: any, record: any) => (
        <span
          onClick={() => {
            navigate("/payments", { state: { invoiceId: record.id } });
          }}
          style={{ cursor: "pointer", color: "blue" }}
        >
          {record.totalAmount ? `₹${record.totalAmount}` : "-"}
        </span>
      ),
    },
    {
      title: "Balance Amount",
      dataIndex: "balanceAmount",
      key: "balanceAmount",
      render: (_: any, record: any) => (
        <span
          style={{ cursor: "pointer", color: "blue" }}
        >
          {record.balanceAmount ? `₹${record.balanceAmount}` : "-"}
        </span>
      ),
    },

    {
      title: "Created Date",
      dataIndex: "date",
      key: "date",
      className: "whitespace-nowrap ",
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => {
        const menuItems = [
          {
            key: "edit",
            label: "Edit",
            onClick: () => handleEdit(record.id),
          },
          {
            key: "view",
            label: "View",
            onClick: () => {
              setIsViewDrawerOpen(true);
              setQuotationId(record.id);
            },
          },
          {
            key: "delete",
            label: "Delete",
            onClick: () => {
              setCurrentRecordId(record.id);
              setDeleteModalVisible(true);
            },
          },
        ];

        return (
          <Dropdown overlay={<Menu items={menuItems} />} trigger={["click"]}>
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

  return (
    <div className="p-0 md:pl-4 lg:pl-6 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <Title level={3}>Invoice Management</Title>
      </div>
      {/* Search & Date Picker */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <div style={{ position: "relative", display: "inline-block" }}>
          <DatePicker.RangePicker
            format="DD-MM-YYYY"
            onChange={(dates) => handleSearchDateChange(dates)}
            className="!w-[14rem] md:!w-[20rem]"
            inputReadOnly={true}
            getPopupContainer={(trigger) =>
              trigger.parentElement || document.body
            }
          />
        </div>

        <Input
          placeholder="Search..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          className="!w-[14rem] md:!w-[20rem]"
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="bg-red-500 !flex items-center gap-2 btn-color !border-none !rounded-lg"
          onClick={() => {
            setSelectedId(null); // Reset selected ID when adding a new quotation
            setIsDrawerOpen(true);
          }}
        >
          Add Invoice
        </Button>
      </div>

      {/* Table Section */}
      <div className="w-full overflow-x-auto">
        <Table
          columns={columns}
          dataSource={data}
          bordered
          loading={loading}
          pagination={false}
          onChange={handleTableChange}
          scroll={{ x: 600 }}
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

      <DeleteWithOtpModal
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleDelete}
        recordId={currentRecordId || ""}
        from="Invoice"
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
      />

      {/* Drawer Components */}
      <InvoiceViewModel
        isOpen={isViewDrawerOpen}
        onClose={() => {
          setIsViewDrawerOpen(false);
          setQuotationId(null);
        }}
        quotationId={quotationId}
      />

      <InvoiceModel
        isOpen={isDrawerOpen}
        onSuccess={() => {
          fetchQuotations();
        }}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedId(null);
        }}
        selectedId={selectedId} // Pass the selected ID to the modal
        isConvert={isConvert}
      />
    </div>
  );
};

export default InvoiceManagement;
