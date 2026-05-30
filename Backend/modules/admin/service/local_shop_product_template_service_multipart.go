package service

import (
	"strings"

	"backend/internal/pkg/productmedia"
	adminDomain "backend/modules/admin/domain"
)

func (s *localShopProductTemplateService) validateTemplateFiles(files []productmedia.FileInput, min, max int) error {
	if len(files) < min || len(files) > max {
		return ErrLocalShopTemplateImagesInvalid
	}
	for _, f := range files {
		if err := productmedia.ValidateFile(f); err != nil {
			if strings.Contains(err.Error(), "too large") {
				return ErrLocalShopTemplateImageFileTooLarge
			}
			return ErrLocalShopTemplateImageFileInvalid
		}
	}
	return nil
}

func (s *localShopProductTemplateService) clearTemplateImageFiles(templateID uint) error {
	rows, err := s.repo.ListImageRows(templateID)
	if err != nil {
		return err
	}
	for _, r := range rows {
		s.media.RemoveFileByRel(r.Image)
	}
	return nil
}

func (s *localShopProductTemplateService) saveFilesAsTemplateImages(templateID uint, files []productmedia.FileInput) ([]string, error) {
	paths := make([]string, 0, len(files))
	for i, f := range files {
		path, err := s.media.SaveTemplateFile(templateID, i+1, f)
		if err != nil {
			if strings.Contains(err.Error(), "too large") {
				return nil, ErrLocalShopTemplateImageFileTooLarge
			}
			return nil, ErrLocalShopTemplateImageFileInvalid
		}
		paths = append(paths, path)
	}
	return paths, nil
}

func (s *localShopProductTemplateService) CreateWithFiles(input LocalShopProductTemplateInput, files []productmedia.FileInput) (*LocalShopProductTemplateOutput, error) {
	input.normalize()
	if err := s.validateInput(input, false); err != nil {
		return nil, err
	}
	if err := s.validateTemplateFiles(files, 1, localShopTemplateMaxImages); err != nil {
		return nil, err
	}
	if err := s.validateCategoryRelation(input.CategoryID, input.SubcategoryID); err != nil {
		return nil, err
	}
	row := &adminDomain.LocalShopProductTemplate{
		Name:          input.Name,
		Description:   input.Description,
		CategoryID:    input.CategoryID,
		SubcategoryID: input.SubcategoryID,
		Unit:          input.Unit,
		UnitSize:      input.UnitSize,
		Status:        input.Status,
	}
	if err := s.repo.Create(row); err != nil {
		return nil, err
	}
	paths, err := s.saveFilesAsTemplateImages(row.ID, files)
	if err != nil {
		_ = s.repo.Delete(row.ID)
		s.media.RemoveTemplateDir(row.ID)
		return nil, err
	}
	if err = s.repo.SetImages(row.ID, paths); err != nil {
		_ = s.repo.Delete(row.ID)
		s.media.RemoveTemplateDir(row.ID)
		return nil, err
	}
	return s.GetByID(row.ID)
}

func (s *localShopProductTemplateService) UpdateWithFiles(id uint, input LocalShopProductTemplateInput, files []productmedia.FileInput) (*LocalShopProductTemplateOutput, error) {
	input.normalize()
	if err := s.validateInput(input, false); err != nil {
		return nil, err
	}
	if err := s.validateCategoryRelation(input.CategoryID, input.SubcategoryID); err != nil {
		return nil, err
	}
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopTemplateNotFound
	}
	row.Name = input.Name
	row.Description = input.Description
	row.CategoryID = input.CategoryID
	row.SubcategoryID = input.SubcategoryID
	row.Unit = input.Unit
	row.UnitSize = input.UnitSize
	row.Status = input.Status

	var stored []string
	if len(files) > 0 {
		if err := s.validateTemplateFiles(files, 1, localShopTemplateMaxImages); err != nil {
			return nil, err
		}
		if err = s.clearTemplateImageFiles(id); err != nil {
			return nil, err
		}
		stored, err = s.saveFilesAsTemplateImages(id, files)
		if err != nil {
			return nil, err
		}
	}
	if err = s.repo.Update(row, stored); err != nil {
		return nil, err
	}
	return s.GetByID(id)
}

