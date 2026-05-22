import '../../assets/js/layout';
import { renderLayout } from '../../assets/js/layout';
import { playStoreArrivalTransition } from '../../assets/js/island-transition';
import { api } from '../../assets/js/api';
import { formatPrice, normalizePageResult, qs, showNotice } from '../../assets/js/utils';
import birdsIcon from '../../images/birds_icon.gif';
import catsIcon from '../../images/cats_icon.gif';
import dogsIcon from '../../images/dogs_icon.gif';
import fishIcon from '../../images/fish_icon.gif';
import reptilesIcon from '../../images/reptiles_icon.gif';
import birdsBanner from '../../images/banner_birds.gif';
import catsBanner from '../../images/banner_cats.gif';
import dogsBanner from '../../images/banner_dogs.gif';
import fishBanner from '../../images/banner_fish.gif';
import reptilesBanner from '../../images/banner_reptiles.gif';
import promoBannerOne from '../../images/banner1.jpg';
import promoBannerTwo from '../../images/banner2.jpg';
import promoBannerThree from '../../images/banner3.jpg';
import './catalog.css';

renderLayout('商品列表');
playStoreArrivalTransition();

const state = {
  page: 1,
  pageSize: 9,
  categoryId: '',
  keyword: '',
  totalPages: 1,
};

const categoryList = qs('[data-category-list]');
const productList = qs('[data-product-list]');
const listTitle = qs('[data-list-title]');
const listMeta = qs('[data-list-meta]');
const notice = qs('[data-notice]');
const prevButton = qs('[data-prev-page]');
const nextButton = qs('[data-next-page]');
const carousel = qs('[data-carousel]');
const carouselTrack = qs('[data-carousel-track]');
const carouselDots = qs('[data-carousel-dots]');
const carouselPrev = qs('[data-carousel-prev]');
const carouselNext = qs('[data-carousel-next]');
const searchForm = qs('[data-search-form]');
const searchInput = qs('#catalog-keyword');

const categoryMeta = {
  BIRDS: { icon: birdsIcon, banner: birdsBanner, label: 'Birds' },
  CATS: { icon: catsIcon, banner: catsBanner, label: 'Cats' },
  DOGS: { icon: dogsIcon, banner: dogsBanner, label: 'Dogs' },
  FISH: { icon: fishIcon, banner: fishBanner, label: 'Fish' },
  REPTILES: { icon: reptilesIcon, banner: reptilesBanner, label: 'Reptiles' },
};

const promoSlides = [
  { image: promoBannerOne, alt: 'MyPetStore 活动海报一' },
  { image: promoBannerTwo, alt: 'MyPetStore 活动海报二' },
  { image: promoBannerThree, alt: 'MyPetStore 活动海报三' },
];
const carouselAutoPlayDelay = 3200;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripHtml(value = '') {
  const template = document.createElement('template');
  template.innerHTML = value;
  return template.content.textContent.trim();
}

function getCategoryMeta(categoryId = '') {
  const key = categoryId.toUpperCase();
  return categoryMeta[key] || { icon: fishIcon, banner: fishBanner, label: categoryId || 'Catalog' };
}

