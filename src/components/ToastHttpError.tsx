import {toast} from "react-toastify";

/**
 * Toast http error
 * @param status http status code
 */
const toastHttpError = (status: number) => {
    const audio = new Audio(require('../assets/sounds/Error.mp3'));
    audio.play();

    switch (status) {
        case 400:
            toast.error("你給的資料我不明白 你肯定沒有錯?")
            break;
        case 404:
            toast.error("這裡不存在任何東西! 你確定去對地方了?")
            break;
        case 403:
            toast.error("你不可以看這個東西!")
            break;
        case 401:
            toast.error("你被登出了! 你需要再一次登入!!")
            break;
        case 500:
            toast.error("我出現問題了! 稍後再試一試")
            break;
        case 504:
            toast.error("網絡出現問題! 檢查一下")
            break;
        case 502:
            toast.error("太多人了! 稍後再試一試")
            break;
        default:
            toast.error("出事啦! 發生了一些不能遇見的錯誤! 不如再試一試?")
    }
}
export {toastHttpError};