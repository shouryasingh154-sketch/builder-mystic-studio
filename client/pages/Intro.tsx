import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Intro() {
  return (
    <div className="bg-gradient-to-b from-white to-secondary">
      <section className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Fix city problems together
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            See it. Report it. Get it fixed.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            CivicPulse streamlines reporting issues like potholes, sanitation,
            unsafe areas, and traffic hazards. Real-time maps and smart routing
            get every report to the right team fast.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">Road & traffic</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Potholes, broken signals, blocked lanes, dangerous crossings.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">Sanitation</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Overflowing bins, illegal dumping, street cleaning requests.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">Public safety</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Broken lighting, unsafe areas, vandalism, damaged property.
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-10" />

        <div className="mx-auto max-w-xl rounded-xl border bg-card/60 p-6 text-center shadow-sm backdrop-blur">
          <h2 className="text-2xl font-bold">Choose your portal</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start as a resident or sign in as staff to manage incoming reports.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg" className="w-full">
              <a href="/report">User login</a>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full">
              <a href="/report#admin">Admin login</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
