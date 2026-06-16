"use client";

import { Button, Modal } from "@heroui/react";
import { ArrowRightFromSquare } from "@gravity-ui/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function LogoutConfirmationModal({
  isOpen,
  onOpenChange,
}: LogoutConfirmationModalProps) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  const logout = async () => {
    setIsBusy(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(nextIsOpen) => {
        if (isBusy) return;

        onOpenChange(nextIsOpen);
      }}
    >
      <Modal.Backdrop isDismissable={!isBusy}>
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Icon>
                <div className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger">
                  <ArrowRightFromSquare className="size-5" />
                </div>
              </Modal.Icon>
              <Modal.Heading>Log out?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted text-sm">
                This will end the current admin session on this browser and return you
                to the sign in page.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isBusy}
                onPress={() => onOpenChange(false)}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button isDisabled={isBusy} onPress={logout} type="button" variant="danger">
                {isBusy ? "Logging out..." : "Log out"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
