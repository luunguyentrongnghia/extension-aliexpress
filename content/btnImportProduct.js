let htmlTemplate = `<div class="import-button-container">
    <button class="import-button" style="display: flex; gap: 5px;">
     <div class="spinner-border spinner-border-sm" role="status" style="display: none;"></div> <div>Import products</div></button>
</div>`;
let link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = chrome.runtime.getURL('css/btnallScript.css');
const manifest = chrome.runtime.getManifest();
const apiUrl = manifest.api_url;
window.onload = async() => {
    const wrapperObject = document.querySelector("#root");
    
    if (wrapperObject !== null) {
        wrapperObject.insertAdjacentHTML('beforeend', htmlTemplate);
        const importButton = wrapperObject.querySelector(".import-button");
        const { accessToken } = await chrome.storage.local.get('accessToken');
        const { refreshToken } = await chrome.storage.local.get('refreshToken');
        const loadingContainer = wrapperObject.querySelector(".spinner-border");
        importButton.addEventListener("click", async() => {
            if (!refreshToken) {
                alert(' Vui lòng đăng nhập.');
                return; 
            }
            if(isAccessTokenExpired(accessToken)){
                await refreshAccessToken();
            }
            importButton.classList.add('loading')
            loadingContainer.style.display = "block";
            try {
                const productData = await scrapeProductData();
                console.log(productData);
                const result=await sendProductDataToAPI(productData);
                if(result){
                  alert('Thành công.');
                }
            } catch (error) {
                console.error('Error importing products:', error);
                alert('Đã xảy ra lỗi.');
            } finally {
                loadingContainer.style.display = "none";
                importButton.classList.remove('loading')
            }
        });
    }
};


function cartesian(arrays) {
  return arrays.reduce((a, b) =>
    a.flatMap(x => b.map(y => x.concat(y))),
    [[]]
  );
}
function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}
  async function downloadImage(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return blob;
}
function convertImageToJPEG(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
  
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((newBlob) => {
          resolve(newBlob);
          URL.revokeObjectURL(url); 
        }, 'image/jpeg'); 
      };
  
      img.onerror = function() {
        reject('Image conversion failed');
        URL.revokeObjectURL(url);
      };
  
      img.src = url;
    });
  }
