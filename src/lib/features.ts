// Feature flags for the Watch panel.
//
// MONITORING_ENABLED gates the "Monitoreo" section (synthetic checks +
// observability activity) across the sidebar, the Inicio overview, and the
// /dashboard/monitoreo route. Turned off for now — the observability ingest
// endpoint and its data model stay intact, so flip this back to `true` to
// restore the UI without any further changes.
export const MONITORING_ENABLED: boolean = false
