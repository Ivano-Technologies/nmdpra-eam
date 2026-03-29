"use client";

import { SignInButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function FooterCta() {
  return (
    <div className="flex flex-col items-center gap-4">
      <SignInButton mode="modal">
        <Button size="lg">Login</Button>
      </SignInButton>
    </div>
  );
}
