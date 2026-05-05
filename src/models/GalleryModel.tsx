import React, { useEffect, useState } from "react";
import { Drawer, Input, Button, Form, notification, Upload, Modal, Select } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import apiRequest from "../Utils/api";
interface GalleryModelProps {
    isOpen: boolean;
    onSuccess: () => void;
    onClose: () => void;
    type?: any;
    productId?: any;
}

const GalleryModel: React.FC<GalleryModelProps> = ({
    isOpen,
    onSuccess,
    onClose,
    productId,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [drawerWidth, setDrawerWidth] = useState(window.innerWidth > 768 ? 600 : "100%");
    const [eventList, setEventList] = useState<any[]>([]);
    const [originalImage, setOriginalImage] = useState<any>(null);
    const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
    const [removedLinkIds, setRemovedLinkIds] = useState<string[]>([]);

    // preview modal state
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [previewTitle, setPreviewTitle] = useState("");
    const [selectedUploadType, setSelectedUploadType] = useState("");

    // Watch the selected event name
    const selectedEventId = Form.useWatch("eventId", form);
    const fileList = Form.useWatch("images", form);

    useEffect(() => {
        if (selectedEventId) {
            // Find the selected event from the list
            const selectedEvent = eventList && eventList.find((eve: any) => eve.id === selectedEventId);
            const selectedUploadType = selectedEvent?.uploadType ?? '';
            setSelectedUploadType(selectedUploadType);
        }
    }, [selectedEventId])

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
            setOriginalImage(null);
            setDeletedImageIds([]);
        }
    }, [productId]);

    useEffect(() => {
        fetchEventList();
    }, [])

    useEffect(() => {
        // Only reset when user actually changes the event (ignore initial load)
        if (selectedEventId && !productId) {
            // Reset image Upload
            setOriginalImage(null);
            setDeletedImageIds([]);

            // Reset YouTube links
            form.setFieldsValue({ links: [] });

            // Optional: reset other fields related to event
            form.setFieldsValue({ link: "" });
        }
    }, [selectedEventId, productId]);

    const fetchEventList = async () => {
        try {
            const response = await apiRequest("GET", "eventSelect.php");
            if (response.success && response.data) {
                const { data } = response;
                setEventList(data);
            }
        } catch (error) {
            console.error("Error during event fetch:", error);
        }
    };

    const fetchProductSingle = async (id: string) => {
        try {
            const response = await apiRequest("POST", "gallerySingleSelect.php", { id });

            if (response.success && response.data) {
                const product = response.data[0];
                form.setFieldsValue({
                    title: product.title,
                    eventId: product.eventId,
                    links: product.link,
                });
                console.log("api link_________", product.link);

                // Handle multiple images
                if (product.attachements && Array.isArray(product.attachements)) {
                    const imageArray = product.attachements.map((img: any, index: number) => {
                        const imageName = img.imageName ?? `image-${index + 1}.webp`;
                        return {
                            uid: String(index + 1),
                            name: imageName,
                            status: "done",
                            url: img.url,
                            type: "image/webp", // helps Upload recognize it
                            id: img.id,
                        };
                    });

                    setOriginalImage(imageArray);

                    // Also update the Form field so validator & Upload are in sync
                    form.setFieldsValue({ images: imageArray });
                }

            }
        } catch {
            notification.error({
                message: "An error occurred while fetching gallery details.",
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

            for (let file of values.images) {
                if (file.originFileObj) {
                    const base64 = await getBase64(file.originFileObj);
                    imagePayload.push({
                        imageData: base64,
                        imageName: file.name,
                        imageType: file.type.split("/")[1],
                        updateStatus: true,
                    });
                } else if (originalImage && originalImage.find((img: any) => img.uid === file.uid)) {
                    imagePayload.push({
                        imageData: "",
                        imageName: file.name,
                        imageType: file?.type?.split("/")[1] || "",
                        updateStatus: false,
                    });
                }
            }

            const payload = {
                id: selectedProductId ?? "",
                title: values.title,
                eventId: values.eventId,
                link: values.links,
                attachment: imagePayload,
                deleteId: deleteId,
                removedLinkIds: removedLinkIds,
            };

            const api = selectedProductId ? "galleryUpdate" : "galleryInsert";

            try {
                const response = await apiRequest("POST", `${api}.php`, payload);
                if (response.success) {
                    notification.success({ message: response?.message ?? "Success" });
                    form.resetFields();
                    setOriginalImage(null);
                    onClose();
                    setSelectedProductId("");
                    setDeletedImageIds([]);
                    setRemovedLinkIds([]);
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
                title={selectedProductId ? "Edit Gallery" : "Add Gallery"}
                placement="right"
                width={drawerWidth}
                onClose={() => {
                    onClose();
                    form.resetFields();
                    setOriginalImage(null);
                    setDeletedImageIds([]);
                    setSelectedProductId("");
                    setRemovedLinkIds([]);
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
                        label="Events"
                        name="eventId"
                        rules={[{ required: true, message: "Events is required" }]}
                    >
                        <Select placeholder="Select Event">
                            {eventList && eventList.map((eve: any) => (
                                <Select.Option key={eve.id} value={eve.id}>
                                    {eve.eventName}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Conditional Fields */}
                    {selectedUploadType === "Images" && (
                        <Form.Item
                            label="Images"
                            name="images"
                            required
                            valuePropName="fileList"
                            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                            rules={[
                                {
                                    validator: (_, value) => {
                                        if (value && value.length > 0) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error("At least one image is required"));
                                    },
                                },
                            ]}
                        >
                            <Upload
                                listType="picture-card"
                                fileList={fileList}
                                accept="image/*"
                                beforeUpload={() => false}
                                onPreview={handlePreview}
                                onChange={({ fileList }) => {
                                    if (originalImage) {
                                        const deleted = originalImage
                                            .filter((orig: any) => !fileList.find((f) => f.uid === orig.uid))
                                            .map((f: any) => f.id);
                                        setDeletedImageIds(deleted);
                                    }
                                    form.setFieldsValue({ images: fileList });
                                }}
                                multiple
                            >
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            </Upload>
                        </Form.Item>
                    )}

                    {selectedUploadType === "Youtube Video Link" && (
                        <Form.List name="links">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map((field) => (
                                        <div
                                            key={field.key}
                                            style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
                                        >
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "linkName"]}
                                                // fieldKey={[field.fieldKey, "linkName"]}
                                                noStyle
                                                rules={[
                                                    { required: true, message: "Link is required" },
                                                    {
                                                        validator: (_, value) => {
                                                            if (!value) return Promise.resolve(); // required rule handles empty
                                                            // Basic YouTube URL pattern check
                                                            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}$/;
                                                            return youtubeRegex.test(value)
                                                                ? Promise.resolve()
                                                                : Promise.reject(new Error("Enter a valid YouTube link"));
                                                        },
                                                    },
                                                ]}                                            >
                                                <Input placeholder="Enter Link" style={{ flex: 1 }} />
                                            </Form.Item>

                                            <MinusCircleOutlined
                                                onClick={() => {
                                                    const linkItem = form.getFieldValue("links")[field.name];
                                                    if (linkItem?.id) {
                                                        setRemovedLinkIds((prev) => [...prev, linkItem.id]);
                                                    }
                                                    remove(field.name);
                                                }}
                                                style={{ marginLeft: 8, color: "red", fontSize: 20, cursor: "pointer" }}
                                            />
                                        </div>
                                    ))}

                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <PlusOutlined
                                            onClick={() => add({ linkName: "" })}
                                            style={{ fontSize: 20, color: "#1890ff", cursor: "pointer" }}
                                        />
                                        <span style={{ marginLeft: 8 }}>Add Link</span>
                                    </div>
                                </>
                            )}
                        </Form.List>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={() => {
                                onClose();
                                form.resetFields();
                                setOriginalImage(null);
                                setDeletedImageIds([]);
                                setSelectedProductId("");
                                setRemovedLinkIds([]);
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

export default GalleryModel;
