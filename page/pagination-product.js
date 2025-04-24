let currentPage = 1;
let totalPages = 1;
let limit = 5;  // Số sản phẩm mỗi trang

// Hàm gọi API và load dữ liệu sản phẩm
async function fetchProducts(page) {
    const offset = (page - 1) * limit;
    let { accessToken } = await chrome.storage.local.get('accessToken');
    if(isAccessTokenExpired(accessToken)){
        accessToken = await refreshAccessToken();
    }
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/ex/product/?limit=${limit}&offset=${offset}`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}` 
        }
        });
        const data = await response.json();
        if (data.products && data.products.length > 0) {
            displayProducts(data.products);  
            totalPages = data.total_pages; 
            generatePageNumbers();  
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
        return true;  
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
async function putProduct(productData,id) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/ex/product/update/${id}/`, {
            method: 'PUT',  // Hoặc PATCH nếu chỉ cập nhật một phần
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
        });
        if (response.ok) {
            Toastify({
                text: "Product updated successfully!",
                backgroundColor: "green",
            }).showToast();
            return true
        } else {
            Toastify({
                text: "Failed to update product",
                backgroundColor: "red",
            }).showToast();
            return true
        }
    } catch (error) {
        console.error('Error updating product:', error);
        return true
    }
}
function convertToHTML(rawString) {
    // Tạo một phần tử tạm thời để gán chuỗi vào
    const tempElement = document.createElement('div');
    tempElement.innerHTML = rawString;  // Gán chuỗi vào phần tử DOM

    // Trả về phần tử HTML đã được chuyển đổi
    return tempElement.innerHTML;  // Hoặc bạn có thể sử dụng tempElement.childNodes nếu cần.
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
                                <tr data-sku-id="${sku.id}">
                                    <td><img src="${sku.uri}" alt="Variant Image" class="variant-image" /></td>
                                    <td>${sku.color}</td>
                                    <td>${sku.size}</td>
                                    <td><input type="number" value="${sku.price}" class="sku-price" data-sku-id="${sku.id}" /></td>
                                    <td><input type="number" value="${sku.list_price}" class="sku-list-price" data-sku-id="${sku.id}" /></td>
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
                                    <img src="${image.uri}" alt="Image ${image.id}" data-image-id="${image.id}"class="variant-image">
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
            </div>
            <div class="product-actions">
                <button class="action-button remove-button" data-product-id="${product.id}"style="display:flex; align-items:center; gap:5px"><div class="spinner-border spinner-border-sm" role="status" style="display: none;"></div><div>Remove Product</div></button>
                <button id='save-btn-${product.id}' class="action-button" style="display:flex; align-items:center; gap:5px"><div class="spinner-border spinner-border-sm" role="status" style="display: none;"></div><div>Save</div></button>
            </div>
        `;
        const removeButton = productElement.querySelector('.remove-button');
        const loadingRemove = removeButton.querySelector('.spinner-border');                  
        removeButton.addEventListener('click',async () => {
            const productId = removeButton.getAttribute('data-product-id');
            removeButton.classList.add('remove-button-loading')
            loadingRemove.style.display = "block";
            await deleteProduct(productId);

          
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
        const btnsave = document.getElementById(`save-btn-${product.id}`);
        const loadingContainer = btnsave.querySelector('.spinner-border');
        document.getElementById(`save-btn-${product.id}`).addEventListener('click',async (e) => {
            const productData = getProductData(productElement);
            console.log(productData);
            btnsave.classList.add('save-btn-loading')
            loadingContainer.style.display = "block";
            if(productData){
                 const response=await putProduct(productData ,product.id)
                if(response){
                    loadingContainer.style.display = "none";
                    btnsave.classList.remove('save-btn-loading')
                }
            }
        })
        }

        // Thêm sự kiện cho các tab
        const tabProductIds = ["product", "description", "variants", "images"];
        tabProductIds.forEach(tabName => {
            document.querySelector(`#${tabName}-tab-${product.id}`).addEventListener("click", () => showTabProduct(tabName, productElement));
        });
    });

}

function getProductData(productElement) {
    const productId = productElement.getAttribute('id-ctn-product');
    
    // Lấy tên sản phẩm và mô tả từ các trường input
    const productName = productElement.querySelector(`#product-${productId} .product-input`).value;
    const productDescription = productElement.querySelector(`#editor-container-${productId} .ql-editor`).innerHTML;  // Quill editor lấy nội dung
    
    // Lấy các SKU
    const skus = [];
    const skuRows = productElement.querySelectorAll(`#variants-${productId} .variants-table tbody tr`);
    skuRows.forEach(row => {
        const sku = {
            id: row.getAttribute('data-sku-id'), // Nếu có id SKU
            price: row.querySelector('td:nth-child(4) input').value,
            list_price: row.querySelector('td:nth-child(5) input').value,
        };
        skus.push(sku);
    });

    // Tạo đối tượng dữ liệu để gửi lên API
    return {
        id: productId,
        title: productName,
        description: productDescription,
        skus: skus,
    };
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
            Toastify({
                text: "Product removed successfully!",
                backgroundColor: "green",
            }).showToast();
        } else {
            Toastify({
                text: "Failed to delete the product",
                backgroundColor: "red",
            }).showToast();
        }
    } catch (error) {
        console.error('Error:', error);
        Toastify({
            text: "An error occurred while deleting the product",
            backgroundColor: "red",
        }).showToast();
    }
}