function modifyImageUrl(url) {
    return url.replace(/(\d+)x(\d+)/, '960x960');
}
async function scrapeProductData() {
    let titleProduct
    let thumbnailImages = []
    let variantsData = [];
    let description;
    window.scrollTo(0, document.documentElement.scrollHeight);
    await wait(1000);
    const pdpLeftWrap = document.querySelector('.pdp-info-left');
    const pdprightWrap = document.querySelector('.pdp-info-right');
    const divCurrency = document.querySelector('[class^="ship-to--text"]');
    const currency = divCurrency
    ? divCurrency.querySelector('b').textContent.trim()
    : null;
    const ctnDescription = document.querySelector('[data-pl="product-description"]');
    if(ctnDescription){
      ctnDescription.querySelectorAll('img').forEach(img => img.remove());
      description = ctnDescription.innerHTML;
    }
    if (pdpLeftWrap) {
        const thumbnailImg = pdpLeftWrap.querySelectorAll('[class^="slider--img"]');
        if(thumbnailImg.length){
             for (let i = 0; i < thumbnailImg.length && i < 9; i++) {
                const ctnimg = thumbnailImg[i];
                const imgSrc = ctnimg.querySelector('img').getAttribute('src');
                const modifiedUrl = modifyImageUrl(imgSrc);
                try {
                  const imageBlob = await downloadImage(modifiedUrl);  
                  const response = await uploadImageToTikTok(imageBlob); 
                  if (response && response.url) {
                    thumbnailImages.push({
                      url: response.url,
                      uri: response.uri,
                      display_order: i 
                    });
                  } else {
                    console.error('Failed to upload image');
                  }
                } catch (error) {
                  console.error('Error uploading image:', error);
                }
              }
        }
    }
    if(pdprightWrap){
        const ctnVariants = pdprightWrap.querySelector('[class^="sku-item--wrap"]');
        titleProduct = pdprightWrap.querySelector('[class^="title--wrap"]').textContent
       if(ctnVariants){
         const propContainers = Array.from(
            ctnVariants.querySelectorAll('[class^="sku-item--property"]')
        );
        const groups = propContainers.map(prop => {
        const titleSpan = prop.querySelector('[class^="sku-item--title"] > span');
        const raw = titleSpan.childNodes[0].textContent;
        const name = raw.replace(/["]/g,'').replace(':','').trim().toLowerCase();
        const items = Array.from(
            prop.querySelectorAll('[class^="sku-item--skus"] > div')
        );
        return { name, items,propElem: prop };
        });
        const combos = cartesian(groups.map(g => g.items));
        for (const combo of combos) {
        groups.forEach(g => g.items.forEach(i => i.classList.remove('active')));
        for (const optionElem of combo) {
          optionElem.click();
          // await wait(500);
        }

        await wait(500);
        const priceEl = pdprightWrap.querySelector('.product-price');
        const price = priceEl 
            ? parseFloat(priceEl.textContent.replace(/[^\d.]/g, '')) 
            : null;
        const listEl = pdprightWrap.querySelector('[class^="price--originalText"]');
        const list_price = listEl
              ? parseFloat(listEl.textContent.replace(/[^\d.]/g, ''))
              : price;
        const ctnquantity = document.querySelector('[class^="quantity--info"] span');
        const quantity = ctnquantity ? Number(ctnquantity.textContent.match(/\d+/)) : 1;
        const rec = { price ,  list_price,currency,quantity};
        groups.forEach(({ name, propElem }) => {
        const sel = propElem.querySelector('[class^="sku-item--title"] > span span');
        rec[name] = sel ? sel.textContent.trim() : null;
        });

        variantsData.push(rec);
        }
       }else{
        const priceEl = pdprightWrap.querySelector('.product-price');
        const price = priceEl 
            ? parseFloat(priceEl.textContent.replace(/[^\d.]/g, '')) 
            : null;
        const listEl = pdprightWrap.querySelector('[class^="price--originalText"]');
        const list_price = listEl
              ? parseFloat(listEl.textContent.replace(/[^\d.]/g, ''))
              : price;
        const ctnquantity = document.querySelector('[class^="quantity--info"] span');
        const quantity = ctnquantity ? Number(ctnquantity.textContent.match(/\d+/)) : 1;
        variantsData.push({
                price,
                list_price,
                currency,
                quantity
              });
       }
    }
    return {
        title : titleProduct,
        description : description,
        thumbnailImg : thumbnailImages,
        variants : variantsData
    }
}
 async function uploadImageToTikTok(file, use_case = 'MAIN_IMAGE') {
    const convertedImage = await convertImageToJPEG(file);
    const formData = new FormData();
    formData.append('data', convertedImage); 
    formData.append('use_case', use_case);
  
    return fetch(`${apiUrl}/app/ecommerce/products/upload_image_to_tiktok/`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
  }
async function sendProductDataToAPI(productData) {
    const accessToken = await chrome.storage.local.get('accessToken'); 
    const url = `${apiUrl}/api/ex/product/`; 

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${accessToken.accessToken}`, 
            },
            body: JSON.stringify(productData),
        });

        if (!response.ok) {
            throw new Error('Failed to add product data to API');
        }

        return true
    } catch (error) {
        console.error('Error sending product data to API:', error);
    }
}
function isAccessTokenExpired(token) {
    try {
        const decoded = jwt_decode(token); 
        const currentTime = Date.now() / 1000; 
        return decoded.exp < currentTime;  
    } catch (error) {
        console.error("Invalid token", error);
        return true; 
    }
}
async function refreshAccessToken() {
    const { refreshToken } = await chrome.storage.local.get('refreshToken');

    const response = await fetch(`${apiUrl}/api/token/refresh/`, {  
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

    return data.access;
}


