package service

import (
	"errors"
	"strings"

	"backend/modules/marketplace/domain"
	"backend/modules/marketplace/repository"
)

var (
	ErrProductRatingOrderNotDelivered = errors.New("buyurtma yetkazilgan bo'lishi kerak")
	ErrProductRatingItemsRequired     = errors.New("items majburiy")
	ErrProductRatingItemNotInOrder    = errors.New("item orderga tegishli emas")
	ErrProductRatingScoreInvalid      = errors.New("score 1 dan 5 gacha bo'lishi kerak")
	ErrProductRatingTemplateNotFound  = errors.New("comment_template_id topilmadi yoki nofaol")
)

type ProductRatingItemInput struct {
	OrderItemID       uint   `json:"order_item_id"`
	Score             int    `json:"score"`
	CommentTemplateID *uint  `json:"comment_template_id"`
	Note              string `json:"note"`
}

type SubmitProductRatingsInput struct {
	Items []ProductRatingItemInput `json:"items"`
}

type ProductRatingService interface {
	SubmitForOrder(userID, orderID uint, input SubmitProductRatingsInput) error
}

type productRatingService struct {
	repo repository.ProductRatingRepository
}

func NewProductRatingService(repo repository.ProductRatingRepository) ProductRatingService {
	return &productRatingService{repo: repo}
}

func (s *productRatingService) SubmitForOrder(userID, orderID uint, input SubmitProductRatingsInput) error {
	if len(input.Items) == 0 {
		return ErrProductRatingItemsRequired
	}
	orderItems, err := s.repo.ListDeliveredOrderItemsForUser(orderID, userID)
	if err != nil {
		return err
	}
	if len(orderItems) == 0 {
		return ErrProductRatingOrderNotDelivered
	}
	itemMap := make(map[uint]repository.DeliveredOrderItemRow, len(orderItems))
	for _, it := range orderItems {
		itemMap[it.OrderItemID] = it
	}
	for _, it := range input.Items {
		row, ok := itemMap[it.OrderItemID]
		if !ok {
			return ErrProductRatingItemNotInOrder
		}
		if it.Score < 1 || it.Score > 5 {
			return ErrProductRatingScoreInvalid
		}
		if it.CommentTemplateID != nil && *it.CommentTemplateID > 0 {
			okTpl, err := s.repo.CommentTemplateExists(*it.CommentTemplateID)
			if err != nil {
				return err
			}
			if !okTpl {
				return ErrProductRatingTemplateNotFound
			}
		}
		note := strings.TrimSpace(it.Note)
		r := &domain.ProductRating{
			UserID:            userID,
			OrderID:           orderID,
			OrderItemID:       it.OrderItemID,
			ProductID:         row.ProductID,
			Score:             it.Score,
			CommentTemplateID: it.CommentTemplateID,
			Note:              note,
		}
		if err := s.repo.Upsert(r); err != nil {
			return err
		}
	}
	return nil
}
