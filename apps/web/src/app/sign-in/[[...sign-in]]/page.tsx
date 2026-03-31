import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="bg-background flex min-h-full flex-1 items-center justify-center p-4">
      <SignIn />
    </div>
  );
}
