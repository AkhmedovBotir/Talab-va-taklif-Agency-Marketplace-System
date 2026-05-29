package handler

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"backend/modules/core/domain"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type notificationSocketMessage struct {
	Event        string                         `json:"event"`
	Notification *domain.IntegrationNotification `json:"notification"`
	SentAt       time.Time                      `json:"sent_at"`
}

type notificationSocketClient struct {
	conn         *websocket.Conn
	target       string
	localShopID  *uint
}

type IntegrationNotificationSocketHub struct {
	mu      sync.RWMutex
	clients map[*notificationSocketClient]struct{}
}

var defaultIntegrationNotificationHub = NewIntegrationNotificationSocketHub()

func IntegrationNotificationHubInstance() *IntegrationNotificationSocketHub {
	return defaultIntegrationNotificationHub
}

func NewIntegrationNotificationSocketHub() *IntegrationNotificationSocketHub {
	return &IntegrationNotificationSocketHub{
		clients: make(map[*notificationSocketClient]struct{}),
	}
}

var notificationUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// CORS alohida tekshiriladi; WS uchun bu yerda bloklamaymiz.
		return true
	},
}

func (h *IntegrationNotificationSocketHub) HandleWS(c *gin.Context) {
	conn, err := notificationUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	target := normalizeSocketTarget(c.Query("target_type"))
	h.handleWSWithConn(conn, target, nil)
}

func (h *IntegrationNotificationSocketHub) HandleWSForTarget(c *gin.Context, target string) {
	conn, err := notificationUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	h.handleWSWithConn(conn, normalizeSocketTarget(target), nil)
}

// HandleWSForLocalShop — mahalla do'koni WS; faqat shu do'konga yuborilgan xabarlar yetadi.
func (h *IntegrationNotificationSocketHub) HandleWSForLocalShop(c *gin.Context, localShopID uint) {
	conn, err := notificationUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	id := localShopID
	h.handleWSWithConn(conn, domain.NotificationTargetLocalShops, &id)
}

func (h *IntegrationNotificationSocketHub) handleWSWithConn(conn *websocket.Conn, target string, localShopID *uint) {
	client := &notificationSocketClient{
		conn:        conn,
		target:      target,
		localShopID: localShopID,
	}
	h.addClient(client)
	defer h.removeClient(client)

	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	})

	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			if _, _, readErr := conn.ReadMessage(); readErr != nil {
				return
			}
		}
	}()

	for {
		select {
		case <-done:
			return
		case <-ticker.C:
			if pingErr := conn.WriteControl(websocket.PingMessage, []byte("ping"), time.Now().Add(5*time.Second)); pingErr != nil {
				return
			}
		}
	}
}

func (h *IntegrationNotificationSocketHub) BroadcastCreated(n *domain.IntegrationNotification) {
	if n == nil {
		return
	}
	msg := notificationSocketMessage{
		Event:        "integration_notification_created",
		Notification: n,
		SentAt:       time.Now(),
	}

	h.mu.RLock()
	clients := make([]*notificationSocketClient, 0, len(h.clients))
	for cl := range h.clients {
		clients = append(clients, cl)
	}
	h.mu.RUnlock()

	for _, cl := range clients {
		if !shouldSendNotificationToClient(cl, n) {
			continue
		}
		if err := cl.conn.WriteJSON(msg); err != nil {
			h.removeClient(cl)
		}
	}
}

func shouldSendNotificationToClient(cl *notificationSocketClient, n *domain.IntegrationNotification) bool {
	if !shouldSendToTarget(cl.target, n.TargetType) {
		return false
	}
	if n.NeighborhoodShopID == nil {
		return true
	}
	if cl.localShopID == nil {
		return false
	}
	return *cl.localShopID == *n.NeighborhoodShopID
}

func (h *IntegrationNotificationSocketHub) addClient(c *notificationSocketClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c] = struct{}{}
}

func (h *IntegrationNotificationSocketHub) removeClient(c *notificationSocketClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.clients[c]; ok {
		delete(h.clients, c)
		_ = c.conn.Close()
	}
}

func normalizeSocketTarget(v string) string {
	v = strings.TrimSpace(strings.ToLower(v))
	switch v {
	case domain.NotificationTargetAdmins,
		domain.NotificationTargetAgents,
		domain.NotificationTargetContragents,
		domain.NotificationTargetMarketplace,
		domain.NotificationTargetManagers,
		domain.NotificationTargetPunkts,
		domain.NotificationTargetLocalShops,
		domain.NotificationTargetDeliveryProviders:
		return v
	default:
		return domain.NotificationTargetAll
	}
}

func shouldSendToTarget(clientTarget, notificationTarget string) bool {
	if notificationTarget == domain.NotificationTargetAll {
		return true
	}
	return clientTarget == domain.NotificationTargetAll || clientTarget == notificationTarget
}