function getSamplePrice(product) {
  const prices = (product.items || []).map((item) => Number(item.listPrice)).filter(Boolean);
  if (!prices.length) {
    return '查看详情';
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
}

function setupCatalogCarousel() {
  if (!carousel || !carouselTrack || !carouselDots || !carouselPrev || !carouselNext) {
    return;
  }

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = 0;
  let isAnimating = false;
  let isInteractionPaused = false;
  let timerId;
  const loopSlides = [...promoSlides, { ...promoSlides[0], isClone: true }];

  carouselTrack.innerHTML = loopSlides
    .map((slide, index) => {
      const slideAttrs = slide.isClone ? 'aria-hidden="true"' : `role="group" aria-label="${index + 1} / ${promoSlides.length}"`;
      const imageAttrs = slide.isClone ? 'alt="" aria-hidden="true"' : `alt="${slide.alt}"`;
      return `<div class="catalog-carousel__slide" ${slideAttrs}>
        <img src="${slide.image}" ${imageAttrs} ${index === 0 ? 'loading="eager"' : 'loading="lazy"'} decoding="async" />
      </div>`;
    })
    .join('');

  carouselDots.innerHTML = promoSlides
    .map(
      (_, index) =>
        `<button class="catalog-carousel__dot" type="button" data-carousel-index="${index}" aria-label="查看第 ${index + 1} 张活动海报"></button>`,
    )
    .join('');

  const dotButtons = Array.from(carouselDots.querySelectorAll('[data-carousel-index]'));

  function stopAutoPlay() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = undefined;
    }
  }

  function getRealIndex(index) {
    return (index + promoSlides.length) % promoSlides.length;
  }

  function renderDots(index = currentIndex) {
    const realIndex = getRealIndex(index);
    dotButtons.forEach((button, dotIndex) => {
      const isActive = dotIndex === realIndex;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function jumpToIndex(index) {
    carouselTrack.classList.add('is-resetting');
    currentIndex = index;
    carouselTrack.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;
    void carouselTrack.offsetHeight;
    carouselTrack.classList.remove('is-resetting');
    renderDots();
  }

  function showSlide(nextIndex, shouldRestart = true) {
    if (isAnimating) {
      return;
    }

    if (reduceMotionQuery.matches) {
      jumpToIndex(getRealIndex(nextIndex));
    } else {
      if (nextIndex === currentIndex) {
        if (shouldRestart) {
          startAutoPlay();
        }
        return;
      }
      isAnimating = true;
      currentIndex = nextIndex;
      carouselTrack.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;
      renderDots();
    }

    if (shouldRestart) {
      startAutoPlay();
    }
  }

  function startAutoPlay() {
    stopAutoPlay();
    if (reduceMotionQuery.matches || document.hidden || isInteractionPaused) {
      return;
    }
    timerId = window.setInterval(() => {
      showSlide(currentIndex + 1, false);
    }, carouselAutoPlayDelay);
  }

  function pauseForInteraction() {
    isInteractionPaused = true;
    stopAutoPlay();
  }

  function resumeAfterInteraction() {
    isInteractionPaused = false;
    startAutoPlay();
  }

  function showPreviousSlide() {
    if (isAnimating) {
      return;
    }
    if (currentIndex === 0 && !reduceMotionQuery.matches) {
      jumpToIndex(promoSlides.length);
    }
    showSlide(currentIndex - 1);
  }

  carouselPrev.addEventListener('click', showPreviousSlide);
  carouselNext.addEventListener('click', () => showSlide(currentIndex + 1));
  dotButtons.forEach((button) => {
    button.addEventListener('click', () => showSlide(Number(button.dataset.carouselIndex || 0)));
  });

  carouselTrack.addEventListener('transitionend', (event) => {
    if (event.propertyName !== 'transform') {
      return;
    }
    isAnimating = false;
    if (currentIndex === promoSlides.length) {
      jumpToIndex(0);
    }
  });

  carousel.addEventListener('mouseenter', pauseForInteraction);
  carousel.addEventListener('mouseleave', resumeAfterInteraction);
  carousel.addEventListener('focusin', pauseForInteraction);
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) {
      resumeAfterInteraction();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoPlay();
      return;
    }
    startAutoPlay();
  });
  reduceMotionQuery.addEventListener('change', startAutoPlay);

  jumpToIndex(0);
  startAutoPlay();
}

function renderProducts(pageResult) {
  state.totalPages = pageResult.totalPages;
  listMeta.textContent = `共 ${pageResult.total} 个结果，第 ${pageResult.page} / ${pageResult.totalPages || 1} 页`;
  prevButton.disabled = state.page <= 1;
  nextButton.disabled = state.page >= state.totalPages;

  if (!pageResult.items.length) {
    productList.innerHTML = '<div class="empty-state">暂无商品</div>';
    return;
  }

  productList.innerHTML = pageResult.items
    .map((product) => {
      const key = (product.categoryId || 'CATALOG').toUpperCase();
      const meta = getCategoryMeta(key);
      const description = stripHtml(product.description) || '暂无商品描述';
      return `<article class="card product-card" data-category-key="${escapeHtml(key)}" style="--banner-image: url('${meta.banner}')">
        <div class="product-card__banner">
          <span class="badge">${escapeHtml(meta.label || key)}</span>
        </div>
        <div class="product-card__body">
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="product-card__meta">
          <span class="price">${getSamplePrice(product)}</span>
          <a class="btn btn-primary" href="/product.html?productId=${encodeURIComponent(product.productId)}">查看</a>
        </div>
      </article>`;
    })
    .join('');
}

