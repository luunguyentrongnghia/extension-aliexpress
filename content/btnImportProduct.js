let htmlTemplate = `<div class="import-button-container">
    <button class="import-button">Import products</button>
</div>`;
let link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = chrome.runtime.getURL('css/btnallScript.css');
window.onload = async() => {
    const wrapperObject = document.querySelector("#root");
    
    if (wrapperObject !== null) {
        // Sử dụng insertAdjacentHTML để thêm HTML vào cuối phần tử một cách an toàn
        wrapperObject.insertAdjacentHTML('beforeend', htmlTemplate);
        
        // Lắng nghe sự kiện click để thực hiện logic lấy dữ liệu sản phẩm
        const importButton = wrapperObject.querySelector(".import-button");
        const { accessToken } = await chrome.storage.local.get('accessToken');
        const { refreshToken } = await chrome.storage.local.get('refreshToken');
        importButton.addEventListener("click", async() => {
            if (!refreshToken || !await isRefreshTokenValid(refreshToken)) {
                alert(' Vui lòng đăng nhập.');
                return; 
            }
            if(isAccessTokenExpired(accessToken)){
                await refreshAccessToken();
            }
            const productData = await scrapeProductData();
            console.log(productData);
            await sendProductDataToAPI(productData);
            alert('Thành công');
        });
    }
};


async function scrapeProductData() {
    let titleProduct
    let thumbnailImages = []
    let variantsData = [];
    let description;
    const pdpLeftWrap = document.querySelector('.pdp-info-left');
    const pdprightWrap = document.querySelector('.pdp-info-right');
    const ctnDescription = document.querySelector('[data-pl="product-description"]');
    if(ctnDescription){
        description = ctnDescription.innerHTML
    }
    if (pdpLeftWrap) {
        const thumbnailImg = pdpLeftWrap.querySelectorAll('[class^="slider--img"]');
        if(thumbnailImg){
            thumbnailImg.forEach(ctnimg => {
                const imgSrc = ctnimg.querySelector('img').src;
                thumbnailImages.push(imgSrc)
            });
        }
    }
    if(pdprightWrap){
        const ctnVariants = pdprightWrap.querySelector('[class^="extend--wrap"]');
        const ItemVariants = ctnVariants.querySelectorAll('[class*="sku-item--image"]');
        titleProduct = pdprightWrap.querySelector('[class^="title--wrap"]').textContent
        for (let index = 0; index < ItemVariants.length; index++) {
            const item = ItemVariants[index];
            await new Promise(resolve => {
                item.click()
                setTimeout(() => {
                    const ctn_list_price = pdprightWrap.querySelector('[class^="price--originalText"]');
                    let list_price=''
                    let price=''
                    if(ctn_list_price){
                        price = pdprightWrap.querySelector('[class^="price--currentPriceText"]').textContent;
                        list_price = ctn_list_price.textContent
                    }else{
                        price = pdprightWrap.querySelector('[class^="price--currentPriceText"]').textContent;
                        list_price = price
                    }
                    price = price.replace('$', '').trim();
                    list_price = list_price.replace('$', '').trim();
                    price = parseFloat(price);
                    list_price = parseFloat(list_price);
                    const color = pdprightWrap.querySelector('[class^="sku-item--title"] span span').textContent;
                    let imgVariant = item.querySelector('img').src;
                    let ctnSizeVariant =pdprightWrap.querySelectorAll('[class^="sku-item--box"]  [class*="sku-item--text"]');
                    let sizeVariants = []
                    if(ctnSizeVariant){
                        ctnSizeVariant.forEach(ctnSize => {
                            sizeVariants.push(ctnSize.textContent)
                        })
                    }
                    // Đẩy dữ liệu vào mảng
                    variantsData.push({
                        img: imgVariant,
                        price: price ? price: 'N/A',
                        list_price: list_price ? list_price : 'N/A',
                        color: color ? color.trim() : 'N/A',
                        size: sizeVariants
                    });
                    
                    resolve(); 
                })
            }, 1000 * index)
        }
    }
    return {
        title : titleProduct,
        description : description,
        thumbnailImg : thumbnailImages,
        variants : variantsData
    }
}
async function sendProductDataToAPI(productData) {
    const accessToken = await chrome.storage.local.get('accessToken'); 
    const url = 'http://127.0.0.1:8000/api/ex/product/'; 

    try {
        const response = await fetch(url, {
            method: 'POST', // Phương thức gửi dữ liệu
            headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${accessToken.accessToken}`, 
            },
            body: JSON.stringify(productData),
        });

        if (!response.ok) {
            throw new Error('Failed to add product data to API');
        }

        const responseData = await response.json();
        console.log('Product data added successfully:', responseData);
        // Bạn có thể xử lý dữ liệu trả về từ API tại đây
    } catch (error) {
        console.error('Error sending product data to API:', error);
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
// Hàm làm mới access token sử dụng refresh token
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