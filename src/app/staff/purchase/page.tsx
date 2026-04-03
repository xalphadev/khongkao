import { Suspense } from "react";
import PurchasePage from "@/components/staff/PurchasePage";

export default function Purchase() {
  return (
    <Suspense>
      <PurchasePage />
    </Suspense>
  );
}