func (s *localShopProductTemplateService) AddImages(id uint, files []productmedia.FileInput) (*LocalShopProductTemplateOutput, error) {
	if len(files) < 1 {
		return nil, ErrLocalShopTemplateImagesInvalid
	}
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopTemplateNotFound
	}
	if err := s.validateTemplateFiles(files, 1, localShopTemplateMaxImages); err != nil {
		return nil, err
	}
	count, err := s.repo.CountImages(id)
	if err != nil {
		return nil, err
	}
	if int(count)+len(files) > localShopTemplateMaxImages {
		return nil, ErrLocalShopTemplateImagesInvalid
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
		path, err := s.media.SaveTemplateFile(id, maxSort+2+i, f)
		if err != nil {
			if strings.Contains(err.Error(), "too large") {
				return nil, ErrLocalShopTemplateImageFileTooLarge
			}
			return nil, ErrLocalShopTemplateImageFileInvalid
		}
		imgRow := &adminDomain.LocalShopProductTemplateImage{
			TemplateID: id,
			Image:      path,
			SortOrder:  maxSort + 1 + i,
		}
		if err = s.repo.CreateImageRow(imgRow); err != nil {
			return nil, err
		}
	}
	return s.GetByID(id)
}

func (s *localShopProductTemplateService) ReplaceImage(id, imageID uint, file productmedia.FileInput) (*LocalShopProductTemplateOutput, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopTemplateNotFound
	}
	if err := s.validateTemplateFiles([]productmedia.FileInput{file}, 1, 1); err != nil {
		return nil, err
	}
	imgRow, err := s.repo.GetImageRow(id, imageID)
	if err != nil {
		return nil, err
	}
	if imgRow == nil {
		return nil, ErrLocalShopTemplateImageNotFound
	}
	s.media.RemoveFileByRel(imgRow.Image)
	path, err := s.media.SaveTemplateFile(id, imgRow.SortOrder+1, file)
	if err != nil {
		if strings.Contains(err.Error(), "too large") {
			return nil, ErrLocalShopTemplateImageFileTooLarge
		}
		return nil, ErrLocalShopTemplateImageFileInvalid
	}
	imgRow.Image = path
	if err = s.repo.UpdateImageRow(imgRow); err != nil {
		return nil, err
	}
	return s.GetByID(id)
}

func (s *localShopProductTemplateService) DeleteImage(id, imageID uint) (*LocalShopProductTemplateOutput, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopTemplateNotFound
	}
	imgRow, err := s.repo.GetImageRow(id, imageID)
	if err != nil {
		return nil, err
	}
	if imgRow == nil {
		return nil, ErrLocalShopTemplateImageNotFound
	}
	count, err := s.repo.CountImages(id)
	if err != nil {
		return nil, err
	}
	if count <= 1 {
		return nil, ErrLocalShopTemplateImagesInvalid
	}
	s.media.RemoveFileByRel(imgRow.Image)
	if err = s.repo.DeleteImageRow(imageID); err != nil {
		return nil, err
	}
	return s.GetByID(id)
}

func (s *localShopProductTemplateService) ReplaceAllImages(id uint, files []productmedia.FileInput) (*LocalShopProductTemplateOutput, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopTemplateNotFound
	}
	if err := s.validateTemplateFiles(files, 1, localShopTemplateMaxImages); err != nil {
		return nil, err
	}
	if err = s.clearTemplateImageFiles(id); err != nil {
		return nil, err
	}
	paths, err := s.saveFilesAsTemplateImages(id, files)
	if err != nil {
		return nil, err
	}
	if err = s.repo.SetImages(id, paths); err != nil {
		return nil, err
	}
	return s.GetByID(id)
}
