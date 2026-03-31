package handler

import "github.com/gin-gonic/gin"

func agentIDFromContext(c *gin.Context) (uint, bool) {
	raw, ok := c.Get("agent_id")
	if !ok {
		return 0, false
	}
	id, ok := raw.(uint)
	if !ok || id == 0 {
		return 0, false
	}
	return id, true
}
