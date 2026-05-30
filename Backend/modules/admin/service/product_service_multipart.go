package service

import (
	"strings"

	"backend/internal/pkg/productmedia"
	contrDomain "backend/modules/contragents/domain"
)

func (s *adminProductService) validateFiles(files []productmedia.FileInput, min, max int) error {
	if len(files) < min || len(files) > max {
		return ErrAdminProductImagesInvalid
	}
	for _, f := range files {
		if err := productmedia.ValidateFile(f); err != nil {
			if strings.Contains(err.Error(), "too large") {
				return ErrAdminProductImageFileTooLarge
			}
			return ErrAdminProductImageFileInvalid
		}
	}
	return nil
}

func (s *adminProductService) clearProductImageFiles(productID uint) error {
	rows, err := s.repo.ListImageRows(productID)
	if err != nil {
		return err
	}
	for _, r := range rows {
		s.media.RemoveFileByRel(r.Image)
	}
	return nil
}

func (s *adminProductService) saveFilesAsProductImages(productID uint, files []productmedia.FileInput) ([]string, error) {
	paths := make([]string, 0, len(files))
	for i, f := range files {
		path, err := s.media.SaveProductFile(productID, i+1, f)
		if err != nil {
			if strings.Contains(err.Error(), "too large") {
				return nil, ErrAdminProductImageFileTooLarge
			}
			return nil, ErrAdminProductImageFileInvalid
		}
		paths = append(paths, path)
	}
	return paths, nil
}

func (s *adminProductService) CreateWithFiles(input AdminProductInput, files []productmedia.FileInput) (*AdminProductOutput, error) {
	input.normalize()
	if err := s.validateInput(input, false); err != nil {
		return nil, err
	}
	if err := s.validateFiles(files, 1, adminProductMaxImages); err != nil {
		return nil, err
	}
	if err := s.validateRelations(input.ContragentID, input.CategoryID, input.SubcategoryID); err != nil {
		return nil, err
	}
	code, err := s.repo.NextProductCode()
	if err != nil {
		return nil, err
	}
	row := &contrDomain.Product{
		ContragentID:     input.ContragentID,
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
		ModerationStatus: contrDomain.ProductModerationPending,
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
	return s.GetByID(row.ID)
}

func (s *adminProductService) UpdateWithFiles(id uint, input AdminProductInput, files []productmedia.FileInput) (*AdminProductOutput, error) {
	input.normalize()
	if err := s.validateInput(input, false); err != nil {
		return nil, err
	}
	if err := s.validateRelations(input.ContragentID, input.CategoryID, input.SubcategoryID); err != nil {
		return nil, err
	}
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrAdminProductNotFound
	}
	row.ContragentID = input.ContragentID
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

	var stored []string
	if len(files) > 0 {
		if err := s.validateFiles(files, 1, adminProductMaxImages); err != nil {
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
	return s.GetByID(id)
}

func (s *adminProductService) AddImages(id uint, files []productmedia.FileInput) (*AdminProductOutput, error) {
	if len(files) < 1 {
		return nil, ErrAdminProductImagesInvalid
	}
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrAdminProductNotFound
	}
	if err := s.validateFiles(files, 1, adminProductMaxImages); err != nil {
		return nil, err
	}
	count, err := s.repo.CountImages(id)
	if err != nil {
		return nil, err
	}
	if int(count)+len(files) > adminProductMaxImages {
		return nil, ErrAdminProductImagesInvalid
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
				return nil, ErrAdminProductImageFileTooLarge
			}
			return nil, ErrAdminProductImageFileInvalid
		}
		imgRow := &contrDomain.ProductImage{
			ProductID: id,
			Image:     path,
			SortOrder: maxSort + 1 + i,
		}
		if err = s.repo.CreateImageRow(imgRow); err != nil {
			return nil, err
		}
	}
	return s.GetByID(id)
}

func (s *adminProductService) ReplaceImage(id, imageID uint, file productmedia.FileInput) (*AdminProductOutput, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrAdminProductNotFound
	}
	if err := s.validateFiles([]productmedia.FileInput{file}, 1, 1); err != nil {
		return nil, err
	}
	imgRow, err := s.repo.GetImageRow(id, imageID)
	if err != nil {
		return nil, err
	}
	if imgRow == nil {
		return nil, ErrAdminProductImageNotFound
	}
	s.media.RemoveFileByRel(imgRow.Image)
	path, err := s.media.SaveProductFile(id, imgRow.SortOrder+1, file)
	if err != nil {
		if strings.Contains(err.Error(), "too large") {
			return nil, ErrAdminProductImageFileTooLarge
		}
		return nil, ErrAdminProductImageFileInvalid
	}
	imgRow.Image = path
	if err = s.repo.UpdateImageRow(imgRow); err != nil {
		return nil, err
	}
	return s.GetByID(id)
}

func (s *adminProductService) DeleteImage(id, imageID uint) (*AdminProductOutput, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrAdminProductNotFound
	}
	imgRow, err := s.repo.GetImageRow(id, imageID)
	if err != nil {
		return nil, err
	}
	if imgRow == nil {
		return nil, ErrAdminProductImageNotFound
	}
	count, err := s.repo.CountImages(id)
	if err != nil {
		return nil, err
	}
	if count <= 1 {
		return nil, ErrAdminProductImagesInvalid
	}
	s.media.RemoveFileByRel(imgRow.Image)
	if err = s.repo.DeleteImageRow(imageID); err != nil {
		return nil, err
	}
	return s.GetByID(id)
}

func (s *adminProductService) ReplaceAllImages(id uint, files []productmedia.FileInput) (*AdminProductOutput, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrAdminProductNotFound
	}
	if err := s.validateFiles(files, 1, adminProductMaxImages); err != nil {
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
	return s.GetByID(id)
}
