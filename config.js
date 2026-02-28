// ITAPLA Configuration
// Google Cloud Console で取得した OAuth Client ID をここに設定してください。
// 手順: https://console.cloud.google.com/ → APIとサービス → 認証情報 → OAuth 2.0 クライアントID

const ITAPLA_CONFIG = {
    // Google OAuth 2.0 Client ID (ウェブアプリケーション用)
    GOOGLE_CLIENT_ID: "1008638883751-iimut7s3iv3g5gga6hgicvp2olo8oqoj.apps.googleusercontent.com",

    // Gemini API の OAuth スコープ
    GOOGLE_SCOPES: "https://www.googleapis.com/auth/generative-language.retriever",

    // Gemini API Model
    GEMINI_MODEL: "gemini-1.5-flash"
};
