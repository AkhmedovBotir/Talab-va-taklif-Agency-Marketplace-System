package handler

import "github.com/gin-gonic/gin"

func punktIDFromContext(c *gin.Context) (uint, bool) {
	raw, ok := c.Get("punkt_id")
	if !ok {
		return 0, false
	}
	id, ok := raw.(uint)
	if !ok || id == 0 {
		return 0, false
	}
	return id, true
}
