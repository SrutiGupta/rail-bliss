export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="text-display text-base">RailYatra</p>
          <p className="mt-2 text-muted-foreground">
            Online railway ticket booking — search trains, reserve seats, check PNR status and
            manage cancellations.
          </p>
        </div>
        <div>
          <p className="font-semibold">Project</p>
          <p className="mt-2 text-muted-foreground">
            Software Engineering Lab (PCC-IT 651)
            <br />
            University Institute of Technology,
            <br />
            The University of Burdwan
          </p>
        </div>
        <div>
          <p className="font-semibold">Team</p>
          <p className="mt-2 text-muted-foreground">
            Anushree Guin · Rajnish Kumar · Sruti Gupta · Shreya Biswas
            <br />
            Guide: Mr. Dibyadeep Nandi
          </p>
        </div>
      </div>
    </footer>
  );
}
