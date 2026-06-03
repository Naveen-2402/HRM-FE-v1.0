import { useEffect } from "react";
import axios from "axios";

export function useWarmup() {
  useEffect(() => {
    // Fire-and-forget requests to trigger cold start wakeup on microservices
    const services = [
      "/api/v1/candidates/health",
      "/api/v1/orchestrate/health",
    ];

    services.forEach((url) => {
      axios.get(url).catch(() => {
        // We catch and ignore errors because 404/401/405/etc. are expected
        // and still successfully wake up the underlying serverless containers.
      });
    });
  }, []);
}
