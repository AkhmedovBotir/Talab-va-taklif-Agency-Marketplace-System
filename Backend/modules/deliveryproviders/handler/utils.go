package handler

import (
	"errors"
	"strconv"
)

func parseUintID(raw string) (uint, error) {
	v, err := strconv.ParseUint(raw, 10, 32)
	if err != nil {
		return 0, err
	}
	if v == 0 {
		return 0, errors.New("id must be greater than zero")
	}
	return uint(v), nil
}
