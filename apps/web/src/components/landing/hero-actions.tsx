"use client";

import { SignInButton } from "@clerk/nextjs";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

type HeroActionsProps = {
  demoPdfHref: string;
};

export function HeroActions({ demoPdfHref }: HeroActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button variant="outline" size="lg" asChild>
        <a href={demoPdfHref} target="_blank" rel="noreferrer">
          <FileText className="size-4" />
          View demo report
        </a>
      </Button>
      <SignInButton mode="modal">
        <Button size="lg">Login</Button>
      </SignInButton>
    </div>
  );
}
