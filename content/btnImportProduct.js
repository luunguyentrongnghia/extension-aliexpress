let htmlTemplate = `<div class="import-button-container">
    <button class="import-button">Import products</button>
</div>`;
let link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = chrome.runtime.getURL('css/btnallScript.css');
window.onload = () => {
    const wrapperObject = document.querySelector("#root");
    console.log(wrapperObject);
    
    if (wrapperObject !== null) {
        // Sử dụng insertAdjacentHTML để thêm HTML vào cuối phần tử một cách an toàn
        wrapperObject.insertAdjacentHTML('beforeend', htmlTemplate);
        
        // Lắng nghe sự kiện click để thực hiện logic lấy dữ liệu sản phẩm
        const importButton = wrapperObject.querySelector(".import-button");
        importButton.addEventListener("click", () => {
            console.log("Fetching product data...");
            scrapeProductData();
        });
    }
};


async function scrapeProductData() {
    let mainImgurl
    let thumbnailImages = []
    let variantsData = [];
    const pdpLeftWrap = document.querySelector('.pdp-info-left');
    const pdprightWrap = document.querySelector('.pdp-info-right');
    if (pdpLeftWrap) {
        const mainImg = pdpLeftWrap.querySelector('[class^="magnifier--image"]');
        const thumbnailImg = pdpLeftWrap.querySelectorAll('[class^="slider--img"]');
        if (mainImg) {
            mainImgurl = mainImg.src
        }
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
        for (let index = 0; index < ItemVariants.length; index++) {
            const item = ItemVariants[index];
            await new Promise(resolve => {
                setTimeout(() => {
                    const price = pdprightWrap.querySelector('[class^="price--currentPriceText"]').textContent;
                    let imgVariant = item.querySelector('img').src;
                    let ctnSizeVariant =pdprightWrap.querySelector('[class^="sku-item--box"]');
                    let sizeVariants = []
                    if(ctnSizeVariant){
                        
                    }
                    // Đẩy dữ liệu vào mảng
                    variantsData.push({
                        img: imgVariant,
                        price: price ? price.trim() : 'N/A',
                    });
                    
                    resolve(); 
                })
            }, 1000 * index)
        }
    }
    console.log(variantsData);
}