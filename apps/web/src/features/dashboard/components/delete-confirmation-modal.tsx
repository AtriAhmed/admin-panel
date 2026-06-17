"use client";

import { Button, Modal } from "@heroui/react";
import { Delete } from "@gravity-ui/icons";

interface DeleteConfirmationModalProps {
  confirmLabel?: string;
  description: string;
  error?: string | null;
  isBusy: boolean;
  isOpen: boolean;
  onConfirm: () => void;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
}

export function DeleteConfirmationModal({
  confirmLabel = "Delete",
  description,
  error,
  isBusy,
  isOpen,
  onConfirm,
  onOpenChange,
  title,
}: DeleteConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(nextOpen) => {
        if (isBusy) return;

        onOpenChange(nextOpen);
      }}
    >
      <Modal.Backdrop isDismissable={!isBusy}>
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Icon>
                <div className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger">
                  <Delete className="size-5" />
                </div>
              </Modal.Icon>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="grid gap-2">
                <p className="text-muted text-sm">{description}</p>
                {error ? <p className="text-danger text-sm">{error}</p> : null}
              </div>
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
              <Button
                isDisabled={isBusy}
                onPress={onConfirm}
                type="button"
                variant="danger"
              >
                {isBusy ? "Deleting..." : confirmLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
