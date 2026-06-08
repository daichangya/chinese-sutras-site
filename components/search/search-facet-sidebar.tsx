/**
 * 统一搜索 facet 侧栏
 * @author 代长亚
 */
"use client";

export function SearchFacetSidebar({
  categories,
  selectedCategories,
  colloquialOnly,
  showColloquialFilter = true,
  onToggleCategory,
  onColloquialOnlyChange,
  onClear,
}: {
  categories: string[];
  selectedCategories: string[];
  colloquialOnly: boolean;
  showColloquialFilter?: boolean;
  onToggleCategory: (category: string) => void;
  onColloquialOnlyChange: (value: boolean) => void;
  onClear: () => void;
}) {
  const hasFilters =
    selectedCategories.length > 0 || (showColloquialFilter && colloquialOnly);

  return (
    <aside
      data-testid="search-facet-sidebar"
      className="hidden lg:block w-56 shrink-0"
      aria-label="搜索筛选"
    >
      <div className="sticky top-20 space-y-6 rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-wide text-[var(--jx-muted-label)]">筛选</p>
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-[var(--jx-accent-cinnabar)] hover:underline"
            >
              清除
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--foreground)]">部类</p>
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {categories.map((cat) => {
                const checked = selectedCategories.includes(cat);
                return (
                  <li key={cat}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-xs text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleCategory(cat)}
                        className="mt-0.5 accent-[var(--jx-accent-cinnabar)]"
                      />
                      <span className="leading-snug">{cat}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {showColloquialFilter && (
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--foreground)]">内容</p>
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]">
              <input
                type="checkbox"
                checked={colloquialOnly}
                onChange={(e) => onColloquialOnlyChange(e.target.checked)}
                className="accent-[var(--jx-accent-cinnabar)]"
              />
              仅有白话（经目筛选）
            </label>
            <p className="mt-1 px-1 text-[10px] leading-relaxed text-[var(--jx-muted-label)]">
              筛选已导入白话层的经目
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
