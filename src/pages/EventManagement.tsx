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
} from "antd";
import { PlusOutlined, SearchOutlined, MoreOutlined } from "@ant-design/icons";
import EventModel from "../models/EventModel";
import apiRequest from "../Utils/api";
// import Title from 'antd/es/typography/Title';
import debounce from "lodash/debounce";
import Title from "antd/lib/typography/Title";
import ExcelExportButton from "../components/ExcelExport";

const EventManagement: React.FC = () => {
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
    };

    try {
      const response = await apiRequest("POST", "eventSelect.php", payload);

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
    setCurrentPage(1);
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
      const response = await apiRequest("POST", "eventDelete.php", { id });
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

  const columns: any = [
    {
      title: "S.No",
      dataIndex: "sno",
      key: "sno",
    },
    {
      title: "Event",
      dataIndex: "eventName",
      key: "eventName",
    },
    {
      title: "Upload Type",
      dataIndex: "uploadType",
      key: "uploadType",
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
                      title="Are you sure you want to delete this Product?"
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
    <div className="p-0 md:pl-4 lg:pl-6 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <Title level={3}>Event Management</Title>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="bg-red-500 !flex items-center gap-2 btn-color !border-none !rounded-lg"
          onClick={() => setIsDrawerOpen(true)}
        >
          Add Event
        </Button>
        <ExcelExportButton
          columns={columns.filter((col: any) => col.key != 'action')} // remove action column
          fileName="Events"
          apiEndpoint="eventSelectExcel.php"
          apiMethod="POST"
          apiPayload={{
            searchTerm: searchText,
          }}
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

      {/* Total Count */}
      {/* <h4 className="font-semibold mt-4 text-left">Total Count: {totalCount}</h4> */}

      {/* Drawer Component */}
      <EventModel
        isOpen={isDrawerOpen}
        onSuccess={fetchProduct}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedProductId(null);
          setSelectedProductId("");
        }}
        productId={selectedProductId}
      />
    </div>
  );
};

export default EventManagement;
