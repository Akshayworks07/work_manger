import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const checks = [
  "Next.js + TypeScript project created",
  "Tailwind CSS styling working",
  "Design system components working",
  "Folder structure ready for every phase",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Phase 1 — Project Setup</CardTitle>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Creative Team Production Manager
          </h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-neutral-600 text-sm">
            This page confirms the foundation is working. Login, dashboard, and
            every other feature will be built in the phases that follow.
          </p>
          <ul className="flex flex-col gap-2">
            {checks.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-neutral-700">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Button className="w-fit">This is a working button</Button>
        </CardContent>
      </Card>
    </main>
  );
}
