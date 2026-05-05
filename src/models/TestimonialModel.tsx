import React, { useEffect, useState } from "react";
import { Drawer, Input, Button, Form, notification, Upload, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import apiRequest from "../Utils/api";

interface CompanyModelProps {
    isOpen: boolean;
    onSuccess: () => void;
    onClose: () => void;
    type?: any;
    productId?: any;
}

const TestimonialModel: React.FC<CompanyModelProps> = ({
    isOpen,
    onSuccess,
    onClose,
    productId,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [drawerWidth, setDrawerWidth] = useState(window.innerWidth > 768 ? 600 : "100%");
    const [fileList, setFileList] = useState<any[]>([]);
    const [originalImage, setOriginalImage] = useState<any>(null);
    const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

    // preview modal state
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [previewTitle, setPreviewTitle] = useState("");

    // Responsive drawer width
    useEffect(() => {
        const handleResize = () =>
            setDrawerWidth(window.innerWidth > 768 ? 600 : "100%");
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (productId) {
            setSelectedProductId(productId);
            fetchProductSingle(productId);
        } else {
            form.resetFields();
            setFileList([]);
            setOriginalImage(null);
            setDeletedImageIds([]);
        }
    }, [productId]);

    const fetchProductSingle = async (id: string) => {
        try {
            const response = await apiRequest("POST", "testimonialSingleSelect.php", { id });

            if (response.success && response.data) {
                const product = response.data[0];
                form.setFieldsValue({
                    title: product.title,
                    role: product.role,
                    description: product.description,
                });

                if (product.image) {
                    const imageObj = {
                        uid: "-1",
                        name: product.imageName ?? "image.png",
                        status: "done",
                        url: product.image,
                        id: product.id,
                    };
                    setFileList([imageObj]);
                    setOriginalImage(imageObj);
                }
            } else {
                notification.error({
                    message: response.error || "Failed to fetch company details.",
                });
            }
        } catch {
            notification.error({
                message: "An error occurred while fetching company details.",
            });
        }
    };

    const getBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const handlePreview = async (file: any) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewVisible(true);
        setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf("/") + 1));
    };

    const handleSave = () => {
        form.validateFields().then(async (values) => {
            setLoading(true);
            let imagePayload: any[] = [];
            let deleteId: string[] = [...deletedImageIds];

            if (fileList.length > 0) {
                const file = fileList[0];

                if (file.originFileObj) {
                    const base64 = await getBase64(file.originFileObj);
                    imagePayload.push({
                        imageData: base64,
                        imageName: file.name,
                        imageType: file.type.split("/")[1], // "image/png" -> "png"
                        updateStatus: true,
                    });
                } else if (originalImage && file.uid === originalImage.uid) {
                    imagePayload.push({
                        imageData: "",
                        imageName: originalImage.name,
                        imageType: originalImage?.type?.split("/")[1] || "",
                        updateStatus: false,
                    });
                }
            } else {
                // if (originalImage?.id) {
                //     deleteId.push(originalImage.id);
                // }
            }

            const payload = {
                id: selectedProductId ?? "",
                title: values.title,
                role: values.role,
                description: values.description,
                attachment: imagePayload,
                deleteId: deleteId,
            };

            const api = selectedProductId ? "testimonialUpdate" : "testimonialInsert";

            try {
                const response = await apiRequest("POST", `${api}.php`, payload);
                if (response.success) {
                    notification.success({ message: response?.message ?? "Success" });
                    form.resetFields();
                    setFileList([]);
                    setOriginalImage(null);
                    setDeletedImageIds([]);
                    onClose();
                    setSelectedProductId("");
                    onSuccess();
                } else {
                    notification.error({
                        message: response?.error ?? "Something went wrong, please try again later.",
                    });
                }
            } catch (error: any) {
                notification.error({
                    message: error?.response?.message ?? error?.message ?? "Something went wrong, please try again later.",
                });
            } finally {
                setLoading(false);
            }
        });
    };

    return (
        <>
            <Drawer
                title={selectedProductId ? "Edit Testimonials" : "Add Testimonials"}
                placement="right"
                width={drawerWidth}
                onClose={() => {
                    onClose();
                    form.resetFields();
                    setFileList([]);
                    setOriginalImage(null);
                    setDeletedImageIds([]);
                    setSelectedProductId("");
                }}
                open={isOpen}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Title"
                        name="title"
                        rules={[{ required: true, message: "Title is required" }]}
                    >
                        <Input minLength={2} maxLength={70} placeholder="Enter Title" />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                        rules={[{ required: true, message: "Description is required" }]}
                    >
                        <Input.TextArea rows={4} maxLength={200} placeholder="Enter Description" />
                    </Form.Item>

                    <Form.Item label="Role" name="role">
                        <Input minLength={2} maxLength={70} placeholder="Enter Role" />
                    </Form.Item>

                    <Form.Item label="Image">
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            accept="image/*"
                            beforeUpload={() => false}
                            onPreview={handlePreview}
                            onChange={({ fileList }) => {
                                if (originalImage && !fileList.find((f) => f.uid === originalImage.uid)) {
                                    if (originalImage.id) {
                                        setDeletedImageIds([originalImage.id]);
                                    }
                                }
                                setFileList(fileList);
                            }}
                            maxCount={1}
                        >
                            {fileList.length >= 1 ? null : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={() => {
                                onClose();
                                form.resetFields();
                                setFileList([]);
                                setOriginalImage(null);
                                setDeletedImageIds([]);
                                setSelectedProductId("");
                            }}
                            className="!rounded-lg"
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

            {/* Image Preview Modal */}
            <Modal
                open={previewVisible}
                title={previewTitle}
                footer={null}
                onCancel={() => setPreviewVisible(false)}
                zIndex={2000}
            >
                <img alt="preview" style={{ width: "100%" }} src={previewImage} />
            </Modal>
        </>
    );
};

export default TestimonialModel;
