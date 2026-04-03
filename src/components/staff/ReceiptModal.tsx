"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Printer, X, User } from "lucide-react";

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unit: string;
}

interface Transaction {
  id: string;
  totalAmount: number;
  items: CartItem[];
  createdAt: string;
  customerName?: string | null;
}

interface ReceiptModalProps {
  transaction: Transaction;
  onClose: () => void;
}

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(s: string) {
  return new Date(s).toLocaleString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [shopName, setShopName] = useState("มือสองของเก่า");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [receiptNote, setReceiptNote] = useState("ขอบคุณที่ใช้บริการ");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setShopName(d.name);
        if (d.address) setShopAddress(d.address);
        if (d.phone) setShopPhone(d.phone);
        if (d.receiptNote) setReceiptNote(d.receiptNote);
      });
  }, []);

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html lang="th"><head>
      <meta charset="UTF-8">
      <title>ใบรับซื้อ</title>
      <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;500&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Kanit',sans-serif;font-size:14px;color:#000;background:#fff}
        .wrap{max-width:300px;margin:0 auto;padding:20px 16px}
        .shop{font-size:18px;font-weight:500;text-align:center;margin-bottom:2px}
        .info{text-align:center;font-size:12px;color:#555;margin-bottom:2px}
        .dash{border-top:1px dashed #999;margin:10px 0}
        .title{text-align:center;font-size:13px;font-weight:500;margin-bottom:6px}
        .meta{font-size:12px;color:#555;margin-bottom:2px}
        table{width:100%;font-size:13px;border-collapse:collapse}
        th{text-align:left;border-bottom:1px solid #000;padding:4px 0;font-weight:500}
        td{padding:3px 0;vertical-align:top}
        td:last-child{text-align:right}
        .total td{font-weight:500;font-size:15px;border-top:1px solid #000;padding-top:8px}
        .note{text-align:center;font-size:12px;color:#666;margin-top:10px}
      </style>
    </head><body><div class="wrap">
      <div class="shop">${shopName}</div>
      ${shopAddress ? `<div class="info">${shopAddress}</div>` : ""}
      ${shopPhone ? `<div class="info">โทร: ${shopPhone}</div>` : ""}
      <div class="dash"></div>
      <div class="title">ใบรับซื้อของเก่า</div>
      ${transaction.customerName ? `<div class="meta" style="font-size:14px;color:#000;font-weight:500">ลูกค้า: ${transaction.customerName}</div>` : ""}
      <div class="meta">วันที่: ${formatDateTime(transaction.createdAt)}</div>
      <div class="meta">เลขที่: ${transaction.id.slice(-8).toUpperCase()}</div>
      <div class="dash"></div>
      <table>
        <thead><tr><th>รายการ</th><th style="text-align:center">จำนวน</th><th style="text-align:right">บาท</th></tr></thead>
        <tbody>
          ${transaction.items.map(i => `<tr>
            <td>${i.productName}</td>
            <td style="text-align:center">${i.quantity}${i.unit === "KG" ? "กก." : "ชิ้น"}</td>
            <td style="text-align:right">${formatMoney(i.subtotal)}</td>
          </tr>`).join("")}
          <tr class="total">
            <td colspan="2">รวมทั้งหมด</td>
            <td>${formatMoney(transaction.totalAmount)}</td>
          </tr>
        </tbody>
      </table>
      <div class="dash"></div>
      <div class="note">${receiptNote}</div>
    </div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-3">
      <div className="bg-white rounded-3xl w-full max-w-sm max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Success header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-t-3xl p-6 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-xl font-medium">บันทึกสำเร็จ!</h2>
          <p className="text-green-100 mt-1 text-3xl font-medium tabular-nums">
            ฿{formatMoney(transaction.totalAmount)}
          </p>
        </div>

        {/* Receipt preview */}
        <div ref={receiptRef} className="px-5 py-4">
          <div className="text-center mb-3">
            <p className="text-base font-medium text-gray-900">{shopName}</p>
            {shopAddress && <p className="text-gray-400 text-xs mt-0.5">{shopAddress}</p>}
            {shopPhone && <p className="text-gray-400 text-xs">โทร: {shopPhone}</p>}
          </div>

          <div className="border-t border-dashed border-gray-200 my-3" />

          <p className="text-center font-medium text-gray-700 text-sm mb-2">ใบรับซื้อของเก่า</p>
          {transaction.customerName && (
            <div className="flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <p className="text-gray-800 text-sm font-medium">{transaction.customerName}</p>
            </div>
          )}
          <p className="text-gray-400 text-xs">วันที่: {formatDateTime(transaction.createdAt)}</p>
          <p className="text-gray-400 text-xs mb-3">เลขที่: {transaction.id.slice(-8).toUpperCase()}</p>

          <div className="border-t border-dashed border-gray-200 my-3" />

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-1.5 text-gray-600 font-medium">รายการ</th>
                <th className="text-center py-1.5 text-gray-600 font-medium">จำนวน</th>
                <th className="text-right py-1.5 text-gray-600 font-medium">บาท</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-1.5 text-gray-700">{item.productName}</td>
                  <td className="text-center py-1.5 text-gray-500">
                    {item.quantity} {item.unit === "KG" ? "กก." : "ชิ้น"}
                  </td>
                  <td className="text-right py-1.5 font-medium text-gray-800">
                    {formatMoney(item.subtotal)}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="pt-3 font-medium text-gray-700">รวมทั้งหมด</td>
                <td className="pt-3 font-medium text-green-600 text-right text-base">
                  ฿{formatMoney(transaction.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-200 mt-3 pt-3 text-center text-gray-400 text-xs">
            {receiptNote}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 pt-1 space-y-2.5">
          <button
            onClick={handlePrint}
            className="btn-staff bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100"
            style={{ minHeight: 56 }}
          >
            <Printer className="w-5 h-5" />
            พิมพ์ใบเสร็จ
          </button>
          <button
            onClick={onClose}
            className="btn-staff bg-gray-100 hover:bg-gray-200 text-gray-600"
            style={{ minHeight: 52 }}
          >
            <X className="w-4 h-4" />
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
