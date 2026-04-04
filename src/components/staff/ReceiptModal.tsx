"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, X, User, Share2, ImageIcon, Printer } from "lucide-react";

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
  const receiptImageRef = useRef<HTMLDivElement>(null);
  const [shopName, setShopName] = useState("มือสองของเก่า");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [receiptNote, setReceiptNote] = useState("ขอบคุณที่ใช้บริการ");
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);

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

  // Shared: generate canvas from hidden receipt div
  const generateCanvas = async () => {
    if (!receiptImageRef.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(receiptImageRef.current, {
      scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false,
    });
  };

  // ── ส่ง LINE: native share sheet ──────────────────────────────
  const handleShare = async () => {
    setSharing(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;
      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
      const file = new File([blob], `ใบเสร็จ_${transaction.id.slice(-8).toUpperCase()}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "ใบรับซื้อของเก่า" });
      } else {
        // fallback: show inline image to long-press save
        setSavedImageUrl(canvas.toDataURL("image/png"));
      }
    } catch (e) { console.error(e); }
    finally { setSharing(false); }
  };

  // ── บันทึกรูปลงเครื่อง: show inline → long-press to save ─────
  const handleSaveImage = async () => {
    setSaving(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      // Try 1: native share (iOS/Android modern — most reliable way to save to gallery)
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `ใบเสร็จ_${transaction.id.slice(-8).toUpperCase()}.png`, { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "ใบรับซื้อของเก่า" });
          return;
        }
      } catch {}
      // Try 2: download link (Android Chrome / desktop)
      try {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `ใบเสร็จ_${transaction.id.slice(-8).toUpperCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      } catch {}
      // Fallback: show inline image — กดค้างเพื่อบันทึก (works universally on mobile)
      setSavedImageUrl(dataUrl);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // ── พิมพ์ใบเสร็จ: hidden iframe — ไม่เปิด tab ใหม่ ──────────
  const handlePrint = () => {
    const printHTML = `<!DOCTYPE html><html lang="th"><head>
      <meta charset="UTF-8"><title>ใบรับซื้อ</title>
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
        td{padding:3px 0;vertical-align:top}td:last-child{text-align:right}
        .total td{font-weight:500;font-size:15px;border-top:1px solid #000;padding-top:8px}
        .note{text-align:center;font-size:12px;color:#666;margin-top:10px}
      </style></head><body><div class="wrap">
      <div class="shop">${shopName}</div>
      ${shopAddress ? `<div class="info">${shopAddress}</div>` : ""}
      ${shopPhone ? `<div class="info">โทร: ${shopPhone}</div>` : ""}
      <div class="dash"></div><div class="title">ใบรับซื้อของเก่า</div>
      ${transaction.customerName ? `<div class="meta" style="font-size:14px;color:#000;font-weight:500">ลูกค้า: ${transaction.customerName}</div>` : ""}
      <div class="meta">วันที่: ${formatDateTime(transaction.createdAt)}</div>
      <div class="meta">เลขที่: ${transaction.id.slice(-8).toUpperCase()}</div>
      <div class="dash"></div>
      <table><thead><tr><th>รายการ</th><th style="text-align:center">จำนวน</th><th style="text-align:right">บาท</th></tr></thead>
      <tbody>${transaction.items.map(i => `<tr>
        <td>${i.productName}</td>
        <td style="text-align:center">${i.quantity}${i.unit === "KG" ? "กก." : "ชิ้น"}</td>
        <td style="text-align:right">${formatMoney(i.subtotal)}</td>
      </tr>`).join("")}
      <tr class="total"><td colspan="2">รวมทั้งหมด</td><td>${formatMoney(transaction.totalAmount)}</td></tr>
      </tbody></table>
      <div class="dash"></div><div class="note">${receiptNote}</div>
    </div></body></html>`;

    // inject into hidden iframe — print dialog appears over current page, no new tab
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) { iframe.remove(); return; }
    doc.open(); doc.write(printHTML); doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 3000);
    }, 500);
  };

  return (
    <>
    {/* Hidden receipt for image capture */}
    <div style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1 }}>
      <div ref={receiptImageRef} style={{
        width: 360, background: "#fff", padding: "32px 28px",
        fontFamily: "'Kanit', 'Sarabun', sans-serif", color: "#111",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{shopName}</div>
          {shopAddress && <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{shopAddress}</div>}
          {shopPhone && <div style={{ fontSize: 12, color: "#666" }}>โทร: {shopPhone}</div>}
        </div>
        <div style={{ borderTop: "1px dashed #bbb", margin: "10px 0" }} />
        <div style={{ textAlign: "center", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>ใบรับซื้อของเก่า</div>
        {transaction.customerName && (
          <div style={{ fontSize: 13, marginBottom: 2 }}>ลูกค้า: <strong>{transaction.customerName}</strong></div>
        )}
        <div style={{ fontSize: 12, color: "#555" }}>วันที่: {formatDateTime(transaction.createdAt)}</div>
        <div style={{ fontSize: 12, color: "#555", marginBottom: 10 }}>เลขที่: {transaction.id.slice(-8).toUpperCase()}</div>
        <div style={{ borderTop: "1px dashed #bbb", margin: "10px 0" }} />
        {/* Table */}
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #222" }}>
              <th style={{ textAlign: "left", padding: "4px 0", fontWeight: 500 }}>รายการ</th>
              <th style={{ textAlign: "center", padding: "4px 0", fontWeight: 500 }}>จำนวน</th>
              <th style={{ textAlign: "right", padding: "4px 0", fontWeight: 500 }}>บาท</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "5px 0", color: "#222" }}>{item.productName}</td>
                <td style={{ textAlign: "center", padding: "5px 0", color: "#555" }}>
                  {item.quantity}{item.unit === "KG" ? "กก." : "ชิ้น"}
                </td>
                <td style={{ textAlign: "right", padding: "5px 0", fontWeight: 500 }}>
                  {formatMoney(item.subtotal)}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} style={{ paddingTop: 10, fontWeight: 600, fontSize: 15 }}>รวมทั้งหมด</td>
              <td style={{ paddingTop: 10, fontWeight: 700, fontSize: 16, color: "#16a34a", textAlign: "right" }}>
                ฿{formatMoney(transaction.totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ borderTop: "1px dashed #bbb", margin: "12px 0" }} />
        <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>{receiptNote}</div>
        {/* Footer watermark */}
        <div style={{ textAlign: "center", fontSize: 10, color: "#ccc", marginTop: 16 }}>
          มือสองของเก่า · ระบบรับซื้อของเก่า
        </div>
      </div>
    </div>

    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-3">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col" style={{ maxHeight: "92vh" }}>
        {/* Success header (fixed) */}
        <div className="rounded-t-3xl p-6 text-center text-white shrink-0" style={{ background: "linear-gradient(135deg, #22c55e 0%, #10b981 50%, #0ea5e9 100%)" }}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-xl font-medium">บันทึกสำเร็จ!</h2>
          <p className="text-white/80 mt-1 text-3xl font-medium tabular-nums">
            ฿{formatMoney(transaction.totalAmount)}
          </p>
        </div>

        {/* Receipt preview (scrollable) */}
        <div ref={receiptRef} className="px-5 py-4 flex-1 overflow-y-auto">
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

          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">รายการสินค้า</p>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {transaction.items.length} รายการ
            </span>
          </div>
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
                <td className="pt-3 font-medium text-emerald-600 text-right text-base">
                  ฿{formatMoney(transaction.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-200 mt-3 pt-3 text-center text-gray-400 text-xs">
            {receiptNote}
          </div>
        </div>

        {/* Actions (fixed at bottom) */}
        <div className="px-5 pb-6 pt-3 space-y-2.5 shrink-0 border-t border-gray-100">

          {/* 1. ส่ง LINE */}
          <button onClick={handleShare} disabled={sharing}
            className="btn-staff disabled:opacity-60 text-white shadow-lg"
            style={{ minHeight: 60, background: "linear-gradient(135deg, #06c755, #06b048)", boxShadow: "0 8px 24px rgba(6,199,85,0.4)" }}>
            {sharing
              ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <ImageIcon className="w-5 h-5" />}
            {sharing ? "กำลังสร้างรูปภาพ..." : "ส่งใบเสร็จทาง LINE"}
          </button>

          {/* 2. บันทึกรูปลงเครื่อง */}
          <button onClick={handleSaveImage} disabled={saving}
            className="btn-staff bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white shadow-md"
            style={{ minHeight: 52 }}>
            {saving
              ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Download className="w-5 h-5" />}
            {saving ? "กำลังสร้างรูปภาพ..." : "บันทึกรูปลงเครื่อง"}
          </button>

          {/* 3. พิมพ์ใบเสร็จ — ใช้ iframe ไม่เปิด tab ใหม่ */}
          <button onClick={handlePrint}
            className="btn-staff bg-gray-600 hover:bg-gray-700 text-white shadow-md"
            style={{ minHeight: 52 }}>
            <Printer className="w-5 h-5" />
            พิมพ์ใบเสร็จ
          </button>

          <button onClick={onClose}
            className="btn-staff bg-gray-100 hover:bg-gray-200 text-gray-600"
            style={{ minHeight: 48 }}>
            <X className="w-4 h-4" /> ปิด
          </button>
        </div>

        {/* Inline image overlay — fallback when share/download not available */}
        {savedImageUrl && (
          <div className="fixed inset-0 z-[60] bg-black/70 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSavedImageUrl(null)}>
            <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-center font-bold text-gray-800 text-base mb-1">กดค้างที่รูปเพื่อบันทึก</p>
              <p className="text-center text-gray-400 text-xs mb-3">กดค้างที่รูปภาพ แล้วเลือก "บันทึกรูปภาพ"</p>
              <img src={savedImageUrl} alt="ใบเสร็จ" className="w-full rounded-xl border border-gray-100" />
              <button onClick={() => setSavedImageUrl(null)}
                className="mt-3 w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium">
                ปิด
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
