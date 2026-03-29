"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function FooterCta() {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <SignInButton mode="modal">
        <Button size="lg">Login</Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button size="lg" variant="secondary">
          Sign up
        </Button>
      </SignUpButton>
    </div>
  );
}
