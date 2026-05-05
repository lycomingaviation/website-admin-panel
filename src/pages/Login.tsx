import React, { useEffect, useState } from "react";
import { Button, Form, Input, notification, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import bgImage from "../assets/login_bg.png";
import SiteLogo from "../assets/dashboard.jpg";
import apiRequest from "../Utils/api";
import CryptoJS from "crypto-js";

const { Title } = Typography;

const Login: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/testimonials");
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values: any) => {
    setLoading(true);
    const payload = { email: values.phonenumber, password: values.password };

    try {
      const response = await apiRequest("POST", "login.php", payload);

      if (response.success && response.response) {
        // Store the auth_key in localStorage
        const { auth_key, user } = response.response;
        localStorage.setItem("authToken", auth_key);

        // Hash user details
        const hashedUser = CryptoJS.AES.encrypt(JSON.stringify(user), "your-secret-key").toString();
        localStorage.setItem("userDetails", hashedUser);

        notification.success({ message: response?.message ?? 'Success' });

        // Call login method
        login();
        navigate("/testimonials");
      } else {
        notification.error({
          message:
            response?.error ??
            'Something went wrong, please try again later.',
        });
        console.error("Login failed:", response.message);
      }
    } catch (error: any) {
      notification.error({
        message:
          error?.response?.message ??
          error?.response?.error ??
          error?.message ??
          error?.error ??
          'Something went wrong, please try again later.',
      });
      console.error("Error during login:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="flex flex-col justify-center w-full md:w-1/2 lg:w-1/3 bg-white p-8 shadow-lg min-h-screen">
        <img style={{height: "8rem", width: '9rem'}} src={SiteLogo} alt="siteicon" className="w-40 md:w-48 lg:w-64 mx-auto" />
        <Title level={3} className="text-center text-gray-800 mt-5">
          Login
        </Title>
        <Form layout="vertical" onFinish={onFinish} className="space-y-5">
          <Form.Item
            label="Phone Number"
            name="phonenumber"
            rules={[{ required: true, message: "Please enter your Phone Number" }]}
          >
            <Input
              placeholder="Phone Number"
              inputMode="numeric"
              maxLength={10}
              className="w-full p-2 border rounded"
            />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              placeholder="Password"
              minLength={8}
              className="w-full p-2 border rounded"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded btn-color !text-white !border-none !rounded-lg !w-full mt-4 justify-center items-center"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Form.Item>
        </Form>
      </div>
      <div className="hidden md:block md:w-1/2 lg:w-2/3 bg-black bg-opacity-20 flex justify-center items-center">
        <p className="text-white text-2xl font-semibold p-5">Welcome Back!</p>
      </div>
    </div>
  );
};

export default Login;
