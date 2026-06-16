"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LogoutConfirmationModal } from "../components/logout-confirmation-modal";

export function LogoutPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <LogoutConfirmationModal
      isOpen={isOpen}
      onOpenChange={(nextIsOpen) => {
        setIsOpen(nextIsOpen);

        if (!nextIsOpen) {
          router.back();
        }
      }}
    />
  );
}
