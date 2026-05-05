import React, { useEffect, useState } from "react";
import { Drawer, Button, notification, Typography, Space } from "antd";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import apiRequest from "../Utils/api"; // Ensure this path is correct
import logo from "../assets/invoicelogo.png"; // Ensure this path is correct
import sign from "../assets/sign.jpg";
import scan from "../assets/scan.jpg"; // Ensure this path is correct
// Ensure this path is correct

const { Title } = Typography;

interface QuotationViewModelProps {
  isOpen: boolean;
  onClose: () => void;
  quotationId: any;
}

const InvoiceViewModel: React.FC<QuotationViewModelProps> = ({
  isOpen,
  onClose,
  quotationId,
}) => {
  const [quotationData, setQuotationData] = useState<any>({});
  const [drawerWidth, setDrawerWidth] = useState(
    window.innerWidth > 768 ? 800 : "100%"
  );
  const [loading, setLoading] = useState(false);

  // Fetch quotation or invoice data
  useEffect(() => {
    if (quotationId) {
      fetchProductSingle(quotationId);
    }
  }, [quotationId]);

  const fetchProductSingle = async (id: string) => {
    const api = "invoiceSingleSelect.php";
    const payload = { invoiceId: id };

    try {
      const response = await apiRequest("POST", api, payload);
      if (response.success) {
        setQuotationData(response);
      } else {
        notification.error({
          message: response.error || `Failed to fetch invoice details.`,
        });
      }
    } catch (error: any) {
      notification.error({
        message: error?.message || `Error fetching invoice details`,
      });
      console.error(`Error fetching invoice details:`, error);
    }
  };

  // Download as PDF
  const downloadPDF = async () => {
    setLoading(true);
    const input = document.querySelector(".pdf-hidden-section") as HTMLElement;

    if (!input) {
      console.error("Required element not found");
      return;
    }

    // Wait for the DOM to update
    setTimeout(async () => {
      const contentCanvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // Margin for better readability
      const availableHeight = pdfHeight - 2 * margin; // Space available per page

      let yOffset = 0;

      while (yOffset < contentCanvas.height) {
        // Create a canvas for the current page content
        const croppedCanvas = document.createElement("canvas");
        const ctx = croppedCanvas.getContext("2d")!;
        croppedCanvas.width = contentCanvas.width;
        croppedCanvas.height = Math.min(
          contentCanvas.height - yOffset,
          (availableHeight / pdfWidth) * contentCanvas.width
        );

        // Draw the visible portion of the content
        ctx.drawImage(
          contentCanvas,
          0,
          yOffset,
          contentCanvas.width,
          croppedCanvas.height,
          0,
          0,
          contentCanvas.width,
          croppedCanvas.height
        );

        // Add content to the PDF
        pdf.addImage(
          croppedCanvas.toDataURL("image/png"),
          "PNG",
          0,
          margin,
          pdfWidth,
          (croppedCanvas.height / croppedCanvas.width) * pdfWidth
        );

        // Update yOffset for the next page
        yOffset += croppedCanvas.height;

        // If there's more content, add a new page
        if (yOffset < contentCanvas.height) {
          pdf.addPage();
        }
      }

      // Save the PDF
      pdf.save(`${quotationData?.invoiceNo}.pdf`);
      setLoading(false);
    }, 200);
  };

  // Responsive drawer width
  useEffect(() => {
    const handleResize = () =>
      setDrawerWidth(window.innerWidth > 768 ? 800 : "100%");
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const subTotalAmount = quotationData?.lineItems?.reduce(
    (acc: any, row: any) => acc + parseFloat(row.lineTotal || "0"),
    0
  );

  // Calculate Total: (Subtotal - Discount) + Advance
  // const subTotalAmount = parseFloat(quotationData?.overallTotal || 0).toFixed(
  //   2
  // );

  const advance: any = quotationData?.advance
    ? parseFloat(quotationData?.advance || 0).toFixed(2)
    : 0;
  const discount: any = quotationData?.discount
    ? parseFloat(quotationData?.discount || 0).toFixed(2)
    : 0;
  const total = (
    Number(subTotalAmount) -
    Number(advance) -
    Number(discount)
  ).toFixed(2);

  return (
    <>
      {/* Visible Drawer */}
      <Drawer
        title={
          <Space className="flex justify-between w-full">
            <Title level={5} style={{ margin: 0 }}>
              Invoice Preview
            </Title>
            <Button
              type="primary"
              className="bg-blue-600 hover:bg-blue-700 !flex items-center gap-2 !border-none !rounded-md btn-color"
              onClick={downloadPDF}
              disabled={loading}
              loading={loading}
            >
              {loading ? "Downloading PDF..." : "Download PDF"}
            </Button>
          </Space>
        }
        placement="right"
        width={drawerWidth}
        onClose={onClose}
        open={isOpen}
        bodyStyle={{ padding: 0 }}
      >
        <div className="invoice-container px-6 bg-white min-h-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-center mb-2">
            <img src={logo} alt="Logo" className="h-[11rem] w-auto" />
            {/* <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full my-2"></div> */}
          </div>

          {/* Billed To Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className=" rounded-lg">
              <h2 className="font-bold text-gray-700 mb-2">Billed To:</h2>
              <p className="text-gray-800 font-medium">{quotationData?.name}</p>
              <p className="text-gray-600">{quotationData?.address}</p>
              <div>
                <span className="font-bold text-gray-700">GSTN: </span>
                <span className="text-gray-800">{quotationData?.gst}</span>
              </div>
            </div>

            <div className=" text-right ">
              <div className="flex flex-col space-y-2">
                <div>
                  <span className="font-bold text-gray-700">Invoice No: </span>
                  <span className="text-gray-800">
                    {quotationData?.invoiceNo}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-gray-700">
                    Invoice Date:{" "}
                  </span>
                  <span className="text-gray-800">{quotationData?.date}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-2 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">
                    S.No
                  </th>
                  <th className="min-w-[200px] py-3 px-4 text-left font-semibold text-gray-700 border-b">
                    Description
                  </th>
                  <th className="min-w-[100px] py-3 px-4 text-left font-semibold text-gray-700 border-b">
                    F-Year
                  </th>
                  <th className="min-w-[50] py-3 px-4 text-left font-semibold text-gray-700 border-b">
                    Period
                  </th>
                  <th className="min-w-[100px] py-3 px-4 text-right font-semibold text-gray-700 border-b">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {(
                  quotationData?.lineItems || [
                    {
                      productName: "GST Filling Charges",
                      period: "Feb-25",
                      lineTotal: "1,000.00",
                    },
                  ]
                ).map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b text-gray-700">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 border-b text-gray-700">
                      {item.productName}
                    </td>
                    <td className="py-3 px-4 border-b text-gray-700">
                      {item.fYear}
                    </td>
                    <td className="py-3 px-4 border-b text-gray-700">
                      {item.period}
                    </td>
                    <td className="py-3 px-4 border-b text-gray-700 text-right">
                      ₹ {item.lineTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-2">
            <div className="w-full md:w-1/3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Subtotal</span>
                  <span className="text-gray-800">
                    ₹ {Number(subTotalAmount).toFixed(2)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold text-gray-700">
                      Discount
                    </span>
                    <span className="text-gray-800">₹ {discount}</span>
                  </div>
                )}
                {advance > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold text-gray-700">Advance</span>
                    <span className="text-gray-800">₹ {advance}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-bold text-[rgb(70,97,50)]">
                    ₹ {total}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Authorized Signatory */}
          <div className="flex justify-end mb-2">
            <div className="text-right">
              <div className="mt-2 pt-1 border-t-2 border-gray-300 w-48 inline-block">
                <img src={sign} alt="Logo" className="h-[4rem] w-auto ml-5" />
                <p className="font-semibold text-gray-700">
                  Authorised Signatory
                </p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="mb-2 p-2 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[rgb(70,97,50)] mb-3">
                  Bank Details
                </h3>
                <p className="text-gray-700">
                  <span className="font-semibold">Name:</span> S Praveen Kumar
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Bank Name:</span> Karur Vysaya
                  Bank
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Account No:</span>{" "}
                  1620178000010316
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">IFSC Code:</span> KVBL0001620
                </p>
                <p className="text-gray-700 mt-2">
                  <span className="font-semibold">G-Pay No:</span> 83445 05067
                </p>
              </div>
              <div className="flex justify-center md:justify-end mb-2">
                <img src={scan} alt="Logo" className="h-[18rem] w-auto" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-lg font-medium text-gray-800 mb-3">
              Thank you for your business!
            </p>
            <p className="text-gray-600 mb-4">
              Contact No: 63808 07052 | Mail ID: sriselvamandco@gmail.com
            </p>

            <div className="text-sm text-gray-500 space-y-1">
              {quotationData?.invoiceAddress?.includes("1") && (
                <p>
                  Sri Lakshmi Narayana Building | No.4,Tatabad, 2nd Street,
                  Sivanandha Colony | Coimbatore,TN | 641 012
                </p>
              )}
              {quotationData?.invoiceAddress?.includes("2") && (
                <p>
                  House of Grace | 81,Auto Nagar,2nd Street, [Vadavalli Rd]
                  Edayarpalayam | Coimbatore,TN | 641 025
                </p>
              )}
              {quotationData?.invoiceAddress?.includes("3") && (
                <p>
                  154/1, Sengaliappa Complex | Ganeshpuram [Bhavanisagar Rd]
                  Puliyampatti, Erode, TN | 638 459
                </p>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Hidden Div for PDF Generation */}
      <div
        className="pdf-hidden-section watermark"
        style={{
          position: "absolute",
          top: "-10000px",
          left: "-10000px",
          width: "800px",
          paddingLeft: "24px",
          paddingRight: "24px",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Header */}
        <div className="flex justify-center !mb-0 !mt-0">
          <img src={logo} alt="Logo" className="h-[7rem] w-auto" />
        </div>

        {/* Billed To Section */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 "> */}
        <div className="grid grid-cols-2 gap-6">
          <div className=" rounded-lg mb-3">
            <h2 className="font-bold text-gray-700 !mb-0 ">Billed To:</h2>
            <p className="text-gray-800 font-medium !mb-0">
              {quotationData?.name}
            </p>
            <p className="text-gray-600 !mb-0">{quotationData?.address}</p>
            <span className="font-bold text-gray-700">GSTN: </span>
            <span className="text-gray-800">{quotationData?.gst}</span>
          </div>

          <div className=" text-right ">
            <div className="flex flex-col space-y-2">
              <div>
                <span className="font-bold text-gray-700">Invoice No: </span>
                <span className="text-gray-800">
                  {quotationData?.invoiceNo}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-700">Invoice Date: </span>
                <span className="text-gray-800">{quotationData?.date}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">
                  S.No
                </th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">
                  Description
                </th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">
                  F-Year
                </th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b">
                  Period
                </th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700 border-b">
                  Line Total
                </th>
              </tr>
            </thead>
            <tbody>
              {(
                quotationData?.lineItems || [
                  {
                    productName: "GST Filling Charges",
                    period: "Feb-25",
                    lineTotal: "1,000.00",
                  },
                ]
              ).map((item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-4 !mb-0 !mt-0 !pt-0 !!pb-2 border-b text-gray-700">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 border-b text-gray-700 !mt-0 !pt-0 !!pb-2 border ">
                    {item.productName}
                  </td>
                  <td className="py-3 px-4 border-b text-gray-700 !mt-0 !pt-0 !!pb-2 border">
                    {item.fYear}
                  </td>
                  <td className="py-3 px-4 border-b text-gray-700 !mt-0 !pt-0 !!pb-2 border">
                    {item.period}
                  </td>
                  <td className="py-3 px-4 border-b text-gray-700 text-right !mt-0 !pt-0 !!pb-2 border">
                    ₹ {item.lineTotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end ">
          <div className="w-1/3 md:w-1/3">
            <div className="bg-gray-50 rounded-lg pr-4">
              <div className="flex justify-between py-2 border-b">
                <span className="font-semibold text-gray-700">Subtotal</span>
                <span className="text-gray-800">
                  ₹ {Number(subTotalAmount).toFixed(2)}{" "}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Discount</span>
                  <span className="text-gray-800">₹ {discount}</span>
                </div>
              )}
              {advance > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold text-gray-700">Advance</span>
                  <span className="text-gray-800">₹ {advance}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-[rgb(70,97,50)]">
                  ₹ {total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Authorized Signatory */}
        <div className="flex justify-end mt-2">
          <div className="text-right">
            <div className=" border-t-2 border-gray-300 w-48 inline-block">
              <img src={sign} alt="Logo" className="h-[4rem] w-auto ml-5" />
              <p className="font-semibold text-gray-700">
                Authorised Signatory
              </p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div>
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 "> */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-[rgb(70,97,50)] mb-3">
                Bank Details
              </h3>
              <p className="text-gray-700">
                <span className="font-semibold">Name:</span> S Praveen Kumar
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Bank Name:</span> Karur Vysaya
                Bank
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Account No:</span>{" "}
                1620178000010316
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">IFSC Code:</span> KVBL0001620
              </p>
              <p className="text-gray-700 mt-2">
                <span className="font-semibold">G-Pay No:</span> 83445 05067
              </p>
            </div>
            <div className="flex justify-end">
              <img src={scan} alt="Logo" className="h-[12rem] w-auto" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center  bg-gray-50 rounded-lg p-1 m-0">
          <p className="text-lg font-medium text-gray-800 mb-3">
            Thank you for your business!
          </p>
          <p className="text-gray-600 mb-4">
            Contact No: 63808 07052 | Mail ID: sriselvamandco@gmail.com
          </p>

          <div className="text-sm text-gray-500 space-y-1">
            {quotationData?.invoiceAddress?.includes("1") && (
              <p>
                Sri Lakshmi Narayana Building | No.4,Tatabad, 2nd Street,
                Sivanandha Colony | Coimbatore,TN | 641 012
              </p>
            )}
            {quotationData?.invoiceAddress?.includes("2") && (
              <p>
                House of Grace | 81,Auto Nagar,2nd Street, [Vadavalli Rd]
                Edayarpalayam | Coimbatore,TN | 641 025
              </p>
            )}
            {quotationData?.invoiceAddress?.includes("3") && (
              <p>
                154/1, Sengaliappa Complex | Ganeshpuram [Bhavanisagar Rd]
                Puliyampatti, Erode, TN | 638 459
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceViewModel;
