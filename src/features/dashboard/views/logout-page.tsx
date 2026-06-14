"use client";

import { Button, Card } from "@heroui/react";

export function LogoutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 pb-10 pt-4">
      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title>Log out</Card.Title>
          <Card.Description>
            Authentication is not connected yet. This screen will call the Hono BFF logout endpoint
            once the Zitadel session flow is implemented.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="justify-end gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button>Continue</Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