async function loadCategories() {
  categoryList.innerHTML = '<div class="catalog-category-pending" role="status">正在同步分类...</div>';
  const categories = await api.get('/catalog/categories');
  state.categoryId = categories[0]?.categoryId || '';
  categoryList.innerHTML = categories.length
    ? categories
        .map((category, index) => {
          const key = (category.categoryId || '').toUpperCase();
          const meta = getCategoryMeta(key);
          return `<button class="catalog-category${index === 0 ? ' is-active' : ''}" type="button" data-category="${escapeHtml(category.categoryId)}" data-category-key="${escapeHtml(key)}">
            <span class="catalog-category__icon"><img src="${meta.icon}" alt="${escapeHtml(category.name)}" /></span>
            <span class="catalog-category__arrow" aria-hidden="true">→</span>
          </button>`;
        })
        .join('')
    : '<div class="empty-state">暂无分类</div>';
}

async function loadAllProductsFromCategories() {
  const categories = await api.get('/catalog/categories');
  const products = await Promise.all(
    categories.map(
      (category) =>
        api.get(`/catalog/categories/${encodeURIComponent(category.categoryId)}/products`, {
          page: 1,
          pageSize: 3,
        }),
    ),
  );
  return {
    total: products.reduce((sum, page) => sum + (page.total || 0), 0),
    page: 1,
    pageSize: products.reduce((sum, page) => sum + (page.items?.length || 0), 0),
    totalPages: 1,
    items: products.flatMap((page) => page.items || []),
  };
}

async function loadProducts() {
  productList.innerHTML = '<div class="catalog-pending" role="status">正在整理商店货架...</div>';
  prevButton.disabled = true;
  nextButton.disabled = true;
  try {
    let result;
    if (state.keyword) {
      listTitle.textContent = `搜索：${state.keyword}`;
      result = await api.get('/catalog/search', {
        keyword: state.keyword,
        page: state.page,
        pageSize: state.pageSize,
      });
    } else if (state.categoryId) {
      listTitle.textContent = `分类：${state.categoryId}`;
      result = await api.get(`/catalog/categories/${encodeURIComponent(state.categoryId)}/products`, {
        page: state.page,
        pageSize: state.pageSize,
      });
    } else {
      listTitle.textContent = '全部商品';
      result = await loadAllProductsFromCategories();
    }
    renderProducts(normalizePageResult(result));
  } catch (error) {
    showNotice(notice, error.message, 'error');
    productList.innerHTML = '<div class="empty-state">商品加载失败</div>';
  }
}

categoryList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  categoryList.querySelectorAll('.catalog-category').forEach((item) => item.classList.remove('is-active'));
  button.classList.add('is-active');
  state.categoryId = button.dataset.category;
  state.keyword = '';
  if (searchInput) {
    searchInput.value = '';
  }
  state.page = 1;
  loadProducts();
});

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const keyword = String(new FormData(event.currentTarget).get('keyword') || '').trim();
  state.keyword = keyword;
  if (keyword) {
    state.categoryId = '';
    categoryList.querySelectorAll('.catalog-category').forEach((item) => item.classList.remove('is-active'));
  }
  state.page = 1;
  loadProducts();
});

qs('[data-prev-page]').addEventListener('click', () => {
  if (state.page > 1) {
    state.page -= 1;
    loadProducts();
  }
});

qs('[data-next-page]').addEventListener('click', () => {
  if (state.page < state.totalPages) {
    state.page += 1;
    loadProducts();
  }
});

setupCatalogCarousel();
loadCategories().then(loadProducts).catch((error) => showNotice(notice, error.message, 'error'));
