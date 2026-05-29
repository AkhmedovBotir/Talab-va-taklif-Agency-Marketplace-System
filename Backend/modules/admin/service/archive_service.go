package service

import (
	"encoding/json"
	"errors"
	"strings"
	"time"

	"backend/modules/admin/domain"
	"backend/modules/admin/repository"
	"gorm.io/gorm"
)

var (
	ErrArchiveTypeInvalid = errors.New("archive turi noto'g'ri")
	ErrArchiveNotFound    = errors.New("arxiv ma'lumoti topilmadi")
)

type ArchiveListOutput struct {
	Items      []domain.ArchiveLog `json:"items"`
	Total      int64               `json:"total"`
	Page       int                 `json:"page"`
	Limit      int                 `json:"limit"`
	TotalPages int                 `json:"total_pages"`
}

type ArchiveService interface {
	Archive(entityType string, entityID, deletedByID uint, payload interface{}) error
	List(entityType string, page, limit int) (*ArchiveListOutput, error)
	Get(entityType string, id uint) (*domain.ArchiveLog, error)
}

type archiveService struct {
	repo repository.ArchiveRepository
	db   *gorm.DB
}

func NewArchiveService(repo repository.ArchiveRepository, db *gorm.DB) ArchiveService {
	return &archiveService{repo: repo, db: db}
}

func normalizeArchiveType(v string) (string, error) {
	v = strings.TrimSpace(v)
	switch v {
	case domain.ArchiveTypeAgent, domain.ArchiveTypeContragent, domain.ArchiveTypeLocalShop, domain.ArchiveTypeMarketplaceUser, domain.ArchiveTypePunkt:
		return v, nil
	default:
		return "", ErrArchiveTypeInvalid
	}
}

func (s *archiveService) Archive(entityType string, entityID, deletedByID uint, payload interface{}) error {
	t, err := normalizeArchiveType(entityType)
	if err != nil {
		return err
	}
	var payloadMap map[string]interface{}
	if v, ok := payload.(map[string]interface{}); ok {
		payloadMap = v
	} else {
		payloadMap = map[string]interface{}{"snapshot": payload}
	}
	related, err := s.collectRelated(t, entityID)
	if err != nil {
		return err
	}
	payloadMap["related"] = related
	payloadMap["entity_type"] = t

	b, err := json.Marshal(payloadMap)
	if err != nil {
		return err
	}
	return s.repo.Create(&domain.ArchiveLog{
		EntityType:  t,
		EntityID:    entityID,
		DeletedByID: deletedByID,
		Payload:     string(b),
		ArchivedAt:  time.Now().UTC(),
	})
}

