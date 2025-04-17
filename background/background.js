chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let productData = [];
    if (message.action === "openTab") {
        // Mở tab mới cho sản phẩm
        chrome.tabs.create({ url: message.url }, function (tab) {
            chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
                if (changeInfo.status === 'complete') {
                    // Sau khi tab hoàn thành, thực thi mã để lấy dữ liệu sản phẩm
                    chrome.tabs.executeScript(tabId, {
                        code: 'scrapeProductData();'  // Hàm scrapeProductData() trong tab
                    }, function(result) {
                        if (result && result[0]) {
                            productData.push(result[0]); // In dữ liệu thu thập từ tab
                        }
                        chrome.tabs.remove(tabId, () => {
                            console.log(`Tab with ID: ${tabId} has been closed.`);
                        });
                    });
                }
            });
        });
    }
    console.log(productData)
});
async function scrapeProductData() {
    let mainImgurl
    let titleProduct
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
        titleProduct = pdprightWrap.querySelector('[class^="title--wrap"]').textContent
        for (let index = 0; index < ItemVariants.length; index++) {
            const item = ItemVariants[index];
            await new Promise(resolve => {
                item.click()
                setTimeout(() => {
                    const price = pdprightWrap.querySelector('[class^="price--currentPriceText"]').textContent;
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
                        price: price ? price.trim() : 'N/A',
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
        mainImg : mainImgurl,
        thumbnailImg : thumbnailImages,
        variants : variantsData
    }
}