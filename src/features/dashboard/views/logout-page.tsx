"use client";

import { Button, Card } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutPage() {
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
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 pb-10 pt-4">
      <Card className="rounded-lg">
        <Card.Header>
          <Card.Title>Log out</Card.Title>
          <Card.Description>
            End the current admin session on this browser.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="justify-end gap-2">
          <Button onPress={() => router.back()} variant="ghost">
            Cancel
          </Button>
          <Button isDisabled={isBusy} onPress={logout}>
            {isBusy ? "Logging out..." : "Continue"}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
