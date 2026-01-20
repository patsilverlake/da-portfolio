import { PortfolioBuilder } from "@/components/dashboard/PortfolioBuilder";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
        <div className="w-full max-w-7xl items-center justify-between text-sm flex mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Digital Assets Portfolio Simulator</h1>
          <p className="text-muted-foreground">Historical Performance (2020 - Present)</p>
        </div>
        <PortfolioBuilder />
      </main>
    </div>
  );
}
