import React, { useState } from "react";
import { Button, Spin } from "antd";
import { FileExcelOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import apiRequest from "../Utils/api"; // Make sure this path is correct

interface ExcelExportButtonProps {
    data?: any[]; // optional now if apiEndpoint is provided
    columns: { title: string; dataIndex: string }[];
    fileName?: string;
    buttonText?: string;
    apiEndpoint?: string; // new prop
    apiMethod?: "GET" | "POST"; // optional, defaults to POST
    apiPayload?: Record<string, any>; // optional payload for API
}

const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({
    data,
    columns,
    fileName = "Export",
    buttonText = "Export to Excel",
    apiEndpoint,
    apiMethod = "POST",
    apiPayload = {},
}) => {
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        if (!apiEndpoint) return data || [];
        setLoading(true);
        try {
            const response = await apiRequest(apiMethod, apiEndpoint, apiPayload);
            if (response.success && response.data) {
                return response.data;
            } else {
                console.error("Excel export fetch failed:", response.message);
                return [];
            }
        } catch (error) {
            console.error("Error fetching Excel data:", error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        const exportSource = await fetchData();
        if (!exportSource || exportSource.length === 0) {
            console.warn("No data to export");
            return;
        }

        // Prepare export data
        const exportData = exportSource.map((row: any, index: number) => {
            const formattedRow: any = {};
            columns.forEach((col) => {
                const cellValue = row[col.dataIndex];

                if (col.dataIndex === "sno") {
                    formattedRow[col.title] = index + 1;
                }
                else if (Array.isArray(cellValue)) {
                    // Convert array of objects or values into a multi-line string
                    formattedRow[col.title] = cellValue
                        .map((item: any, idx: number) => {
                            if (item && typeof item === "object") {
                                // Object: join key-value pairs
                                return `${idx + 1}. ${Object.values(item).filter(Boolean).join(" - ")}`;
                            } else {
                                // Primitive value
                                return `${idx + 1}. ${item}`;
                            }
                        })
                        .join("\n"); // new line for Excel
                }
                else {
                    formattedRow[col.title] = cellValue ?? "";
                }
            });
            return formattedRow;
        });

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });

        // Add header manually
        const headerRow = columns.map((col) => col.title);
        XLSX.utils.sheet_add_aoa(worksheet, [headerRow], { origin: "A1" });

        // Column widths
        worksheet["!cols"] = columns.map((col) =>
            col.dataIndex === "sno" ? { wch: 6 } : { wch: Math.max(col.title.length + 2, 20) }
        );

        // Style header cells
        columns.forEach((_, index) => {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = {
                    fill: { fgColor: { rgb: "FFD700" } },
                    font: { bold: true, color: { rgb: "000000" } },
                    alignment: { horizontal: "center", vertical: "center", wrapText: true },
                };
            }
        });

        // Wrap text for all data cells
        exportSource.forEach((_: any, rowIndex: any) => {
            columns.forEach((_, colIndex) => {
                const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].s = {
                        alignment: { wrapText: true, vertical: "top" },
                    };
                }
            });
        });

        // Create workbook & export
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array", cellStyles: true });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, `${fileName}.xlsx`);
    };

    return (
        <Button
            icon={<FileExcelOutlined />}
            onClick={handleExport}
            className="bg-green-500 text-white"
            disabled={loading}
        >
            {loading ? <Spin size="small" /> : buttonText}
        </Button>
    );
};

export default ExcelExportButton;
