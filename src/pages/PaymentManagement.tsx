import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Card,
  Dropdown,
  Menu,
  notification,
  Pagination,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  MoreOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import apiRequest from "../Utils/api";
import debounce from "lodash/debounce";
import { motion } from "framer-motion";
import PaymentModel from "../models/paymentModel";
import { useLocation, useNavigate } from "react-router-dom";
import QuotataionViewModel from "../models/invoiceViewmodel";
import DeleteWithOtpModal from "../models/DeleteWithOtpModal";

type PaymentManagementProps = {
  type?: any;
};

const PaymentManagement: React.FC<PaymentManagementProps> = ({ type }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceId = location?.state?.invoiceId;
  const [searchText, setSearchText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState({
    invoiceAmount: 0,
    receivedAmount: 0,
    pendingAmount: 0,
    advance: 0,
  });

  useEffect(() => {
    fetchProduct();
    fetchInvoiceSingle();
  }, [currentPage, pageSize, invoiceId]);

  useEffect(() => {
    const debouncedSearch = debounce(() => {
      setCurrentPage(1); // Reset to first page on search
      fetchProduct();
      fetchInvoiceSingle();
    }, 300);
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [searchText]);

  const fetchInvoiceSingle = async () => {
    try {
      const response = await apiRequest("POST", `invoiceSingleSelect.php`, {
        invoiceId,
      });
      if (response.success && response) {
        setDashboardData({
          invoiceAmount: response?.overallTotal ?? 0,
          receivedAmount: response?.recivedAmount ?? 0,
          pendingAmount: response?.balanceAmount ?? 0,
          advance: response?.advance ?? 0,
        });
        setInvoiceNo(response?.invoiceNo);
      }
    } catch (error: any) {}
  };

  const fetchProduct = async () => {
    setLoading(true);
    const payload = {
      page: currentPage,
      limit: pageSize,
      searchTerm: searchText,
      type: type,
      invoiceId,
    };

    try {
      const response = await apiRequest("POST", "paymentSelect.php", payload);

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
        console.error("Fetch product failed:", response.message);
      }
    } catch (error) {
      console.error("Error during product fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleEditClick = (id: string) => {
    setSelectedProductId(id);
    setIsDrawerOpen(true);
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleDelete = async (id: string, otp: string): Promise<void> => {
    try {
      const response = await apiRequest("POST", "paymentDelete.php", {
        id,
        otp,
      });
      if (response.success) {
        notification.success({ message: response?.message ?? "Success" });
        fetchProduct();
        fetchInvoiceSingle();
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
      dataIndex: "sno",
      key: "sno",
    },
    {
      title: "Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      className: "whitespace-nowrap ",
    },
    {
      title: "Credit Amount",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Payment Mode",
      dataIndex: "paymentMode",
      key: "paymentMode",
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
                <Menu.Item
                  key="edit"
                  onClick={() => handleEditClick(record.id)}
                >
                  Edit
                </Menu.Item>
                <Menu.Item key="delete">
                  <div
                    onClick={(e) => {
                      console.log(e);
                      setCurrentRecordId(record.id);
                      setDeleteModalVisible(true);
                    }}
                  >
                    Delete
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

  const cardData = [
    {
      title: " Invoice Amount",
      value: `₹ ${dashboardData?.invoiceAmount}`,
    },
    {
      title: " Received Amount",
      value: `₹ ${dashboardData?.receivedAmount}`,
    },
    {
      title: " Balance Amount",
      value: `₹ ${dashboardData?.pendingAmount}`,
    },
    {
      title: "Advance",
      value: `₹ ${dashboardData?.advance}`,
    },
  ];

  const cardVariants = {};

  const containerVariants = {};

  return (
    <div className="p-0 md:pl-4 lg:pl-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Payment Details</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="bg-red-500 !flex items-center gap-2 btn-color !border-none !rounded-lg"
          onClick={() => setIsDrawerOpen(true)}
        >
          Add Payment
        </Button>
      </div>

      <button
        className="flex items-center text-600 hover:text-800 font-medium mb-5 text-color"
        onClick={() => navigate(-1)}
      >
        <LeftOutlined className="text-sm mr-1" />
        Back
      </button>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {cardData.map((card, index) => (
          <motion.div
            key={index}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card
              className="shadow-lg rounded-xl !rounded-[8px] flex items-center justify-between bg-gray-50 hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
              bodyStyle={{ padding: "12px" }}
            >
              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-700">
                  {card.title}
                </h3>
                <p className="text-xl sm:text-2xl font-bold text-color b-900">
                  {card.value}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <Input
          placeholder="Search..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          className="!w-[20rem]"
        />

        <Button
          type="primary"
          icon={<EyeOutlined />}
          className="bg-red-500 !flex items-center gap-2 btn-color !border-none !rounded-lg mt-3"
          onClick={() => setIsViewDrawerOpen(true)}
        >
          {invoiceNo}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={productList}
        loading={loading}
        bordered
        pagination={false}
        onChange={handleTableChange}
        className="w-full overflow-x-auto"
      />
      {/* <h4 className=" font-semibold mb-2 text-left ">Total Count: {totalCount}</h4> */}
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

      {/* Drawer Component */}
      <PaymentModel
        isOpen={isDrawerOpen}
        onSuccess={() => {
          fetchProduct();
          fetchInvoiceSingle();
        }}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedProductId(null);
        }}
        orderId={selectedProductId}
        invoiceId={invoiceId}
      />

      <QuotataionViewModel
        isOpen={isViewDrawerOpen}
        onClose={() => {
          setIsViewDrawerOpen(false);
        }}
        quotationId={invoiceId}
      />

      <DeleteWithOtpModal
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleDelete}
        recordId={currentRecordId || ""}
        from="Payment"
        title="Delete Payment"
        description="Are you sure you want to delete this Payment? This action cannot be undone."
      />
    </div>
  );
};

export default PaymentManagement;
