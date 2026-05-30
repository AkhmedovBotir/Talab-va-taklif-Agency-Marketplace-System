package service

import (
	"strings"

	"backend/internal/pkg/productmedia"
	"backend/modules/contragents/domain"
)

func (s *contragentProductService) validateFiles(files []productmedia.FileInput, min, max int) error {
	if len(files) < min || len(files) > max {
		return ErrProductImagesInvalid
	}
	for _, f := range files {
		if err := productmedia.ValidateFile(f); err != nil {
			if strings.Contains(err.Error(), "too large") {
				return ErrProductImageFileTooLarge
			}
			return ErrProductImageFileInvalid
		}
	}
	return nil
}

func (s *contragentProductService) clearProductImageFiles(productID uint) error {
	rows, err := s.repo.ListImageRows(productID)
	if err != nil {
		return err
	}
	for _, r := range rows {
		s.media.RemoveFileByRel(r.Image)
	}
	return nil
}

func (s *contragentProductService) saveFilesAsProductImages(productID uint, files []productmedia.FileInput) ([]string, error) {
	paths := make([]string, 0, len(files))
	for i, f := range files {
		path, err := s.media.SaveProductFile(productID, i+1, f)
		if err != nil {
			if strings.Contains(err.Error(), "too large") {
				return nil, ErrProductImageFileTooLarge
			}
			return nil, ErrProductImageFileInvalid
		}
		paths = append(paths, path)
	}
	return paths, nil
}

func (s *contragentProductService) CreateWithFiles(contragentID uint, input ProductInput, files []productmedia.FileInput) (*ProductOutput, error) {
	input.normalize()
	if err := s.validateInput(input, false); err != nil {
		return nil, err
	}
	if err := s.validateFiles(files, 1, productMaxImages); err != nil {
		return nil, err
	}
	if err := s.validateCategoryRelation(input.CategoryID, input.SubcategoryID); err != nil {
		return nil, err
	}
	code, err := s.repo.NextProductCode()
	if err != nil {
		return nil, err
	}
	row := &domain.Product{
		ContragentID:     contragentID,
		ProductCode:      code,
		Name:             input.Name,
		Description:      input.Description,
		Price:            input.Price,
		OriginalPrice:    input.OriginalPrice,
		CategoryID:       input.CategoryID,
		SubcategoryID:    input.SubcategoryID,
		Quantity:         input.Quantity,
		Unit:             input.Unit,
		UnitSize:         input.UnitSize,
		Status:           input.Status,
		KpiBonusPercent:  input.KpiBonusPercent,
		ModerationStatus: domain.ProductModerationPending,
		RejectionReason:  "",
	}
	if err = s.repo.Create(row); err != nil {
		return nil, err
	}
	paths, err := s.saveFilesAsProductImages(row.ID, files)
	if err != nil {
		_ = s.repo.Delete(row.ID)
		s.media.RemoveProductDir(row.ID)
		return nil, err
	}
	if err = s.repo.SetImages(row.ID, paths); err != nil {
		_ = s.repo.Delete(row.ID)
		s.media.RemoveProductDir(row.ID)
		return nil, err
	}
	return s.GetByID(contragentID, row.ID)
}

func (s *contragentProductService) UpdateWithFiles(contragentID, id uint, input ProductInput, files []productmedia.FileInput) (*ProductOutput, error) {
	input.normalize()
	if err := s.validateInput(input, false); err != nil {
		return nil, err
	}
	if err := s.validateCategoryRelation(input.CategoryID, input.SubcategoryID); err != nil {
		return nil, err
	}
	row, err := s.repo.GetByIDAndContragent(id, contragentID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrProductNotFound
	}
	row.Name = input.Name
	row.Description = input.Description
	row.Price = input.Price
	row.OriginalPrice = input.OriginalPrice
	row.CategoryID = input.CategoryID
	row.SubcategoryID = input.SubcategoryID
	row.Quantity = input.Quantity
	row.Unit = input.Unit
	row.UnitSize = input.UnitSize
	row.Status = input.Status
	row.KpiBonusPercent = input.KpiBonusPercent
	row.ModerationStatus = domain.ProductModerationPending
	row.RejectionReason = ""

	var stored []string
	if len(files) > 0 {
		if err := s.validateFiles(files, 1, productMaxImages); err != nil {
			return nil, err
		}
		if err = s.clearProductImageFiles(id); err != nil {
			return nil, err
		}
		stored, err = s.saveFilesAsProductImages(id, files)
		if err != nil {
			return nil, err
		}
	}
	if err = s.repo.Update(row, stored); err != nil {
		return nil, err
	}
	return s.GetByID(contragentID, id)
}

