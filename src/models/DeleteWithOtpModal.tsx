import React, { useState, useEffect } from "react";
import { Modal, Input, notification, Button } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import apiRequest from "../Utils/api";

interface DeleteWithOtpModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (id: string, otp: string) => Promise<void>;
  recordId: string;
  from: string;
  title?: string;
  description?: string;
}

const DeleteWithOtpModal: React.FC<DeleteWithOtpModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  recordId,
  from,
  title = "Delete Confirmation",
  description = "Are you sure you want to delete this item?",
}) => {
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"confirm" | "otp">("confirm");
  const [loading, setLoading] = useState(false);
  const [disableConfirm, setDisableConfirm] = useState(true);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [sendMail, setSendMail] = useState("");

  useEffect(() => {
    setDisableConfirm(otp.length < 4);
  }, [otp]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendDisabled && resendTimer > 0) {
      timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setResendDisabled(false);
      setResendTimer(30);
    }
    return () => clearTimeout(timer);
  }, [resendDisabled, resendTimer]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 characters
    if (/^\d*$/.test(value) && value.length <= 4) {
      setOtp(value);
    }
  };

  const handlesendOtp = async (): Promise<void> => {
    const api = from == "Invoice" ? "invoiceOtp.php" : "paymentOtp.php";
    const payload =
      from == "Invoice" ? { invoiceId: recordId } : { id: recordId };
    try {
      const response = await apiRequest("POST", `${api}`, payload);
      if (response.success) {
        setSendMail(response.email);
        notification.success({
          message: response.message || "OTP sent successfully",
        });
        setResendDisabled(true); // Disable resend button after sending
      } else {
        notification.error({
          message:
            response?.error ?? "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      notification.error({
        message: error instanceof Error ? error.message : "Failed to send OTP",
      });
    }
  };

  const handleResendOtp = async () => {
    if (resendDisabled) return;
    
    setResendDisabled(true);
    setResendTimer(30);
    await handlesendOtp();
  };

  const handleOk = async () => {
    if (step === "confirm") {
      setStep("otp");
      await handlesendOtp();
      return;
    }

    if (otp.length < 4) {
      notification.warning({ message: "Please enter a valid 4-digit OTP" });
      return;
    }

    setLoading(true);
    try {
      await onConfirm(recordId, otp);
      handleClose();
    } catch (error) {
      notification.error({ message: "Failed to delete" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOtp("");
    setStep("confirm");
    setDisableConfirm(true);
    setResendDisabled(false);
    setResendTimer(30);
    onCancel();
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={handleClose}
      centered
      confirmLoading={loading}
      okText={step === "confirm" ? "Send OTP" : "Confirm Delete"}
      okButtonProps={{
        danger: true,
        disabled: step === "otp" && disableConfirm,
      }}
      maskClosable={false}
    >
      {step === "confirm" ? (
        <div className="flex items-start gap-3">
          <ExclamationCircleOutlined className="text-red-500 text-lg mt-1" />
          <div>
            <p className="mb-0">{description}</p>
            <p className="text-gray-500 mt-2">
              This action requires OTP verification
            </p>
          </div>
        </div>
      ) : (
        <div>
          <p>Enter OTP sent to your registered email: {sendMail}</p>
          <Input.Password
            placeholder="Enter 4-digit OTP"
            value={otp}
            onChange={handleOtpChange}
            maxLength={4}
            className="mt-2"
            inputMode="numeric" // Shows numeric keyboard on mobile
            pattern="[0-9]*" // HTML5 pattern for numbers only
          />
          {otp.length > 0 && otp.length < 4 && (
            <p className="text-red-500 text-xs mt-1">OTP must be 4 digits</p>
          )}
          <div className="mt-2 text-right">
            <Button
              type="link"
              onClick={handleResendOtp}
              disabled={resendDisabled}
            >
              {resendDisabled ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DeleteWithOtpModal;