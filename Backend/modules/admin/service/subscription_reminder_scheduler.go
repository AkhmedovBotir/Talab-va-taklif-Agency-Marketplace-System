package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"backend/modules/admin/domain"
	"backend/modules/admin/repository"
	coreDomain "backend/modules/core/domain"
	coreHandler "backend/modules/core/handler"
	coreRepo "backend/modules/core/repository"
)

const subscriptionReminderCheckInterval = time.Hour

var subscriptionReminderDays = []int{3, 2, 1}

type SubscriptionReminderScheduler struct {
	billingRepo      repository.NeighborhoodShopBillingRepository
	reminderRepo     repository.SubscriptionReminderRepository
	notificationRepo coreRepo.IntegrationNotificationRepository
	hub              *coreHandler.IntegrationNotificationSocketHub
}

func NewSubscriptionReminderScheduler(
	billingRepo repository.NeighborhoodShopBillingRepository,
	reminderRepo repository.SubscriptionReminderRepository,
	notificationRepo coreRepo.IntegrationNotificationRepository,
	hub *coreHandler.IntegrationNotificationSocketHub,
) *SubscriptionReminderScheduler {
	return &SubscriptionReminderScheduler{
		billingRepo:      billingRepo,
		reminderRepo:     reminderRepo,
		notificationRepo: notificationRepo,
		hub:              hub,
	}
}

func (s *SubscriptionReminderScheduler) Run(ctx context.Context) {
	s.runOnce()
	ticker := time.NewTicker(subscriptionReminderCheckInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.runOnce()
		}
	}
}

func (s *SubscriptionReminderScheduler) runOnce() {
	now := time.Now().UTC()
	subs, err := s.billingRepo.ListActiveSubscriptions(now)
	if err != nil {
		log.Printf("subscription reminder: obunalar ro'yxati: %v", err)
		return
	}
	for i := range subs {
		sub := subs[i]
		daysLeft := daysUntilDate(sub.PeriodEndAt, now)
		if daysLeft < 1 || daysLeft > 3 {
			continue
		}
		shop, err := s.billingRepo.GetShopByID(sub.NeighborhoodShopID)
		if err != nil || shop == nil {
			continue
		}
		if shop.Status != domain.StatusActive {
			continue
		}
		s.trySendReminder(shop, &sub, daysLeft, now)
	}
}

func (s *SubscriptionReminderScheduler) trySendReminder(shop *domain.NeighborhoodShop, sub *domain.NeighborhoodShopSubscription, daysLeft int, now time.Time) {
	periodEnd := sub.PeriodEndAt.UTC()
	sent, err := s.reminderRepo.WasSent(shop.ID, daysLeft, periodEnd)
	if err != nil {
		log.Printf("subscription reminder: shop %d: %v", shop.ID, err)
		return
	}
	if sent {
		return
	}

	shopID := shop.ID
	title, message := reminderCopy(daysLeft, periodEnd, sub.BillingType)
	row := &coreDomain.IntegrationNotification{
		Title:              title,
		Message:            message,
		Type:               coreDomain.NotificationTypeWarning,
		TargetType:         coreDomain.NotificationTargetLocalShops,
		NeighborhoodShopID: &shopID,
	}
	if err = s.notificationRepo.Create(row); err != nil {
		log.Printf("subscription reminder: notification yaratish shop %d: %v", shop.ID, err)
		return
	}
	if err = s.reminderRepo.MarkSent(&domain.NeighborhoodShopSubscriptionReminder{
		NeighborhoodShopID: shop.ID,
		DaysBefore:         daysLeft,
		PeriodEndAt:        periodEnd,
		NotificationID:     row.ID,
	}); err != nil {
		log.Printf("subscription reminder: jurnal shop %d: %v", shop.ID, err)
		return
	}
	s.hub.BroadcastCreated(row)
}

func daysUntilDate(end, now time.Time) int {
	endD := dateOnlyUTC(end)
	nowD := dateOnlyUTC(now)
	return int(endD.Sub(nowD).Hours() / 24)
}

func dateOnlyUTC(t time.Time) time.Time {
	t = t.UTC()
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}

func reminderCopy(daysLeft int, periodEnd time.Time, billingType string) (string, string) {
	endStr := periodEnd.Format("02.01.2006")
	title := fmt.Sprintf("Xizmat muddati %d kundan keyin tugaydi", daysLeft)
	var kind string
	switch billingType {
	case domain.NeighborhoodShopBillingTypeFree:
		kind = "Bepul xizmat"
	default:
		kind = "Oylik xizmat"
	}
	message := fmt.Sprintf(
		"%s muddati %s sanasida tugaydi. Qolgan kun: %d. Davom etish uchun admin bilan bog'laning.",
		kind, endStr, daysLeft,
	)
	return title, message
}
