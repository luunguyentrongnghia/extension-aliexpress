let currentPage = 1;
let totalPages = 1;
let limit = 5;  // Số sản phẩm mỗi trang

// Hàm gọi API và load dữ liệu sản phẩm
async function fetchProducts(page) {
    const offset = (page - 1) * limit;
    const { accessToken } = await chrome.storage.local.get('accessToken');
    if(isAccessTokenExpired(accessToken)){
        await refreshAccessToken();
    }
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/ex/product/?limit=${limit}&offset=${offset}`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`  // Gửi access token trong header
        }
        });
        const data = await response.json();
        console.log('API Response:', data);
        if (data.products && data.products.length > 0) {
            displayProducts(data.products);  // Hiển thị sản phẩm
            totalPages = data.total_pages;  // Cập nhật tổng số trang
            generatePageNumbers();  // Tạo danh sách số trang
        }

        // Cập nhật trạng thái của các nút phân trang
        document.getElementById('prev-page').disabled = page === 1;
        document.getElementById('next-page').disabled = page === totalPages;
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}
function isAccessTokenExpired(token) {
    try {
        const decoded = jwt_decode(token);  // Giải mã token
        const currentTime = Date.now() / 1000;  // Thời gian hiện tại tính bằng giây (epoch)
        return decoded.exp < currentTime;  // Kiểm tra nếu token đã hết hạn
    } catch (error) {
        console.error("Invalid token", error);
        return true;  // Nếu token không hợp lệ, coi như đã hết hạn
    }
}
async function refreshAccessToken() {
    const { refreshToken } = await chrome.storage.local.get('refreshToken');  // Lấy refresh token từ storage

    const response = await fetch('http://localhost:8000/api/token/refresh/', {  // Gọi API refresh token
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            refresh: refreshToken
        })
    });

    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    await chrome.storage.local.set({
        accessToken: data.access,
        refreshToken: data.refresh
    });

    return data.access;  // Trả về access token mới
}
function convertToHTML(rawString) {
    // Tạo một phần tử tạm thời để gán chuỗi vào
    const tempElement = document.createElement('div');
    tempElement.innerHTML = rawString;  // Gán chuỗi vào phần tử DOM

    // Trả về phần tử HTML đã được chuyển đổi
    return tempElement.innerHTML;  // Hoặc bạn có thể sử dụng tempElement.childNodes nếu cần.
}
async function fetchCategoryData() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/ex/category/tree/',{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        window.categoryData = data;
    } catch (error) {
        console.error('Error fetching category data:', error);
        throw error;  // Ném lỗi nếu có lỗi xảy ra
    }
}
// Hiển thị các sản phẩm trong danh sách
async function displayProducts(products) {
    const productListContainer = document.querySelector('.list-products');
    productListContainer.innerHTML = '';  // Xóa danh sách sản phẩm cũ

    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.classList.add('products-container');
        productElement.setAttribute('id-ctn-product', product.id);
        productElement.innerHTML = `
            <div class="tabs">
                <div id="product-tab-${product.id}" class="tab active">Product</div>
                <div id="description-tab-${product.id}" class="tab">Description</div>
                <div id="variants-tab-${product.id}" class="tab">Variants</div>
                <div id="images-tab-${product.id}" class="tab">Images</div>
            </div>

            <div class="product-wrapper">
                <div id="product-${product.id}" class="tab-content active">
                    <div class="product-image-container">
                        <img src="${product.images[0].uri}" alt="Product Image" class="product-image">
                    </div>
                    <div class="product-details-container">
                        <div class="product-details">
                            <label for="product-name" class="product-label">Product Name</label>
                            <input type="text" value="${product.title}" class="product-input">
                        </div>
                         <div class="product-details">
                            <label for="categorySelect" class="form-label">
                                Category
                            </label>
                            <span class="text-muted" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true"
                                title="Some categories are invite-only and can't be selected.<br>
                                        To add these categories, apply for access by sending your seller name, requested category, and shop code to your account manager."
                                style="cursor: pointer;">
                                <i class="ti ti-help-circle"></i>
                            </span>
                            <div class="input-group">
                                <input type="hidden" id="categorySelect-${product.id}" name="categorySelect" value="" />
                                <div id="fakeSelect-${product.id}" class="form-control select2" style="cursor: pointer; position: relative;">
                                    <span id="fakeSelectText-${product.id}">Select a category</span>
                                    <i class="ti ti-chevron-down"
                                        style="position:absolute; right:8px; top:50%; transform:translateY(-50%);"></i>
                                    <div id="megaMenu-${product.id}" class="mega-menu select2-dropdown"
                                        style="display: none; position: absolute; top: 100%; left: 0; width: 100%;">
                                        <div id="breadcrumbRow-${product.id}" class="breadcrumbRow p-2 border-bottom" style="background-color:#f8f8f8;">
                                            <span id="breadcrumbText-${product.id}">All Categories</span>
                                        </div>
                                        <div class="position-relative" style="overflow:hidden;">
                                            <button id="scrollLeftBtn-${product.id}" type="button"
                                                    style="position:absolute; left:0; top:50%; transform:translateY(-50%); z-index:2;
                                                        background-color:#fff; border:1px solid #ccc; border-radius:4px;
                                                        display:none; cursor:pointer;">
                                                ‹
                                            </button>

                                            <div id="columnsWrapper-${product.id}" class="d-flex" style="gap:1px; overflow-x:auto; scroll-behavior:smooth;">
                                                <div id="colLevel1-${product.id}" class="category-column"></div>
                                                <div id="colLevel2-${product.id}" class="category-column"></div>
                                                <div id="colLevel3-${product.id}" class="category-column"></div>
                                                <div id="colLevel4-${product.id}" class="category-column"></div>
                                                <div id="colLevel4-${product.id}" class="category-column"></div>
                                                <div id="colLevel5-${product.id}" class="category-column"></div>
                                            </div>

                                            <button id="scrollRightBtn-${product.id}" type="button"
                                                    style="position:absolute; right:0; top:50%; transform:translateY(-50%); z-index:2;
                                                        background-color:#fff; border:1px solid #ccc; border-radius:4px;
                                                        display:none; cursor:pointer;">
                                                ›
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="description-${product.id}" class="tab-content" style="flex-direction: column;">
                    <div id="editor-container-${product.id}" class="editor-container"></div>
                </div>

                <div id="variants-${product.id}" class="tab-content">
                    <table class="variants-table">
                        <thead>
                            <tr>   
                                <th>Image</th>
                                <th>Color</th>
                                <th>Size</th>
                                <th>Price</th>
                                <th>List price</th>
                                <th>Currency</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${product.skus.map(sku => `
                                <tr>
                                    <td><img src="${sku.uri}" alt="Variant Image" class="variant-image" /></td>
                                    <td>${sku.color}</td>
                                    <td>${sku.size}</td>
                                    <td>${sku.price}</td>
                                    <td>${sku.list_price}</td>
                                    <td>${sku.currency}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div id="images-${product.id}" class="tab-content">
                    <div class="image-gallery">
                        ${product.images.map(image => `
                            <div class="image-item">
                                <label for="image${image.id}-${product.id}">
                                    <img src="${image.uri}" alt="Image ${image.id}" class="variant-image">
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
            </div>
            <div class="product-actions">
                <button class="action-button remove-button" data-product-id="${product.id}">Remove Product</button>
                <div class="action-right">
                    <button class="action-button">Save</button>
                    <button class="action-button">Push To Store</button>
                </div>
            </div>
        `;
        const removeButton = productElement.querySelector('.remove-button');
        removeButton.addEventListener('click', () => {
            const productId = removeButton.getAttribute('data-product-id');
            deleteProduct(productId);
        });

        // Thêm sản phẩm vào danh sách sản phẩm
        productListContainer.appendChild(productElement);
        
        // Khởi tạo Quill cho mỗi editor container của sản phẩm
        const editorContainer = document.querySelector(`#editor-container-${product.id}`);
        if (editorContainer) {
            const quill = new Quill(editorContainer, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['bold', 'italic', 'underline'],
                        ['link'],
                        [{ 'align': [] }],
                        ['clean']
                    ]
                }
            });
        if(product.description){
            const converdata = convertToHTML(product.description);
            quill.clipboard.dangerouslyPasteHTML(converdata);
        }
  
        }

        // Thêm sự kiện cho các tab
        const tabProductIds = ["product", "description", "variants", "images"];
        tabProductIds.forEach(tabName => {
            document.querySelector(`#${tabName}-tab-${product.id}`).addEventListener("click", () => showTabProduct(tabName, productElement));
        });
    });
    initializeCategorySelect()
}
function initializeCategorySelect() {
    const categoryData = window.categoryData || [];
    console.log(categoryData)
    const productElements = document.querySelectorAll('.list-products > .products-container');
    productElements.forEach(productElement => {
        const productId = productElement.getAttribute('id-ctn-product');
        const fakeSelect = document.getElementById(`fakeSelect-${productId}`);
        const fakeSelectText = document.getElementById(`fakeSelectText-${productId}`);
        const megaMenu = document.getElementById(`megaMenu-${productId}`);
        const breadcrumbText = document.getElementById(`breadcrumbText-${productId}`);

        const colLevel1 = document.getElementById(`colLevel1-${productId}`);
        const colLevel2 = document.getElementById(`colLevel2-${productId}`);
        const colLevel3 = document.getElementById(`colLevel3-${productId}`);
        const colLevel4 = document.getElementById(`colLevel4-${productId}`);
        const colLevel5 = document.getElementById(`colLevel5-${productId}`);

        const columnsWrapper = document.getElementById(`columnsWrapper-${productId}`);
        const scrollLeftBtn = document.getElementById(`scrollLeftBtn-${productId}`);
        const scrollRightBtn = document.getElementById(`scrollRightBtn-${productId}`);

        const categorySelect = document.getElementById(`categorySelect-${productId}`);
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        fakeSelect.addEventListener("click", function() {
          // Cập nhật lại giá trị trong fakeSelect
          const selectedCategory = fakeSelectText.textContent; // Lấy tên category đã chọn
          categorySelect.value = selectedCategory; // Gán giá trị vào input ẩn
        });
        let currentPath = [];
        // Hiện menu
        function showMenu() {
          megaMenu.style.display = "block";
          // Reset các cột và breadcrumb
          currentPath = [];
          breadcrumbText.textContent = "All Categories";
          renderLevel(colLevel1, categoryData.categories, 1);
          colLevel2.innerHTML = "";
          colLevel3.innerHTML = "";
          colLevel4.innerHTML = "";
          colLevel5.innerHTML = "";
          updateScrollButtons();
        }
      
        // Ẩn menu
        function hideMenu() {
          megaMenu.style.display = "none";
        }
      
        // Toggle menu khi click vào fakeSelect
        fakeSelect.addEventListener("click", function(e) {
          e.stopPropagation();
          if (megaMenu.style.display === "block") {
            hideMenu();
          } else {
            showMenu();
          }
        });
      
        // Click ra ngoài fakeSelect ẩn menu
        document.addEventListener("click", function(e) {
          if (!fakeSelect.contains(e.target)) {
            hideMenu();
          }
        });
      
        /**
         * Hàm cuộn đến cột tương ứng (auto scroll)
         * level: 1..5
         */
        function scrollToColumn(level) {
          let target;
          if (level === 3) target = colLevel1;
          else if (level === 4) target = colLevel4;
          else if (level === 5) target = colLevel5;
      
          if (target) {
            // Cuộn columnsWrapper đến vị trí của target
            columnsWrapper.scrollLeft = target.offsetLeft;
          }
        }
      
        // Hàm render danh mục theo cấp
        function renderLevel(container, categories, level) {
          container.innerHTML = "";
          if (!categories || categories.length === 0) {
            container.innerHTML = "<div class='text-muted'>No categories</div>";
            return;
          }
          categories.forEach(cat => {
            const div = document.createElement("div");
            div.className = "category-item";
            // Hiển thị tên, sử dụng key "local_name" hoặc "name" nếu có
            div.textContent = cat.local_name || cat.name || "Category";
      
            if (cat.children && cat.children.length > 0) {
              div.classList.add("has-children");
            }
      
            div.addEventListener("click", function(ev) {
              ev.stopPropagation();
      
              // Xóa class "selected" khỏi tất cả các phần tử cùng cột
              const siblings = container.querySelectorAll(".category-item");
              siblings.forEach(item => item.classList.remove("selected"));
              div.classList.add("selected");
      
              // Cập nhật currentPath và reset nội dung của các cột bên phải tùy theo cấp
              if (level === 1) {
                colLevel2.innerHTML = "";
                colLevel3.innerHTML = "";
                colLevel4.innerHTML = "";
                colLevel5.innerHTML = "";
                currentPath = [cat.local_name || cat.name];
              } else if (level === 2) {
                colLevel3.innerHTML = "";
                colLevel4.innerHTML = "";
                colLevel5.innerHTML = "";
                currentPath = [currentPath[0], cat.local_name || cat.name];
              } else if (level === 3) {
                colLevel4.innerHTML = "";
                colLevel5.innerHTML = "";
                currentPath = [currentPath[0], currentPath[1], cat.local_name || cat.name];
              } else if (level === 4) {
                colLevel5.innerHTML = "";
                currentPath = [currentPath[0], currentPath[1], currentPath[2], cat.local_name || cat.name];
              } else if (level === 5) {
                currentPath[4] = cat.local_name || cat.name;
              }
      
              // Cập nhật breadcrumb
              breadcrumbText.textContent = "All Categories > " + currentPath.join(" > ");
      
              if (cat.children && cat.children.length > 0) {
                // Nếu có children, render cột tiếp theo và tự động cuộn đến cột đó
                if (level === 1) {
                  renderLevel(colLevel2, cat.children, 2);
                  scrollToColumn(2);
                } else if (level === 2) {
                  renderLevel(colLevel3, cat.children, 3);
                  scrollToColumn(3);
                } else if (level === 3) {
                  renderLevel(colLevel4, cat.children, 4);
                  scrollToColumn(4);  // Đảm bảo khi ở cột 3, cột 4 tự động cuộn vào view
                } else if (level === 4) {
                  renderLevel(colLevel5, cat.children, 5);
                  scrollToColumn(5);
                }
                // Không cập nhật hidden input vì danh mục chưa phải leaf
              } else {
                // Nếu không có children => leaf category, cập nhật hidden input
                // Ở sự kiện click của div category-item
                fakeSelectText.textContent = currentPath.join(" > ");
                categorySelect.value = String(cat.cat_id);
                console.log(cat.cat_id)
                categorySelect.dispatchEvent(new Event("change"));
                hideMenu();
              }
      
              updateScrollButtons();
            });
      
      
            container.appendChild(div);
          });
        }
      
        // Hàm cập nhật nút cuộn nếu cần
        function updateScrollButtons() {
          if (columnsWrapper.scrollWidth > columnsWrapper.clientWidth) {
            scrollLeftBtn.style.display = (columnsWrapper.scrollLeft > 0) ? "inline-block" : "none";
            scrollRightBtn.style.display = (columnsWrapper.scrollLeft + columnsWrapper.clientWidth < columnsWrapper.scrollWidth) ? "inline-block" : "none";
          } else {
            scrollLeftBtn.style.display = "none";
            scrollRightBtn.style.display = "none";
          }
        }
      
        columnsWrapper.addEventListener("scroll", updateScrollButtons);
      
        scrollLeftBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          columnsWrapper.scrollLeft -= 150;
        });
      
        scrollRightBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          columnsWrapper.scrollLeft += 150;
        });
      
        // Get the error message container
        // const categoryErrorMessage = document.querySelector(".text-danger");
      
        // // Listen for changes on the category select input (Select2)
        // $(`#categorySelect-${productId}`).on('change', function() {
        //   // If a valid value is selected, hide the error message
        //   if (categorySelect.value) {
        //     categoryErrorMessage.style.display = 'none';
        //   } else {
        //     // If no value is selected, show the error message
        //     categoryErrorMessage.style.display = 'block';
        //   }
        // });
    })
}
function showTabProduct(tabName, productElement) {
    const tabs = productElement.querySelectorAll('.tab');
    const contents = productElement.querySelectorAll('.tab-content');

    // Ẩn tất cả các tab và nội dung
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    // Hiển thị nội dung của tab và đánh dấu tab là active
    productElement.querySelector(`#${tabName}-${productElement.getAttribute('id-ctn-product')}`).classList.add('active');
    productElement.querySelector(`#${tabName}-${productElement.getAttribute('id-ctn-product')}`).classList.add('active');
}
// Tạo danh sách các số trang
function generatePageNumbers() {
    const pageListContainer = document.getElementById('page-list');
    pageListContainer.innerHTML = '';  // Xóa các số trang cũ

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.classList.add('page-button');
        if (i === currentPage) {
            pageButton.classList.add('active');
        }

        pageButton.addEventListener('click', () => {
            currentPage = i;
            fetchProducts(currentPage);  // Gọi lại API khi nhấn vào số trang
        });

        pageListContainer.appendChild(pageButton);
    }
}

// Xử lý sự kiện khi nhấn vào các nút phân trang
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchProducts(currentPage);
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        fetchProducts(currentPage);
    }
});

// Tải sản phẩm khi trang được tải

window.onload = () => {
    fetchCategoryData()
    fetchProducts(currentPage)
};

async function deleteProduct(productId) {
    const { accessToken } = await chrome.storage.local.get('accessToken');
    try {
        const response = await fetch(`http://localhost:8000/api/ex/product/delete/${productId}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // Thêm access token nếu cần
                'Authorization': `Bearer ${accessToken}`,
            }
        });

        if (response.ok) {
            // Nếu xóa thành công, xóa sản phẩm khỏi giao diện
            const productElement = document.querySelector(`[id-ctn-product='${productId}']`);
            if (productElement) {
                productElement.remove();
            }
            alert('Product removed successfully');
        } else {
            alert('Failed to delete the product');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while deleting the product');
    }
}