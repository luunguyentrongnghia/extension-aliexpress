
// // Giải mã JWT để kiểm tra thời gian hết hạn
// function isAccessTokenExpired(token) {
//     try {
//         const decoded = jwt_decode(token);  // Giải mã token
//         const currentTime = Date.now() / 1000;  // Thời gian hiện tại tính bằng giây (epoch)
//         return decoded.exp < currentTime;  // Kiểm tra nếu token đã hết hạn
//     } catch (error) {
//         console.error("Invalid token", error);
//         return true;  // Nếu token không hợp lệ, coi như đã hết hạn
//     }
// }
// // Hàm làm mới access token sử dụng refresh token
// async function refreshAccessToken() {
//     const { refreshToken } = await chrome.storage.local.get('refreshToken');  // Lấy refresh token từ storage

//     const response = await fetch('http://localhost:8000/api/token/refresh/', {  // Gọi API refresh token
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             refresh: refreshToken
//         })
//     });

//     if (!response.ok) {
//         throw new Error('Failed to refresh token');
//     }

//     const data = await response.json();
//     await chrome.storage.local.set({
//         accessToken: data.access,
//         refreshToken: data.refresh
//     });

//     return data.access;  // Trả về access token mới
// }
// Hàm gọi API với kiểm tra token
// async function callApiWithTokenCheck(apiUrl, options = {}) {
//     const { accessToken } = await chrome.storage.local.get('accessToken');  // Lấy access token từ storage

//     // Kiểm tra nếu token hết hạn
//     if (isAccessTokenExpired(accessToken)) {
//         console.log('Access token expired. Refreshing token...');
//         // Nếu hết hạn, làm mới access token
//         const newAccessToken = await refreshAccessToken();
//         console.log('New Access Token:', newAccessToken);
//     }

//     // Sau khi có token mới (hoặc token cũ còn hạn), gọi API
//     const response = await fetch(apiUrl, {
//         ...options,
//         headers: {
//             ...options.headers,
//             'Authorization': `Bearer ${accessToken}`,  // Thêm access token vào header
//         }
//     });

//     if (!response.ok) {
//         throw new Error('Failed to fetch API');
//     }

//     return response.json();  // Trả về dữ liệu API
// }
// window.onload = async() => {
//     const { accessToken } = await chrome.storage.local.get('accessToken');
//     console.log('Access Token:', accessToken); 
//     if (isAccessTokenExpired(accessToken)) {
//         chrome.runtime.sendMessage({ action: 'decodeToken', token: accessToken }, (response) => {
//             console.log('Decoded token:', response.decoded);
//         });
//     } else{
//         console.log('Access token is still valid.');
//     }
// }