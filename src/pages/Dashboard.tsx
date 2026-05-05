import React, { useEffect, useState } from "react";
import { Card, Skeleton, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import {
  WalletOutlined,
  QuestionCircleOutlined,
  DollarOutlined,
  MoneyCollectOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { getUserDetails } from "../Utils/userUtils";
// import { capitalize } from "../Utils/Common";
import apiRequest from "../Utils/api";

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const userDetails = getUserDetails();
  const userName = userDetails?.name || "User";
  // const capitalizeName = capitalize(userName);

  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState({
    invoiceAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("GET", "dashBoard.php");
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        console.error("Failed to fetch dashboard data:", response.message);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getIconForTitle = (title: string) => {
    switch (title) {
      case "Invoice Amount":
        return (
          <DollarOutlined
            style={{ fontSize: "2rem", color: "var(--primary-color)" }}
          />
        );
      case "Paid Amount":
        return (
          <MoneyCollectOutlined
            style={{ fontSize: "2rem", color: "var(--primary-color)" }}
          />
        );
      case "Balance Amount":
        return (
          <WalletOutlined
            style={{ fontSize: "2rem", color: "var(--primary-color)" }}
          />
        );
      default:
        return (
          <QuestionCircleOutlined
            style={{ fontSize: "2rem", color: "#B0B0B0" }}
          />
        );
    }
  };

  const cardData = [
    {
      title: "Invoice Amount",
      value: `₹ ${dashboardData?.invoiceAmount}`,
      redirectPath: "/invoiceManagement",
    },
    {
      title: "Paid Amount",
      value: `₹ ${dashboardData?.paidAmount}`,
      redirectPath: "/invoiceManagement",
    },
    {
      title: "Balance Amount",
      value: `₹ ${dashboardData?.pendingAmount}`,
      redirectPath: "/invoiceManagement",
    },
  ];

  // Skeleton Card Component
  const SkeletonCard = () => (
    <Card className="shadow-lg rounded-xl bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="w-full">
          <Skeleton active paragraph={{ rows: 1 }} title={false} />
          <Skeleton active paragraph={{ rows: 1 }} title={false} />
        </div>
        <Skeleton.Avatar active size={48} shape="circle" className="ml-4" />
      </div>
    </Card>
  );

  return (
    <div className="p-0 md:pl-4 lg:pl-6 bg-white mx-auto">
      <motion.div className="mb-2 sm:mb-4">
        <Title
          level={2}
          className="text-2xl sm:text-3xl font-extrabold text-gray-800"
        >
          Welcome back{" "}
          <motion.span className="text-color b-600">
            {userName}!
          </motion.span>
        </Title>
        {/* <p className="text-base sm:text-lg text-gray-600 mt-2">
          Welcome back! Here's a quick overview of your activities today.
        </p> */}
      </motion.div>

      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <Title
          level={3}
          className="text-xl sm:text-2xl font-bold text-gray-700 mb-4 sm:mb-6"
        >
          Dashboard Overview
        </Title>
      </div>

      {loading ? (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(3)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SkeletonCard />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {cardData.map((card, index) => (
            <div key={index}>
              <Card
                className="shadow-lg rounded-xl  !rounded-[8px] flex items-center justify-between bg-gray-50 hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
                bodyStyle={{ padding: "12px" }}
                // onClick={() => navigate(card.redirectPath)}
                onClick={() =>
                  navigate(card.redirectPath, {
                    state: {
                      activeTab: card.title.includes("Invoice")
                        ? "invoice"
                        : card.title.includes("Balance")
                        ? "balance"
                        : "product",
                    },
                  })
                }
              >
                <div>
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-700">
                    {card.title}
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-color b-900">
                    {card.value}
                  </p>
                </div>
                <div className="ml-3 sm:ml-4">
                  {getIconForTitle(card.title)}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
