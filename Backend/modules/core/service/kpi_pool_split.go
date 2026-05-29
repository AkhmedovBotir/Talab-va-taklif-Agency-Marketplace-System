package service

import "math"

// splitKPIPoolMoney — KPI havzasini foizlar bo‘yicha ajratadi; oxirgi yo‘nalik qoldiq bilan tekislanadi (2 xona).
func splitKPIPoolMoney(pool float64, a KPIAllocationBody) (punkt, agent, manager, finance, delivery float64) {
	if pool <= 0 || math.IsNaN(pool) || math.IsInf(pool, 0) {
		return 0, 0, 0, 0, 0
	}
	pcts := []int{a.Punkt, a.Agent, a.Manager, a.Finance, a.Delivery}
	raw := make([]float64, 5)
	for i := range pcts {
		raw[i] = pool * float64(pcts[i]) / 100.0
	}
	out := make([]float64, 5)
	var sum4 float64
	for i := 0; i < 4; i++ {
		out[i] = math.Round(raw[i]*100) / 100
		sum4 += out[i]
	}
	out[4] = math.Round((pool-sum4)*100) / 100
	return out[0], out[1], out[2], out[3], out[4]
}
