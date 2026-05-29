package handler

import "strconv"

func parseUintID(raw string) (uint, error) {
	v, err := strconv.ParseUint(raw, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(v), nil
}
