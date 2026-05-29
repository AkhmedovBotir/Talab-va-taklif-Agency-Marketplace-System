/** API: ProductCommentRow yoki { comment, activities } */
export function normalizeProductCommentCase(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const row = raw.comment && typeof raw.comment === 'object' ? raw.comment : raw;
  const ratingId = row.rating_id ?? row.id;
  if (!ratingId) return null;

  const userName = [row.user_first_name, row.user_last_name].filter(Boolean).join(' ').trim();

  const commentText =
    [row.rating_note, row.comment_template].filter((s) => typeof s === 'string' && s.trim()).join(' · ') ||
    (typeof row.comment === 'string' ? row.comment : '') ||
    (typeof row.text === 'string' ? row.text : '') ||
    "Komment matni yo'q";

  return {
    ...row,
    id: ratingId,
    rating_id: ratingId,
    status: row.case_status ?? row.status ?? 'open',
    score: row.score,
    userName: userName || null,
    commentText,
    activities: Array.isArray(raw.activities) ? raw.activities : [],
  };
}

export function getProductCommentPreview(row) {
  return normalizeProductCommentCase(row)?.commentText ?? "Komment matni yo'q";
}

export function parseProductCommentsListResponse(response) {
  const d = response?.data;
  if (d?.items && Array.isArray(d.items)) {
    return {
      success: response?.success ?? true,
      data: d.items.map((item) => normalizeProductCommentCase(item)).filter(Boolean),
      total: d.total ?? 0,
      page: d.page ?? 1,
      limit: d.limit ?? 10,
      totalPages: d.total_pages ?? 1,
    };
  }
  if (Array.isArray(d)) {
    return {
      success: response?.success ?? true,
      data: d.map((item) => normalizeProductCommentCase(item)).filter(Boolean),
      total: d.length,
      page: 1,
      limit: d.length || 10,
      totalPages: 1,
    };
  }
  return {
    success: response?.success ?? true,
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };
}
