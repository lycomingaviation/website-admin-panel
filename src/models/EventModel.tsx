import React, { useEffect, useState } from "react";
import { Drawer, Input, Button, Form, notification, Select } from "antd";
import apiRequest from "../Utils/api";
import { minMaxLengthRule } from "../Utils/Common";

interface EventModelProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  productId?: any;
}

const EventModel: React.FC<EventModelProps> = ({
  isOpen,
  onSuccess,
  onClose,
  productId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (productId) {
      setSelectedProductId(productId);
      fetchProductSingle(productId);
    } else {
      form.resetFields();
    }
  }, [productId]);

  const fetchProductSingle = async (id: string) => {
    const payload = { id };

    try {
      const response = await apiRequest(
        "POST",
        "eventSingleSelect.php",
        payload
      );

      if (response.success && response.data) {
        const product = response.data[0]; // Assuming the API response structure
        form.setFieldsValue({
          ...product
        });
      } else {
        notification.error({
          message: response.error || "Failed to fetch description details.",
        });
      }
    } catch (error) {
      notification.error({
        message: "An error occurred while fetching description details.",
      });
    }
  };

  const handleSave = () => {
    form
      .validateFields()
      .then(async (values) => {
        setLoading(true);
        const payload = {
          ...(selectedProductId && { id: selectedProductId }),
          eventName: values.eventName,
          uploadType: values.uploadType,
        };
        const api = selectedProductId ? "eventUpdate" : "eventInsert";
        try {
          const response = await apiRequest("POST", `${api}.php`, payload);
          if (response.success) {
            notification.success({ message: response?.message ?? "Success" });
            form.resetFields();
            onClose();
            setSelectedProductId("");
            onSuccess();
          } else {
            notification.error({
              message:
                response?.error ??
                "Something went wrong, please try again later.",
            });
            console.error("Login failed:", response.message);
          }
        } catch (error: any) {
          console.error("Error during login:", error);
          notification.error({
            message:
              error?.response?.message ??
              error?.response?.error ??
              error?.message ??
              error?.error ??
              "Something went wrong, please try again later.",
          });
          setLoading(false);
        } finally {
          setLoading(false);
        }
      })
      .catch((errorInfo) => {
        console.log("Validation Failed:", errorInfo);
      });
  };

  return (
    <Drawer
      title={selectedProductId ? "Edit Event" : "Add Event"}
      placement="right"
      onClose={() => {
        onClose();
        form.resetFields();
        setSelectedProductId("");
      }}
      open={isOpen}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Event Name"
          name="eventName"
          rules={[
            { required: true, message: "Event is required" },
            minMaxLengthRule(3, 70),
          ]}
        >
          <Input
            minLength={2}
            maxLength={200}
            placeholder="Enter Event Name"
          />
        </Form.Item>

        <Form.Item
          label="Upload Type"
          name="uploadType"
          rules={[{ required: true, message: "Upload Type is required" }]}
        >
          <Select placeholder="Select Upload Type">
            <Select.Option value="Images">Images</Select.Option>
            <Select.Option value="Youtube Video Link">Youtube Video Link</Select.Option>
          </Select>
        </Form.Item>

        <div className="flex justify-end gap-2">
          <Button
            onClick={() => {
              onClose();
              form.resetFields();
              setSelectedProductId("");
            }}
            className=" !rounded-lg"
          >
            Cancel
          </Button>
          <Button
            loading={loading}
            disabled={loading}
            type="primary"
            className="btn-color !border-none !rounded-lg"
            onClick={handleSave}
          >
            {selectedProductId ? "Update" : "Save"}
          </Button>
        </div>
      </Form>
    </Drawer>
  );
};

export default EventModel;
