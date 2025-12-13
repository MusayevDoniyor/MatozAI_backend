# 📱 Mobile App uchun Google Authentication

Bu hujjat sizning mobile app (React Native, Flutter, yoki native) da Google Auth ni backend bilan qanday ulashni tushuntiradi.

## 🔧 Google Cloud Console Sozlamalari

### 1. Yangi OAuth Client yaratish

1. [Google Cloud Console](https://console.cloud.google.com/) ga kiring
2. **APIs & Services** → **Credentials** ga o'ting
3. **+ CREATE CREDENTIALS** → **OAuth client ID** tanlang

#### Android uchun:

- Application type: **Android**
- Name: `MatozAI Android`
- Package name: `com.yourcompany.matozai` (sizning app package name)
- SHA-1 certificate fingerprint:

  ```bash
  # Debug keystore uchun:
  keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android

  # Release keystore uchun:
  keytool -keystore your-release-key.keystore -list -v -alias your-alias
  ```

#### iOS uchun:

- Application type: **iOS**
- Name: `MatozAI iOS`
- Bundle ID: `com.yourcompany.matozai` (sizning app bundle ID)

### 2. .env faylini yangilash

Backend `.env` fayliga quyidagilarni qo'shing:

```env
# Existing
GOOGLE_CLIENT_ID=your-web-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://your-backend.com/auth/callback/google

# NEW - Mobile client IDs
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
```

## 📲 Mobile App Integration

### React Native (using @react-native-google-signin/google-signin)

```bash
npm install @react-native-google-signin/google-signin
```

```javascript
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Configure on app startup
GoogleSignin.configure({
  webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com", // Web client ID, not Android/iOS
  offlineAccess: true,
});

// Sign in function
async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const { idToken } = await GoogleSignin.getTokens();

    // Send idToken to your backend
    const response = await fetch(
      "https://your-backend.com/auth/google/mobile",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: idToken,
          platform: Platform.OS, // 'android' or 'ios'
        }),
      }
    );

    const data = await response.json();

    // data contains:
    // - user: { id, email, name, createdAt, picture }
    // - accessToken: JWT token for API calls
    // - refreshToken: Token to refresh accessToken

    // Save tokens securely
    await SecureStore.setItemAsync("accessToken", data.accessToken);
    await SecureStore.setItemAsync("refreshToken", data.refreshToken);

    return data;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}
```

### Flutter (using google_sign_in package)

```yaml
# pubspec.yaml
dependencies:
  google_sign_in: ^6.1.0
  http: ^1.1.0
```

```dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: ['email', 'profile'],
  serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
);

Future<Map<String, dynamic>> signInWithGoogle() async {
  try {
    final GoogleSignInAccount? account = await _googleSignIn.signIn();

    if (account == null) {
      throw Exception('Google sign-in cancelled');
    }

    final GoogleSignInAuthentication auth = await account.authentication;
    final String? idToken = auth.idToken;

    if (idToken == null) {
      throw Exception('No ID token received');
    }

    // Send to backend
    final response = await http.post(
      Uri.parse('https://your-backend.com/auth/google/mobile'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'idToken': idToken,
        'platform': Platform.isAndroid ? 'android' : 'ios',
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // Save tokens securely
      // Use flutter_secure_storage package
      return data;
    } else {
      throw Exception('Authentication failed');
    }
  } catch (e) {
    print('Error signing in with Google: $e');
    rethrow;
  }
}
```

### Native Android (Kotlin)

```kotlin
// build.gradle (app)
implementation 'com.google.android.gms:play-services-auth:20.7.0'

// SignInActivity.kt
class SignInActivity : AppCompatActivity() {

    private lateinit var googleSignInClient: GoogleSignInClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken("YOUR_WEB_CLIENT_ID.apps.googleusercontent.com")
            .requestEmail()
            .requestProfile()
            .build()

        googleSignInClient = GoogleSignIn.getClient(this, gso)
    }

    private fun signIn() {
        val signInIntent = googleSignInClient.signInIntent
        startActivityForResult(signInIntent, RC_SIGN_IN)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        if (requestCode == RC_SIGN_IN) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            handleSignInResult(task)
        }
    }

    private fun handleSignInResult(completedTask: Task<GoogleSignInAccount>) {
        try {
            val account = completedTask.getResult(ApiException::class.java)
            val idToken = account.idToken

            // Send to backend
            sendTokenToBackend(idToken)
        } catch (e: ApiException) {
            Log.e("SignIn", "signInResult:failed code=" + e.statusCode)
        }
    }

    private fun sendTokenToBackend(idToken: String?) {
        // Use Retrofit or OkHttp to POST to /auth/google/mobile
        val json = JSONObject()
        json.put("idToken", idToken)
        json.put("platform", "android")

        // Make API call...
    }

    companion object {
        const val RC_SIGN_IN = 9001
    }
}
```

## 🔐 API Endpoint

### POST /auth/google/mobile

Mobile app bu endpoint ga request yuboradi.

**Request:**

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ...",
  "platform": "android" // optional: "android" | "ios"
}
```

**Response (Success - 200):**

```json
{
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "name": "John Doe",
    "createdAt": "2024-12-13T10:00:00.000Z",
    "picture": "https://lh3.googleusercontent.com/..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error - 401):**

```json
{
  "statusCode": 401,
  "message": "Invalid Google token"
}
```

## 🔄 Token Refresh

Access token muddati tugaganda (odatda 15 daqiqa), refresh token ishlatiladi:

### POST /auth/refresh

**Request:**

```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response:**

```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

## 📋 Checklist

- [ ] Google Cloud Console da Android/iOS OAuth client yaratildi
- [ ] Backend `.env` ga `GOOGLE_ANDROID_CLIENT_ID` va `GOOGLE_IOS_CLIENT_ID` qo'shildi
- [ ] Mobile app da Google Sign-In SDK o'rnatildi
- [ ] `serverClientId` / `webClientId` to'g'ri sozlandi (Web Client ID ishlatiladi!)
- [ ] Backend URL to'g'ri (`/auth/google/mobile` endpoint)
- [ ] Token secure storage da saqlanmoqda

## ⚠️ Muhim Eslatmalar

1. **Web Client ID:** Mobile SDK larda ham Web Client ID ishlatiladi (`serverClientId` yoki `webClientId` parametr sifatida). Android/iOS client ID faqat platform-specific signing uchun kerak.

2. **Debug vs Release:** Development da debug keystore SHA-1 ni qo'shing. Production uchun release keystore SHA-1 ni alohida OAuth client yaratib qo'shing.

3. **Token Security:** `accessToken` va `refreshToken` larni secure storage da saqlang:

   - React Native: `expo-secure-store` yoki `react-native-keychain`
   - Flutter: `flutter_secure_storage`
   - Native Android: `EncryptedSharedPreferences`
   - Native iOS: `Keychain`

4. **Error Handling:** Token expired bo'lganda 401 error kelsa, refresh qiling. Refresh ham ishlamasa, qayta sign-in talab qiling.
