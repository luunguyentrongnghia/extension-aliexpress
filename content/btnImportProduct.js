let htmlTemplate = `<div class="import-button-container">
    <button class="import-button" style="display: flex; gap: 5px;">
     <div class="spinner-border spinner-border-sm" role="status" style="display: none;"></div> <div>Import products</div></button>
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
                // const result=await sendProductDataToAPI(productData);
                // if(result){
                // }
                alert('Thành công.');
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
// 2. helper: chờ trang update giá
function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}
const checkRecaptcha = () => {
    const iframe = document.querySelector('iframe[title="reCAPTCHA"]');
    if (!iframe) return null;
    // parse sitekey từ src
    try {
      const url = new URL(iframe.src);
      const sitekey = new URLSearchParams(url.search).get('k');
      return sitekey;
    } catch {
      return null;
    }
  };
async function scrapeProductData() {
    let titleProduct
    let thumbnailImages = []
    let variantsData = [];
    let description;
    window.scrollTo(0, document.documentElement.scrollHeight);
    await wait(1000);
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
        const ctnVariants = pdprightWrap.querySelector('[class^="sku-item--wrap"]');
        titleProduct = pdprightWrap.querySelector('[class^="title--wrap"]').textContent
       if(ctnVariants){
         const propContainers = Array.from(
            ctnVariants.querySelectorAll('[class^="sku-item--property"]')
        );
        const groups = propContainers.map(prop => {
        // Tên nhóm: bỏ dấu ", :, whitespace
        const titleSpan = prop.querySelector('[class^="sku-item--title"] > span');
        const raw = titleSpan.childNodes[0].textContent;
        const name = raw.replace(/["]/g,'').replace(':','').trim().toLowerCase();

        // Mảng các option
        const items = Array.from(
            prop.querySelectorAll('[class^="sku-item--skus"] > div')
        );
        return { name, items,propElem: prop };
        });
        const combos = cartesian(groups.map(g => g.items));
        for (const combo of combos) {
        groups.forEach(g => g.items.forEach(i => i.classList.remove('active')));

        // 5.2. Click lần lượt từng option
        combo.forEach(i => i.click());

        // 5.3. Chờ giá update
        await wait(500);

        // 5.4. Đọc giá mới
        const priceEl = pdprightWrap.querySelector('.product-price');
        const price = priceEl 
            ? parseFloat(priceEl.textContent.replace(/[^\d.]/g, '')) 
            : null;
        const listEl = pdprightWrap.querySelector('[class^="price--originalText"]');
        const list_price = listEl
              ? parseFloat(listEl.textContent.replace(/[^\d.]/g, ''))
              : price;
        // 5.5. Build record variant
        const rec = { price ,  list_price};
        groups.forEach(({ name, propElem }) => {
        // mỗi propElem.querySelector(...) luôn cho giá trị đang chọn
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
        variantsData.push({
                price,
                list_price,
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

        return true
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
const CLIENT_KEY = 'next_d8318c222f2d5e42ea4bcaf0f205a6ec1d';
const SITEKEY    = '6LcSZ0wpAAAAAFfD';
const PAGE_URL   = window.location.href;
async function createTask() {
    const res = await fetch('https://api.nextcaptcha.com/createTask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: CLIENT_KEY,
        task: {
          type: 'RecaptchaV2TaskProxyless',
          websiteURL: PAGE_URL,
          websiteKey: SITEKEY
        }
      })
    });
    const json = await res.json();
    if (json.errorId !== 0) throw new Error(`API tạo task lỗi: ${json.errorDescription}`);
    return json.taskId;
  }
  async function getResult(taskId) {
    while (true) {
      await new Promise(r => setTimeout(r, 5000));  // đợi 5s
      const res = await fetch('https://api.nextcaptcha.com/getTaskResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientKey: CLIENT_KEY, taskId })
      });
      const json = await res.json();
      if (json.errorId !== 0) throw new Error(`API lấy kết quả lỗi: ${json.errorDescription}`);
      if (json.status === 'ready') {
        return json.solution.gRecaptchaResponse;
      }
      // nếu status là "processing", loop tiếp
    }
  }
  async function solveAndSubmit() {
    try {
      const taskId = await createTask();
      console.log('NextCaptcha taskId:', taskId);
  
      const token = await getResult(taskId);
      console.log('NextCaptcha giải xong, token:', token);
  
      // Inject token vào textarea reCAPTCHA v2
      const ta = document.querySelector('textarea[name="g-recaptcha-response"]');
      if (ta) ta.value = token;
  
      // Submit form (hoặc gọi callback nếu site yêu cầu)
      document.querySelector('form').submit();
    } catch (err) {
      console.error(err);
    }
  }
// 2. Tạo observer
const observer = new MutationObserver(async mutations => {
  for (const m of mutations) {
    // a) Node mới được thêm
    if (m.type === 'childList') {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches('div.baxia-dialog.auto')) {
            await wait(1000);
            solveAndSubmit();
            console.log('có capcha')
        }
      }
    }

  }
});

// 3. Khởi động observer trên <body>
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,           // theo dõi luôn attribute trên body (để detect dialog có sẵn)
  attributeFilter: ['style']
});