func (s *contragentProductService) AddImages(contragentID, id uint, files []productmedia.FileInput) (*ProductOutput, error) {
	if len(files) < 1 {
		return nil, ErrProductImagesInvalid
	}
	row, err := s.repo.GetByIDAndContragent(id, contragentID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrProductNotFound
	}
	if err := s.validateFiles(files, 1, productMaxImages); err != nil {
		return nil, err
	}
	count, err := s.repo.CountImages(id)
	if err != nil {
		return nil, err
	}
	if int(count)+len(files) > productMaxImages {
		return nil, ErrProductImagesInvalid
	}
	existing, err := s.repo.ListImageRows(id)
	if err != nil {
		return nil, err
	}
	maxSort := -1
	for _, r := range existing {
		if r.SortOrder > maxSort {
			maxSort = r.SortOrder
		}
	}
	for i, f := range files {
		path, err := s.media.SaveProductFile(id, maxSort+2+i, f)
		if err != nil {
			if strings.Contains(err.Error(), "too large") {
				return nil, ErrProductImageFileTooLarge
			}
			return nil, ErrProductImageFileInvalid
		}
		imgRow := &domain.ProductImage{
			ProductID: id,
			Image:     path,
			SortOrder: maxSort + 1 + i,
		}
		if err = s.repo.CreateImageRow(imgRow); err != nil {
			return nil, err
		}
	}
	row.ModerationStatus = domain.ProductModerationPending
	row.RejectionReason = ""
	if err = s.repo.Update(row, nil); err != nil {
		return nil, err
	}
	return s.GetByID(contragentID, id)
}

func (s *contragentProductService) ReplaceImage(contragentID, id, imageID uint, file productmedia.FileInput) (*ProductOutput, error) {
	row, err := s.repo.GetByIDAndContragent(id, contragentID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrProductNotFound
	}
	if err := s.validateFiles([]productmedia.FileInput{file}, 1, 1); err != nil {
		return nil, err
	}
	imgRow, err := s.repo.GetImageRow(id, imageID)
	if err != nil {
		return nil, err
	}
	if imgRow == nil {
		return nil, ErrProductImageNotFound
	}
	s.media.RemoveFileByRel(imgRow.Image)
	path, err := s.media.SaveProductFile(id, imgRow.SortOrder+1, file)
	if err != nil {
		if strings.Contains(err.Error(), "too large") {
			return nil, ErrProductImageFileTooLarge
		}
		return nil, ErrProductImageFileInvalid
	}
	imgRow.Image = path
	if err = s.repo.UpdateImageRow(imgRow); err != nil {
		return nil, err
	}
	row.ModerationStatus = domain.ProductModerationPending
	row.RejectionReason = ""
	if err = s.repo.Update(row, nil); err != nil {
		return nil, err
	}
	return s.GetByID(contragentID, id)
}

func (s *contragentProductService) DeleteImage(contragentID, id, imageID uint) (*ProductOutput, error) {
	row, err := s.repo.GetByIDAndContragent(id, contragentID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrProductNotFound
	}
	imgRow, err := s.repo.GetImageRow(id, imageID)
	if err != nil {
		return nil, err
	}
	if imgRow == nil {
		return nil, ErrProductImageNotFound
	}
	count, err := s.repo.CountImages(id)
	if err != nil {
		return nil, err
	}
	if count <= 1 {
		return nil, ErrProductImagesInvalid
	}
	s.media.RemoveFileByRel(imgRow.Image)
	if err = s.repo.DeleteImageRow(imageID); err != nil {
		return nil, err
	}
	row.ModerationStatus = domain.ProductModerationPending
	row.RejectionReason = ""
	if err = s.repo.Update(row, nil); err != nil {
		return nil, err
	}
	return s.GetByID(contragentID, id)
}

func (s *contragentProductService) ReplaceAllImages(contragentID, id uint, files []productmedia.FileInput) (*ProductOutput, error) {
	row, err := s.repo.GetByIDAndContragent(id, contragentID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrProductNotFound
	}
	if err := s.validateFiles(files, 1, productMaxImages); err != nil {
		return nil, err
	}
	if err = s.clearProductImageFiles(id); err != nil {
		return nil, err
	}
	paths, err := s.saveFilesAsProductImages(id, files)
	if err != nil {
		return nil, err
	}
	if err = s.repo.SetImages(id, paths); err != nil {
		return nil, err
	}
	row.ModerationStatus = domain.ProductModerationPending
	row.RejectionReason = ""
	if err = s.repo.Update(row, nil); err != nil {
		return nil, err
	}
	return s.GetByID(contragentID, id)
}
