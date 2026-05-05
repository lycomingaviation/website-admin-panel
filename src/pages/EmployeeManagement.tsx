import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Pagination,
  Dropdown,
  Menu,
  notification,
  Popconfirm,
} from "antd";
import { PlusOutlined, SearchOutlined, MoreOutlined } from "@ant-design/icons";
import apiRequest from "../Utils/api";
import debounce from "lodash/debounce";
import Title from "antd/lib/typography/Title";
import { motion } from "framer-motion";
import EmployeModel from "../models/employeeModel";

type CompanyManagementProps = {
  type?: string;
};

const EmployeeeManagement: React.FC<CompanyManagementProps> = ({ type }) => {
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

  useEffect(() => {
    fetchProduct();
  }, [currentPage, pageSize]);

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
      type: type,
    };

    try {
      const response = await apiRequest("POST", "employeeSelect.php", payload);

      if (response.data) {
        const { data, totalCount } = response;
        setProductList(
          data.map((product: any, index: number) => ({
            ...product,
            sno: (currentPage - 1) * pageSize + index + 1,
            key: product.id,
          }))
        );
        setTotalCount(totalCount);
      } else {
        console.error("Fetch Company Name failed:", response.message);
      }
    } catch (error) {
      console.error("Error during Company Name fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
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

  const handleDelete = async (id: any) => {
    try {
      const response = await apiRequest("POST", "employeeDelete.php", { id });
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
      console.error("Error during product fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
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
      title: "Role",
      dataIndex: "role",
      key: "role",
    },

    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
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
                    onClick={(e) => e.stopPropagation()} // Prevent closing the menu on click
                  >
                    <Popconfirm
                      title="Are you sure you want to delete this Employee?"
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

  return (
    <motion.div className="p-0 md:pl-4 lg:pl-6 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <Title level={3}>Employee Management</Title>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="bg-red-500 !flex items-center gap-2 btn-color !border-none !rounded-lg"
          onClick={() => setIsDrawerOpen(true)}
        >
          Add Employee
        </Button>
        <Input
          placeholder="Search..."
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
          onChange={handleTableChange}
          scroll={{ x: 600 }}
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
            setPageSize(size);
          }}
        />
      </div>

      <EmployeModel
        isOpen={isDrawerOpen}
        onSuccess={fetchProduct}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedProductId(null);
        }}
        productId={selectedProductId}
      />
    </motion.div>
  );
};

export default EmployeeeManagement;
