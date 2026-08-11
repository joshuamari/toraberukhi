function getPaginationPages(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageSet = new Set([1, totalPages]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < totalPages) {
      pageSet.add(page);
    }
  }

  const sortedPages = [...pageSet].sort((a, b) => a - b);
  const pages = [];

  sortedPages.forEach((page, index) => {
    if (index > 0 && page - sortedPages[index - 1] > 1) {
      pages.push("ellipsis");
    }
    pages.push(page);
  });

  return pages;
}

function calculatePagination(totalItems, currentPage, itemsPerPage) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    currentPage: safePage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    showingFrom: totalItems === 0 ? 0 : startIndex + 1,
    showingTo: totalItems === 0 ? 0 : endIndex,
  };
}

function renderPaginationBar($container, paginationState, noun) {
  if (!$container || !$container.length) {
    return paginationState;
  }

  const label = noun || "requests";
  const pagination = calculatePagination(
    paginationState.totalItems,
    paginationState.currentPage,
    paginationState.itemsPerPage,
  );

  const isPcsStyle = $container.hasClass("table-pagination--pcs");

  $container
    .find('[data-role="count"]')
    .text(
      `Showing ${pagination.showingFrom} to ${pagination.showingTo} of ${pagination.totalItems} ${label}`,
    );

  const $prev = $container.find('[data-role="prev"]');
  const $next = $container.find('[data-role="next"]');
  const isFirstPage = pagination.currentPage <= 1;
  const isLastPage = pagination.currentPage >= pagination.totalPages;

  $prev
    .prop("disabled", isFirstPage)
    .toggleClass("is-disabled", isFirstPage)
    .attr("aria-disabled", isFirstPage ? "true" : "false");
  $next
    .prop("disabled", isLastPage)
    .toggleClass("is-disabled", isLastPage)
    .attr("aria-disabled", isLastPage ? "true" : "false");

  const pages = getPaginationPages(
    pagination.currentPage,
    pagination.totalPages,
  );
  const $pages = $container.find('[data-role="pages"]');
  $pages.empty();

  pages.forEach((page) => {
    if (page === "ellipsis") {
      $pages.append('<span class="table-pagination__ellipsis">...</span>');
      return;
    }

    const isActive = page === pagination.currentPage;
    const pageClass = isPcsStyle
      ? "request-pagination__page table-pagination__page"
      : "table-pagination__page";
    const $button = $("<button>", {
      type: "button",
      class: `${pageClass}${isActive ? " is-active" : ""}`,
      "data-page": page,
      text: String(page),
    });

    $pages.append($button);
  });

  return pagination;
}