func (s *archiveService) collectRelated(entityType string, entityID uint) (map[string]interface{}, error) {
	out := map[string]interface{}{}
	switch entityType {
	case domain.ArchiveTypeAgent:
		orders, err := s.queryRows("marketplace_orders", "assigned_agent_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["marketplace_orders"] = orders
		orderIDs := getIDs(orders)
		orderItems, err := s.queryRowsIN("marketplace_order_items", "order_id", orderIDs)
		if err != nil {
			return nil, err
		}
		out["marketplace_order_items"] = orderItems
		kpi, err := s.queryRows("agent_kpi_payouts", "agent_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["agent_kpi_payouts"] = kpi
	case domain.ArchiveTypePunkt:
		orders, err := s.queryRows("marketplace_orders", "assigned_punkt_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["marketplace_orders"] = orders
		orderIDs := getIDs(orders)
		orderItems, err := s.queryRowsIN("marketplace_order_items", "order_id", orderIDs)
		if err != nil {
			return nil, err
		}
		out["marketplace_order_items"] = orderItems
		kpi, err := s.queryRows("punkt_kpi_payouts", "punkt_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["punkt_kpi_payouts"] = kpi
		transfers, err := s.queryRows("punkt_order_transfers", "punkt_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["punkt_order_transfers"] = transfers
		transferIDs := getIDs(transfers)
		transferItems, err := s.queryRowsIN("punkt_order_transfer_items", "transfer_id", transferIDs)
		if err != nil {
			return nil, err
		}
		out["punkt_order_transfer_items"] = transferItems
	case domain.ArchiveTypeContragent:
		products, err := s.queryRows("products", "contragent_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["products"] = products
		productIDs := getIDs(products)
		productImages, err := s.queryRowsIN("product_images", "product_id", productIDs)
		if err != nil {
			return nil, err
		}
		out["product_images"] = productImages
		orderItems, err := s.queryRows("marketplace_order_items", "contragent_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["marketplace_order_items"] = orderItems
		lineRequests, err := s.queryRows("punkt_contragent_line_requests", "contragent_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["punkt_contragent_line_requests"] = lineRequests
	case domain.ArchiveTypeLocalShop:
		products, err := s.queryRows("local_shop_products", "local_shop_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["local_shop_products"] = products
		orders, err := s.queryRows("marketplace_local_shop_orders", "local_shop_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["marketplace_local_shop_orders"] = orders
		orderIDs := getIDs(orders)
		orderItems, err := s.queryRowsIN("marketplace_local_shop_order_items", "order_id", orderIDs)
		if err != nil {
			return nil, err
		}
		out["marketplace_local_shop_order_items"] = orderItems
		workingHours, err := s.queryRows("local_shop_working_hours", "local_shop_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["local_shop_working_hours"] = workingHours
		serviceAreas, err := s.queryRows("local_shop_service_areas", "local_shop_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["local_shop_service_areas"] = serviceAreas
		couriers, err := s.queryRows("local_shop_couriers", "local_shop_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["local_shop_couriers"] = couriers
	case domain.ArchiveTypeMarketplaceUser:
		orders, err := s.queryRows("marketplace_orders", "user_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["marketplace_orders"] = orders
		orderIDs := getIDs(orders)
		orderItems, err := s.queryRowsIN("marketplace_order_items", "order_id", orderIDs)
		if err != nil {
			return nil, err
		}
		out["marketplace_order_items"] = orderItems
		localOrders, err := s.queryRows("marketplace_local_shop_orders", "user_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["marketplace_local_shop_orders"] = localOrders
		localOrderIDs := getIDs(localOrders)
		localOrderItems, err := s.queryRowsIN("marketplace_local_shop_order_items", "order_id", localOrderIDs)
		if err != nil {
			return nil, err
		}
		out["marketplace_local_shop_order_items"] = localOrderItems
		deliveryAreas, err := s.queryRows("marketplace_delivery_areas", "user_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["marketplace_delivery_areas"] = deliveryAreas
		cart, err := s.queryRows("marketplace_cart_items", "user_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["marketplace_cart_items"] = cart
		localCart, err := s.queryRows("marketplace_local_shop_cart_items", "user_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["marketplace_local_shop_cart_items"] = localCart
		ratings, err := s.queryRows("marketplace_product_ratings", "user_id = ?", entityID)
		if err != nil {
			return nil, err
		}
		out["marketplace_product_ratings"] = ratings
	}
	return out, nil
}

func (s *archiveService) queryRows(table, where string, args ...interface{}) ([]map[string]interface{}, error) {
	rows := make([]map[string]interface{}, 0)
	if err := s.db.Table(table).Where(where, args...).Order("id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (s *archiveService) queryRowsIN(table, field string, ids []uint) ([]map[string]interface{}, error) {
	if len(ids) == 0 {
		return []map[string]interface{}{}, nil
	}
	rows := make([]map[string]interface{}, 0)
	if err := s.db.Table(table).Where(field+" IN ?", ids).Order("id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func getIDs(rows []map[string]interface{}) []uint {
	out := make([]uint, 0, len(rows))
	for _, row := range rows {
		v, ok := row["id"]
		if !ok || v == nil {
			continue
		}
		switch t := v.(type) {
		case int64:
			out = append(out, uint(t))
		case int32:
			out = append(out, uint(t))
		case int:
			out = append(out, uint(t))
		case float64:
			out = append(out, uint(t))
		case uint:
			out = append(out, t)
		}
	}
	return out
}

func (s *archiveService) List(entityType string, page, limit int) (*ArchiveListOutput, error) {
	t, err := normalizeArchiveType(entityType)
	if err != nil {
		return nil, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	items, total, err := s.repo.ListByType(t, page, limit)
	if err != nil {
		return nil, err
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &ArchiveListOutput{Items: items, Total: total, Page: page, Limit: limit, TotalPages: totalPages}, nil
}

func (s *archiveService) Get(entityType string, id uint) (*domain.ArchiveLog, error) {
	t, err := normalizeArchiveType(entityType)
	if err != nil {
		return nil, err
	}
	row, err := s.repo.GetByIDAndType(id, t)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrArchiveNotFound
	}
	return row, nil
}
