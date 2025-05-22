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
                if(isAccessTokenExpired(accessToken)){
                await refreshAccessToken();
                }
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
  const normalize = str => (str || '').trim().toLowerCase();
  const waitTime = ms => new Promise(res => setTimeout(res, ms));
  const safeText = el => el?.textContent?.trim() || '';

  let titleProduct = '';
  let thumbnailImages = [];
  let variantsData = [];
  let description = '';

  window.scrollTo(0, document.documentElement.scrollHeight);
  await waitTime(1000);

  const pdpLeftWrap = document.querySelector('.pdp-info-left');
  const pdprightWrap = document.querySelector('.pdp-info-right');
  const currency = document.querySelector('[class^="ship-to--text"] b')?.textContent.trim() || null;

  // Lấy mô tả sản phẩm
  const ctnDescription = document.querySelector('[data-pl="product-description"]');
  if (ctnDescription) {
    ctnDescription.querySelectorAll('img, a[href], iframe[src], script, video[src]').forEach(el => el.remove());
    description = ctnDescription.innerHTML;
  }

  // Hàm tải và upload ảnh
  async function handleImageUpload(imgSrc) {
    try {
      const modifiedUrl = modifyImageUrl(imgSrc);
      const blob = await downloadImage(modifiedUrl);
      const uploaded = await uploadImageToTikTok(blob);
      return uploaded?.url && uploaded?.uri ? uploaded : null;
    } catch (err) {
      console.error('Image upload error:', err);
      return null;
    }
  }

  // Ảnh thumbnail chính
  if (pdpLeftWrap) {
    const thumbnailImg = pdpLeftWrap.querySelectorAll('[class^="slider--img"]');
    const tasks = Array.from(thumbnailImg).slice(0, 9).map(async (imgEl, i) => {
      const src = imgEl?.querySelector('img')?.getAttribute('src');
      if (!src) return null;
      const result = await handleImageUpload(src);
      return result ? { ...result, display_order: i } : null;
    });
    thumbnailImages = (await Promise.all(tasks)).filter(Boolean);
  }

  // Xử lý biến thể
  if (pdprightWrap) {
    titleProduct = safeText(pdprightWrap.querySelector('[class^="title--wrap"]'));

    const ctnVariants = pdprightWrap.querySelector('[class^="sku-item--wrap"]');
    if (ctnVariants) {
      const groups = Array.from(ctnVariants.querySelectorAll('[class^="sku-item--property"]')).map(prop => ({
        name: normalize(prop.querySelector('[class^="sku-item--title"] > span')?.childNodes[0]?.textContent || ''),
        items: Array.from(prop.querySelectorAll('[class^="sku-item--skus"] > div')),
        propElem: prop
      }));

      const colorImageMap = {};
      const firstGroup = groups[0];

      // Upload ảnh biến thể đầu tiên (thường là màu)
      const colorTasks = firstGroup.items.map(async item => {
        const img = item.querySelector('img');
        if (!img) return null;
        const result = await handleImageUpload(img.getAttribute('src'));
        const label = normalize(img.getAttribute('alt'));
        return result ? { label, ...result } : null;
      });
      const colorResults = await Promise.all(colorTasks);
      colorResults.forEach(r => {
        if (r) colorImageMap[r.label] = { uri: r.uri, url: r.url };
      });

      const combos = cartesian(groups.map(g => g.items));
      for (const combo of combos) {
        groups.forEach(g => g.items.forEach(i => i.classList.remove('active')));
        combo.forEach(opt => opt.click());
        await waitTime(50);

        const price = parseFloat(pdprightWrap.querySelector('.product-price')?.textContent.replace(/[^\d.]/g, '')) || null;
        const list_price = parseFloat(pdprightWrap.querySelector('[class^="price--originalText"]')?.textContent.replace(/[^\d.]/g, '')) || price;
        const quantity = parseInt(document.querySelector('[class^="quantity--info"] span')?.textContent.match(/\d+/)?.[0]) || 1;

        const rec = { price: list_price, list_price, currency, quantity };
        groups.forEach(({ name, propElem }) => {
          rec[name] = safeText(propElem.querySelector('[class^="sku-item--title"] > span span'));
        });

        const mainLabel = normalize(rec[firstGroup.name]);
        if (mainLabel && colorImageMap[mainLabel]) {
          rec.primary_image = colorImageMap[mainLabel];
        }

        variantsData.push(rec);
      }
    } else {
      // Sản phẩm không có biến thể
      const price = parseFloat(pdprightWrap.querySelector('.product-price')?.textContent.replace(/[^\d.]/g, '')) || null;
      const list_price = parseFloat(pdprightWrap.querySelector('[class^="price--originalText"]')?.textContent.replace(/[^\d.]/g, '')) || price;
      const quantity = parseInt(document.querySelector('[class^="quantity--info"] span')?.textContent.match(/\d+/)?.[0]) || 1;

      variantsData.push({ price: list_price, list_price, currency, quantity });
    }
  }

  return {
    title: titleProduct,
    description,
    thumbnailImg: thumbnailImages,
    variants: variantsData,
  };
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


