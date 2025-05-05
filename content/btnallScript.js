let htmlTemplate = `<div class="import-button-container">
    <button class="import-button" style="display: flex; gap: 5px;">
     <div class="spinner-border spinner-border-sm" role="status" style="display: none;"></div> <div> Import all products</div>
    </button>
</div>`;
let link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = chrome.runtime.getURL('css/btnallScript.css');
window.onload = async() => {
    const wrapperObject = document.querySelector("#root");
    console.log(wrapperObject);
    
    if (wrapperObject !== null) {
        // Sử dụng insertAdjacentHTML để thêm HTML vào cuối phần tử một cách an toàn
        wrapperObject.insertAdjacentHTML('beforeend', htmlTemplate);
        
        // Lắng nghe sự kiện click để thực hiện logic lấy dữ liệu sản phẩm
        const importButton = wrapperObject.querySelector(".import-button");
        const { accessToken } = await chrome.storage.local.get('accessToken');
        const { refreshToken } = await chrome.storage.local.get('refreshToken');
        importButton.addEventListener("click",async () => {
            if (!refreshToken) {
                alert(' Vui lòng đăng nhập.');
                return; 
            }
            if(isAccessTokenExpired(accessToken)){
                await refreshAccessToken();
            }
            importButton.classList.add('loading')
            loadingContainer.style.display = "block";
        });
    }
};
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
// async function scrapeProductsData() {
//     const productLinks = document.querySelectorAll('.hm_bl a');  // Các link sản phẩm

//     // Gửi yêu cầu mở các tab mới cho từng sản phẩm
//     productLinks.forEach((link) => {
//         chrome.runtime.sendMessage({
//             action: "openTab",  // Gửi yêu cầu mở tab mới
//             url: link.href
//         });
//     });
// }
