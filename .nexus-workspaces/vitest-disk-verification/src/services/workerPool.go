package services

type WorkerMetric struct {
	ActiveWorkers int
	ProcessedJobs int
}

func ComputeUtilization(active int, capacity int) float64 {
	if capacity <= 0 {
		return 0.0
	}
	return float64(active) / float64(capacity)
}
