import React, { useEffect, useState } from "react";
import {
  Drawer,
  Input,
  Button,
  Form,
  DatePicker,
  Table,
  Select,
  notification,
  Row,
  Col,
  Space,
  Checkbox,
  InputNumber,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import moment from "moment";
import apiRequest from "../Utils/api";
import { getFinancialYear, uiApiDateFormat } from "../Utils/Common";
const { TextArea } = Input;
interface InvoiceModelProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  selectedId?: any;
  isConvert?: any;
}

const InvoiceModel: React.FC<InvoiceModelProps> = ({
  isOpen,
  onSuccess,
  onClose,
  selectedId,
}) => {
  const [form] = Form.useForm();
  const [rows, setRows] = useState<any[]>([
    { key: 1, description: null, fyear: "", period: "", lineTotal: "" },
  ]);
  const [subtotal, setSubtotal] = useState("");
  const [clientDropDown, setClientDropDown] = useState([]);
  const [descriptionDropDown, setDescriptionDropDown] = useState([]);
  const [selectId, setSelectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const advance = Form.useWatch("advance", form) || "0";
  const discount = Form.useWatch("discount", form) || "0";

  useEffect(() => {
    if (isOpen && !selectedId) {
      fetchNextId();
      fetchDescriptionDropDown();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedId) {
      setSelectId(selectedId);
      fetchSingleSelect(selectedId);
    } else {
      form.resetFields();
    }
  }, [selectedId]);

  const fetchSingleSelect = async (id: string) => {
    const api = "invoiceSingleSelect.php";
    const payload = { invoiceId: id };

    try {
      const response = await apiRequest("POST", `${api}`, payload);

      if (response?.success) {
        // Extract data from response
        const data = response || {};

        // Convert clientId to string if needed (since Select options use string values)
        const clientId = data.clientId?.toString();

        // Populate form fields
        form.setFieldsValue({
          createdDate: data.invoiceDate ? moment(data.invoiceDate, "YYYY-MM-DD") : null,
          name: clientId || "",
          phoneNumber: data.phoneNumber || "",
          address: data.address || "",
          gst: data.gst || "",
          invNo: data.invoiceNo || "",
          notes: data.notes || "",
          advance: data.advance != "0" ? data.advance : "",
          discount: data.discount != "0" ? data.discount : "",

          officeAddress: data.invoiceAddress || "",
        });

        // Populate rows for the table
        const lineItems = data.lineItems || [];
        const formattedRows = lineItems.map((item: any, index: number) => ({
          key: index + 1,
          description: item.description.toString() || "",
          period: item.period?.toString() || "",
          fyear: item.fYear?.toString() || "",
          lineTotal: parseFloat(item.lineTotal).toFixed(2) || "0.00",
        }));

        // Update rows and subtotal
        setRows(formattedRows);
        updateSubtotal(formattedRows);
      } else {
        notification.error({
          message: response?.error || "Failed to fetch invoice details",
        });
      }
    } catch (error: any) {
      notification.error({
        message:
          error?.error || "An error occurred while fetching invoice details",
      });
      console.error("Error fetching invoice details:", error);
    }
  };

  useEffect(() => {
    fetchClientDropDown();
    fetchDescriptionDropDown();
  }, []);

  const fetchClientDropDown = async () => {
    try {
      const response = await apiRequest("GET", "clientDropDown.php", {});
      if (response?.success && response?.data) {
        const formattedData = response.data.map((item: any) => ({
          value: item.id.toString(),
          label: item.name,
          phoneNumber: item.phoneNumber,
          email: item.email,
          gst: item.gst,
          pan: item.pan,
          address: item.address,
        }));

        setClientDropDown(formattedData);
      }
    } catch (error) {
      console.error("Error fetching client dropdown:", error);
    }
  };

  const fetchDescriptionDropDown = async () => {
    try {
      const response = await apiRequest("GET", "productDropDown.php", {});
      if (response?.success && response?.data) {
        const formattedData = response.data.map((item: any) => ({
          value: item.value.toString(),
          label: item.label,
        }));

        setDescriptionDropDown(formattedData);
      }
    } catch (error) {
      console.error("Error fetching client dropdown:", error);
    }
  };

  const handleClientSelect = (value: string) => {
    const selectedClient: any = clientDropDown.find(
      (client: any) => client.value === value
    );
    form.setFieldsValue({
      name: selectedClient.value,
      phoneNumber: selectedClient.phoneNumber,
      address: selectedClient.address,
      gst: selectedClient.gst,
    });
  };

  const fetchNextId = async () => {
    try {
      const api = "invoiceNextId.php";
      const response = await apiRequest("GET", api, {});

      if (response?.quoteNo || response?.invoiceId) {
        form.setFieldsValue({
          invNo: response?.quoteNo ?? response?.invoiceId,
        });
      }
    } catch (error) {
      console.error("Error fetching the next ID:", error);
    }
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        key: rows.length + 1,
        description: "",
        fyear: "",
        period: "",
        lineTotal: "",
      },
    ]);
  };

  const removeRow = (key: any) => {
    let updatedRows = rows.filter((row) => row.key !== key);

    // Regenerate keys to ensure uniqueness and sequential order
    updatedRows = updatedRows.map((row, index) => ({
      ...row,
      key: index + 1,
    }));

    setRows(updatedRows);
    updateSubtotal(updatedRows);
  };

  const handleChange = (value: string, key: number, field: string) => {
    const updatedRows = rows.map((row) => {
      if (row.key === key) {
        return { ...row, [field]: value };
      }
      return row;
    });

    setRows(updatedRows);
    updateSubtotal(updatedRows);
  };

  const updateSubtotal = (updatedRows: any[]) => {
    const total = updatedRows.reduce(
      (acc, row) => acc + parseFloat(row.lineTotal || "0"),
      0
    );
    const fixedTotal = total != "" ? Number(total).toFixed(2) : "0";
    setSubtotal(fixedTotal);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      setLoading(true);
      const hasEmptyProduct = rows.some((row) => !row.description);
      if (hasEmptyProduct) {
        notification.error({
          message: "Please enter all rows before submitting.",
        });
        setLoading(false);
        return;
      }
      // Constructing line items from rows
      const lineItems = rows.map((row) => ({
        description: row.description,
        period: row.period,
        fYear: row.fyear,
        lineTotal: row.lineTotal,
      }));

      const id = { invoiceId: selectId };

     await  updateSubtotal(lineItems);

      const api = selectId ? "invoiceUpdate.php" : "invoiceInsert.php";
      const amount = parseFloat(subtotal) - parseFloat(discount);
      
      // Constructing the payload
      const payload = {
        invoiceAddress: values.officeAddress,
        advance: values.advance,
        discount: values.discount,
        clientId: values.name,
        // totalAmount: parseFloat(subtotal) - parseFloat(advance),
        totalAmount: amount,
        notes: values.notes || "",
        lineItems,
        date: uiApiDateFormat(values.createdDate, "YYYY-MM-DD") || null,
        ...(selectId && { ...id }),
      };

      // Making the API request
      const response = await apiRequest("POST", `${api}`, payload);

      if (response?.success) {
        notification.success({ message: response?.message ?? "Success" });
        form.resetFields();
        setRows([
          { key: 1, description: "", fyear: "", period: "", lineTotal: "" },
        ]);
        setSubtotal("0.00");
        onClose();
        onSuccess();
        fetchNextId();
        setSelectId("");
      } else {
        notification.error({
          message:
            response?.error ?? "Something went wrong, please try again later.",
        });
        console.error(
          "Failed to save invoice:",
          response?.message || "Unknown error"
        );
      }
    } catch (error: any) {
      setLoading(false);
      notification.error({
        message:
          error?.response?.message ??
          error?.response?.error ??
          error?.message ??
          error?.error ??
          "Something went wrong, please try again later.",
      });
      console.error("Error while saving invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentFinancialYear = getFinancialYear(); // Actual year

  const columns = [
    {
      title: "S.No",
      dataIndex: "key",
      key: "key",
      width: 70,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 100,
      render: (_: any, record: any) => (
        <Select
          style={{ width: "100%" }}
          value={record?.description || null}
          onChange={(value) => handleChange(value, record.key, "description")}
          options={descriptionDropDown.map((product: any) => ({
            value: product?.value?.toString(),
            label: product.label,
          }))}
          placeholder="Select a description"
        />
      ),
    },

    {
      title: "F-Year",
      dataIndex: "fyear",
      key: "fyear",
      width: 120,
      render: (_: any, record: any) => {
        // Get the actual value or fallback to current financial year
        const value = record.fyear || currentFinancialYear;
        // Update the record if it's empty
        if (!record.fyear) {
          handleChange(currentFinancialYear, record.key, "fyear");
        }

        return (
          <Input
            required
            value={value}
            onChange={(e) => {
              handleChange(e.target.value, record.key, "fyear");
            }}
          />
        );
      },
    },
    {
      title: "Period",
      dataIndex: "period",
      key: "period",
      width: 120,
      render: (_: any, record: any) => (
        <Input
          required
          value={record.period}
          onChange={(e) => {
            const value = e.target.value;
            handleChange(value, record.key, "period");
          }}
        />
      ),
    },
    {
      title: "Line Total",
      dataIndex: "lineTotal",
      key: "lineTotal",
      width: 150,
      render: (_: any, record: any) => (
        <InputNumber
          // type="number"
          controls={false}
          required
          value={record.lineTotal}
          onChange={(e) => {
            const value = e;
            handleChange(value, record.key, "lineTotal");
          }}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: any) => (
        <DeleteOutlined
          style={{
            color: rows.length == 1 ? "gray" : "red",
            fontSize: "18px",
            cursor: rows.length == 1 ? "not-allowed" : "pointer",
            opacity: rows.length == 1 ? 0.5 : 1,
          }}
          onClick={() => {
            if (rows.length != 1) {
              removeRow(record.key);
            }
          }}
          disabled={rows.length == 1}
        />
      ),
    },
  ];

  const [drawerWidth, setDrawerWidth] = useState(
    window.innerWidth > 768 ? 900 : 380
  );

  useEffect(() => {
    const handleResize = () => {
      setDrawerWidth(window.innerWidth > 768 ? 900 : 380);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Drawer
      title={`${selectId ? "Edit" : "Add"} Invoice`}
      placement="right"
      width={drawerWidth}
      onClose={() => {
        onClose();
        form.resetFields();
        setRows([]);
        setSelectId("");
        onSuccess();
      }}
      open={isOpen}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ createdDate: moment() }}
        onFinish={handleFormSubmit}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Form.Item
              label="Invoice Date"
              name="createdDate"
              rules={[{ required: true, message: "Date is required" }]}
            >
              <DatePicker
                inputReadOnly={true}
                format="DD-MM-YYYY"
                className="w-full"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Form.Item
              label={`Invoice No`}
              name="invNo"
              rules={[{ required: true, message: `Invoice No is required` }]}
            >
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: "Name is required" }]}
            >
              <Select
                key={`client-select-${clientDropDown.length}`}
                className="w-full"
                placeholder="Select Name"
                onChange={(value) => handleClientSelect(value)}
                options={clientDropDown.map((client: any) => ({
                  value: client.value.toString(),
                  label: client.label,
                }))}
                showSearch
                filterOption={(input, option) =>
                  option?.label.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Form.Item
              label="Phone Number"
              name="phoneNumber"
              rules={[
                { required: true, message: "Phone Number is required" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Enter a valid 10-digit phone number",
                },
              ]}
            >
              <Input
                type="tel"
                placeholder="Enter phone number"
                maxLength={10}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Form.Item
              label="GSTIN"
              name="gst"
              // rules={[{ required: true, message: "GSTIN is required" }]}
            >
              <Input placeholder="Enter GSTIN" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Address"
          name="address"
          rules={[{ required: true, message: "Address is required" }]}
        >
          <TextArea rows={3} placeholder="Enter address" />
        </Form.Item>

        <Form.Item label="Advance" name="advance">
          <Input inputMode="numeric" placeholder="Enter advance" />
        </Form.Item>

        <Form.Item label="Discount" name="discount">
          <Input inputMode="numeric" placeholder="Enter discount" />
        </Form.Item>
        {/* 
        <Form.Item label="Notes" name="notes">
          <TextArea rows={3} placeholder="Enter notes (optional)" />
        </Form.Item> */}

        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          scroll={{ x: 800 }}
          tableLayout="auto"
        />

        <div className="flex justify-between gap-2 sm:mt-4">
          <Button
            type="primary"
            onClick={addRow}
            icon={<PlusOutlined />}
            className="bg-red-500 !flex items-center gap-2 btn-color !border-none !rounded-lg"
          >
            Add Row
          </Button>
          <div className="flex flex-col text-right gap-2">
            {subtotal && (
              <div className="flex justify-start gap-3">
                <span className="font-semibold">Sub Total</span>
                <span className="font-semibold text-left">: ₹ {subtotal}</span>
              </div>
            )}

            {discount != 0 ? (
              <>
                <div className="flex justify-start gap-4">
                  <span className="font-semibold">Discount</span>
                  <span className="font-semibold text-left">
                    : ₹ {discount ? Number(discount).toFixed(2) : 0}
                  </span>
                </div>
              </>
            ) : null}
            {advance != 0 ? (
              <>
                <div className="flex justify-start gap-4">
                  <span className="font-semibold">Advance</span>
                  <span className="font-semibold text-left">
                    : ₹ {advance ? Number(advance).toFixed(2) : 0}
                  </span>
                </div>
              </>
            ) : null}

            <div className="flex justify-start gap-9">
              <span className="font-semibold">Total</span>
              <span
                className="font-semibold"
                style={{ margin: "0px 14px 0px 0px" }}
              >
                :{" ₹ "}
                {(
                  Number(subtotal) -
                  Number(advance) -
                  Number(discount)
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Form.Item label="Address:" name="officeAddress">
            <Checkbox.Group>
              <Space>
                <Checkbox value="1">Sivanandha Colony</Checkbox>
                <Checkbox value="2">Edayarpalayam</Checkbox>
                <Checkbox value="3">Puliyampatti</Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button onClick={onClose} className="!rounded-lg">
            Cancel
          </Button>
          <Button
            loading={loading}
            disabled={loading}
            type="primary"
            htmlType="submit"
            className="btn-color !border-none !rounded-lg"
          >
            {selectId ? "Update" : "Save"}
          </Button>
        </div>
      </Form>
    </Drawer>
  );
};

export default InvoiceModel;
