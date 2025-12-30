# Integrasi SSO OIDC dengan Laravel 6

Panduan lengkap untuk mengintegrasikan aplikasi Laravel 6 dengan SSO Identity Provider menggunakan protokol OpenID Connect (OIDC).

## Daftar Isi
- [Prasyarat](#prasyarat)
- [Instalasi Package](#instalasi-package)
- [Registrasi Client di SSO](#registrasi-client-di-sso)
- [Konfigurasi Laravel](#konfigurasi-laravel)
- [Implementasi Authentication](#implementasi-authentication)
- [Middleware & Guards](#middleware--guards)
- [Logout](#logout)
- [Troubleshooting](#troubleshooting)

---

## Prasyarat

- Laravel 6.x
- PHP 7.2+
- Aplikasi Laravel sudah berjalan
- Akses ke SSO Admin Dashboard
- SSL/TLS Certificate (untuk production)

---

## Instalasi Package

### 1. Install Laravel Socialite (OIDC Provider)

```bash
composer require socialiteproviders/manager
composer require socialiteproviders/oidc
```

### 2. Update `config/app.php`

Tambahkan service provider:

```php
'providers' => [
    // ...
    \SocialiteProviders\Manager\ServiceProvider::class,
],
```

---

## Registrasi Client di SSO

### 1. Login ke SSO Admin Dashboard

Buka: `https://sso.yourdomain.com/admin/clients`

### 2. Buat Client Baru

Klik "Add Client" dan isi form:

- **Client Name:** `Laravel App - [Nama Aplikasi Anda]`
- **Client ID:** `laravel-app-prod` (catat ini!)
- **Client Secret:** (akan di-generate otomatis - catat ini!)
- **Redirect URIs:** 
  ```
  https://yourapp.com/auth/callback
  http://localhost:8000/auth/callback (untuk development)
  ```
- **Grant Types:** `authorization_code`, `refresh_token`
- **Scopes:** `openid`, `profile`, `email`

### 3. Catat Credentials

Setelah client dibuat, catat:
- Client ID
- Client Secret
- Redirect URI

---

## Konfigurasi Laravel

### 1. Update `.env`

Tambahkan konfigurasi SSO:

```env
# SSO OIDC Configuration
SSO_BASE_URL=https://sso.yourdomain.com
SSO_CLIENT_ID=laravel-app-prod
SSO_CLIENT_SECRET=your-secret-from-sso-admin
SSO_REDIRECT_URI=${APP_URL}/auth/callback

# Optional: Custom scopes
SSO_SCOPES=openid,profile,email
```

### 2. Buat Config File `config/sso.php`

```bash
touch config/sso.php
```

Isi file:

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | SSO OIDC Configuration
    |--------------------------------------------------------------------------
    */
    'base_url' => env('SSO_BASE_URL', 'https://sso.yourdomain.com'),
    'client_id' => env('SSO_CLIENT_ID'),
    'client_secret' => env('SSO_CLIENT_SECRET'),
    'redirect_uri' => env('SSO_REDIRECT_URI'),
    'scopes' => explode(',', env('SSO_SCOPES', 'openid,profile,email')),
    
    /*
    |--------------------------------------------------------------------------
    | Endpoints (auto-configured from base_url)
    |--------------------------------------------------------------------------
    */
    'authorize_url' => env('SSO_BASE_URL') . '/api/oidc/authorize',
    'token_url' => env('SSO_BASE_URL') . '/api/oidc/token',
    'userinfo_url' => env('SSO_BASE_URL') . '/api/oidc/userinfo',
    'logout_url' => env('SSO_BASE_URL') . '/api/oidc/logout',
];
```

### 3. Update `config/services.php`

Tambahkan konfigurasi OIDC provider:

```php
'oidc' => [
    'client_id' => env('SSO_CLIENT_ID'),
    'client_secret' => env('SSO_CLIENT_SECRET'),
    'redirect' => env('SSO_REDIRECT_URI'),
    'auth_base_uri' => env('SSO_BASE_URL') . '/api/oidc',
    'authorize_uri' => '/authorize',
    'token_uri' => '/token',
    'userinfo_uri' => '/userinfo',
    'scopes' => explode(',', env('SSO_SCOPES', 'openid,profile,email')),
],
```

---

## Implementasi Authentication

### 1. Buat Migration untuk Menyimpan SSO User ID

```bash
php artisan make:migration add_sso_fields_to_users_table
```

Edit migration file:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSsoFieldsToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('sso_id')->nullable()->unique()->after('id');
            $table->string('employee_id')->nullable()->index()->after('sso_id');
            $table->string('department')->nullable()->after('email');
            $table->string('position')->nullable()->after('department');
            $table->string('avatar_url')->nullable()->after('position');
            $table->timestamp('last_sso_sync')->nullable();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'sso_id', 
                'employee_id', 
                'department', 
                'position', 
                'avatar_url',
                'last_sso_sync'
            ]);
        });
    }
}
```

Run migration:

```bash
php artisan migrate
```

### 2. Update User Model

Edit `app/User.php`:

```php
<?php

namespace App;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'name', 
        'email', 
        'password',
        'sso_id',
        'employee_id',
        'department',
        'position',
        'avatar_url',
        'last_sso_sync',
    ];

    protected $hidden = [
        'password', 
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_sso_sync' => 'datetime',
    ];

    /**
     * Check if user is synced from SSO
     */
    public function isSSOUser()
    {
        return !empty($this->sso_id);
    }

    /**
     * Get user by SSO ID or create new
     */
    public static function findOrCreateFromSSO($ssoUser)
    {
        $user = static::where('sso_id', $ssoUser->id)
            ->orWhere('email', $ssoUser->email)
            ->first();

        if ($user) {
            // Update existing user with latest SSO data
            $user->update([
                'sso_id' => $ssoUser->id,
                'name' => $ssoUser->name,
                'email' => $ssoUser->email,
                'employee_id' => $ssoUser->employee_id ?? null,
                'department' => $ssoUser->department ?? null,
                'position' => $ssoUser->position ?? null,
                'avatar_url' => $ssoUser->avatar_url ?? null,
                'last_sso_sync' => now(),
            ]);
        } else {
            // Create new user from SSO
            $user = static::create([
                'sso_id' => $ssoUser->id,
                'name' => $ssoUser->name,
                'email' => $ssoUser->email,
                'employee_id' => $ssoUser->employee_id ?? null,
                'department' => $ssoUser->department ?? null,
                'position' => $ssoUser->position ?? null,
                'avatar_url' => $ssoUser->avatar_url ?? null,
                'password' => bcrypt(str_random(32)), // Random password (won't be used)
                'last_sso_sync' => now(),
            ]);
        }

        return $user;
    }
}
```

### 3. Buat Auth Controller

```bash
php artisan make:controller Auth/SSOController
```

Edit `app/Http/Controllers/Auth/SSOController.php`:

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SSOController extends Controller
{
    /**
     * Redirect to SSO login page
     */
    public function redirectToSSO(Request $request)
    {
        $state = Str::random(40);
        $nonce = Str::random(40);
        
        // Store state and nonce in session for verification
        session([
            'sso_state' => $state,
            'sso_nonce' => $nonce,
            'sso_intended' => $request->get('redirect', '/'),
        ]);

        $query = http_build_query([
            'client_id' => config('sso.client_id'),
            'redirect_uri' => config('sso.redirect_uri'),
            'response_type' => 'code',
            'scope' => implode(' ', config('sso.scopes')),
            'state' => $state,
            'nonce' => $nonce,
        ]);

        return redirect(config('sso.authorize_url') . '?' . $query);
    }

    /**
     * Handle SSO callback
     */
    public function handleCallback(Request $request)
    {
        // Verify state to prevent CSRF
        if ($request->state !== session('sso_state')) {
            return redirect('/login')->withErrors(['error' => 'Invalid state parameter']);
        }

        // Check for errors
        if ($request->has('error')) {
            return redirect('/login')->withErrors([
                'error' => $request->error_description ?? $request->error
            ]);
        }

        // Exchange authorization code for tokens
        try {
            $tokenResponse = Http::asForm()->post(config('sso.token_url'), [
                'grant_type' => 'authorization_code',
                'client_id' => config('sso.client_id'),
                'client_secret' => config('sso.client_secret'),
                'redirect_uri' => config('sso.redirect_uri'),
                'code' => $request->code,
            ]);

            if (!$tokenResponse->successful()) {
                throw new \Exception('Failed to exchange authorization code');
            }

            $tokens = $tokenResponse->json();

            // Get user info from SSO
            $userResponse = Http::withToken($tokens['access_token'])
                ->get(config('sso.userinfo_url'));

            if (!$userResponse->successful()) {
                throw new \Exception('Failed to fetch user info');
            }

            $ssoUser = (object) $userResponse->json();

            // Find or create user in local database
            $user = User::findOrCreateFromSSO($ssoUser);

            // Store tokens in session for later use (refresh, logout)
            session([
                'sso_access_token' => $tokens['access_token'],
                'sso_refresh_token' => $tokens['refresh_token'] ?? null,
                'sso_id_token' => $tokens['id_token'] ?? null,
                'sso_expires_at' => now()->addSeconds($tokens['expires_in'] ?? 3600),
            ]);

            // Login the user
            Auth::login($user, true);

            // Redirect to intended page
            $intended = session('sso_intended', '/');
            session()->forget(['sso_state', 'sso_nonce', 'sso_intended']);

            return redirect($intended)->with('success', 'Successfully logged in!');

        } catch (\Exception $e) {
            \Log::error('SSO Callback Error: ' . $e->getMessage());
            return redirect('/login')->withErrors([
                'error' => 'Authentication failed. Please try again.'
            ]);
        }
    }

    /**
     * Logout from SSO and local session
     */
    public function logout(Request $request)
    {
        $idToken = session('sso_id_token');
        
        // Logout from local session
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirect to SSO logout if we have id_token
        if ($idToken) {
            $query = http_build_query([
                'id_token_hint' => $idToken,
                'post_logout_redirect_uri' => url('/'),
            ]);

            return redirect(config('sso.logout_url') . '?' . $query);
        }

        return redirect('/');
    }

    /**
     * Refresh access token using refresh token
     */
    public function refreshToken()
    {
        $refreshToken = session('sso_refresh_token');

        if (!$refreshToken) {
            return $this->redirectToSSO(request());
        }

        try {
            $tokenResponse = Http::asForm()->post(config('sso.token_url'), [
                'grant_type' => 'refresh_token',
                'client_id' => config('sso.client_id'),
                'client_secret' => config('sso.client_secret'),
                'refresh_token' => $refreshToken,
            ]);

            if (!$tokenResponse->successful()) {
                throw new \Exception('Failed to refresh token');
            }

            $tokens = $tokenResponse->json();

            // Update session with new tokens
            session([
                'sso_access_token' => $tokens['access_token'],
                'sso_refresh_token' => $tokens['refresh_token'] ?? $refreshToken,
                'sso_expires_at' => now()->addSeconds($tokens['expires_in'] ?? 3600),
            ]);

            return true;
        } catch (\Exception $e) {
            \Log::error('Token Refresh Error: ' . $e->getMessage());
            return false;
        }
    }
}
```

### 4. Tambahkan Routes

Edit `routes/web.php`:

```php
<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SSO Authentication Routes
|--------------------------------------------------------------------------
*/
Route::get('/auth/sso', 'Auth\SSOController@redirectToSSO')->name('sso.login');
Route::get('/auth/callback', 'Auth\SSOController@handleCallback')->name('sso.callback');
Route::post('/logout', 'Auth\SSOController@logout')->name('sso.logout');

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return view('welcome');
});

// Protected routes (require authentication)
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return view('dashboard');
    })->name('dashboard');
    
    // Your other protected routes...
});
```

### 5. Update Login View

Edit `resources/views/auth/login.blade.php` atau buat baru:

```blade
@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">{{ __('Login') }}</div>

                <div class="card-body">
                    @if ($errors->any())
                        <div class="alert alert-danger">
                            {{ $errors->first() }}
                        </div>
                    @endif

                    <div class="text-center">
                        <p class="mb-4">Login menggunakan akun SSO perusahaan Anda</p>
                        
                        <a href="{{ route('sso.login') }}" class="btn btn-primary btn-lg btn-block">
                            <i class="fas fa-sign-in-alt"></i> Login dengan SSO
                        </a>

                        <p class="text-muted mt-3 small">
                            Anda akan diarahkan ke halaman login SSO
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
```

---

## Middleware & Guards

### 1. Buat Middleware untuk Auto-Refresh Token

```bash
php artisan make:middleware EnsureTokenIsValid
```

Edit `app/Http/Middleware/EnsureTokenIsValid.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use App\Http\Controllers\Auth\SSOController;

class EnsureTokenIsValid
{
    /**
     * Handle an incoming request.
     */
    public function handle($request, Closure $next)
    {
        // Check if token is about to expire (within 5 minutes)
        $expiresAt = session('sso_expires_at');
        
        if ($expiresAt && now()->addMinutes(5)->isAfter($expiresAt)) {
            $controller = new SSOController();
            $refreshed = $controller->refreshToken();
            
            if (!$refreshed) {
                // Token refresh failed, redirect to login
                auth()->logout();
                return redirect()->route('sso.login');
            }
        }

        return $next($request);
    }
}
```

### 2. Register Middleware

Edit `app/Http/Kernel.php`:

```php
protected $routeMiddleware = [
    // ... existing middleware
    'token.valid' => \App\Http\Middleware\EnsureTokenIsValid::class,
];

protected $middlewareGroups = [
    'web' => [
        // ... existing middleware
    ],
];
```

### 3. Apply Middleware ke Routes

Edit `routes/web.php`:

```php
Route::middleware(['auth', 'token.valid'])->group(function () {
    Route::get('/dashboard', function () {
        return view('dashboard');
    })->name('dashboard');
    
    // Your other protected routes...
});
```

---

## Logout

### Update Navbar/Menu dengan Logout Button

```blade
<!-- resources/views/layouts/app.blade.php -->

@auth
<li class="nav-item dropdown">
    <a class="nav-link dropdown-toggle" href="#" role="button" data-toggle="dropdown">
        @if(Auth::user()->avatar_url)
            <img src="{{ Auth::user()->avatar_url }}" class="rounded-circle" width="32" height="32">
        @endif
        {{ Auth::user()->name }}
    </a>
    <div class="dropdown-menu">
        <a class="dropdown-item" href="{{ route('dashboard') }}">Dashboard</a>
        <div class="dropdown-divider"></div>
        <form method="POST" action="{{ route('sso.logout') }}">
            @csrf
            <button type="submit" class="dropdown-item">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </form>
    </div>
</li>
@endauth
```

---

## Troubleshooting

### 1. Redirect URI Mismatch

**Error:** `invalid_request: Invalid redirect_uri`

**Solusi:**
- Pastikan `SSO_REDIRECT_URI` di `.env` sama persis dengan yang didaftarkan di SSO Admin
- Termasuk protokol (http/https), domain, dan path
- Cek typo atau trailing slash

### 2. Invalid Client

**Error:** `invalid_client: Client authentication failed`

**Solusi:**
- Verifikasi `SSO_CLIENT_ID` dan `SSO_CLIENT_SECRET` di `.env`
- Pastikan client masih aktif di SSO Admin
- Cek apakah credentials tidak ada spasi atau karakter tersembunyi

### 3. State Mismatch

**Error:** `Invalid state parameter`

**Solusi:**
- Clear session/cookies browser
- Pastikan session storage Laravel berfungsi
- Cek `SESSION_DRIVER` di `.env` (gunakan `file` atau `database`)

### 4. Token Expired

**Error:** User ter-logout sendiri setelah beberapa waktu

**Solusi:**
- Implement auto-refresh token menggunakan middleware `EnsureTokenIsValid`
- Pastikan `sso_refresh_token` tersimpan di session
- Cek konfigurasi session lifetime di Laravel

### 5. CORS Issues

**Error:** `Access to fetch at '...' has been blocked by CORS policy`

**Solusi:**
- Pastikan SSO server mengizinkan origin aplikasi Laravel Anda
- Untuk development, tambahkan `http://localhost:8000` ke CORS whitelist
- Untuk production, gunakan HTTPS

### 6. SSL Certificate Errors (Production)

**Error:** `cURL error 60: SSL certificate problem`

**Solusi:**
- Pastikan SSO server menggunakan valid SSL certificate
- Update CA certificates: `sudo update-ca-certificates`
- Untuk testing only (JANGAN di production):
  ```php
  Http::withOptions(['verify' => false])->get(...)
  ```

---

## Best Practices

### 1. Security
- ✅ Selalu gunakan HTTPS di production
- ✅ Simpan client_secret dengan aman (jangan commit ke git)
- ✅ Validate state parameter untuk mencegah CSRF
- ✅ Implementasi token refresh untuk UX yang lebih baik
- ✅ Logout dari SSO dan local session

### 2. Error Handling
- ✅ Log semua error SSO untuk debugging
- ✅ Berikan pesan error yang user-friendly
- ✅ Implement retry mechanism untuk network failures

### 3. Performance
- ✅ Cache user info dari SSO
- ✅ Gunakan refresh token untuk extend session
- ✅ Implement lazy loading untuk avatar images

### 4. User Experience
- ✅ Redirect ke halaman intended setelah login
- ✅ Show loading state saat redirect ke SSO
- ✅ Sync data user dari SSO secara periodik

---

## Testing

### Manual Testing Checklist

- [ ] Login berhasil redirect ke SSO
- [ ] Callback berhasil create/update user
- [ ] Session tersimpan dengan benar
- [ ] Protected routes hanya accessible setelah login
- [ ] Token auto-refresh berfungsi
- [ ] Logout menghapus session dan redirect
- [ ] Error handling untuk invalid credentials
- [ ] Avatar dari SSO tampil dengan benar

### Test Accounts

Gunakan employee email dari HRIS dengan password default:
- **Email:** (email employee dari HRIS)
- **Password:** `Welcome123!`

---

## Deployment Production

### Checklist Production

1. **Environment Variables**
   ```bash
   # Update .env production
   SSO_BASE_URL=https://sso.yourdomain.com
   SSO_CLIENT_ID=laravel-app-prod
   SSO_CLIENT_SECRET=production-secret-from-sso
   SSO_REDIRECT_URI=https://yourapp.com/auth/callback
   ```

2. **SSL Certificate**
   - Install valid SSL certificate
   - Redirect HTTP to HTTPS
   - Update SSO redirect URI ke HTTPS

3. **Session Storage**
   - Gunakan `redis` atau `database` untuk session driver
   - Jangan gunakan `file` di multi-server setup

4. **Caching**
   - Cache config: `php artisan config:cache`
   - Cache routes: `php artisan route:cache`

5. **Monitoring**
   - Setup logging untuk SSO errors
   - Monitor failed login attempts
   - Alert untuk token refresh failures

---

## Support

Untuk pertanyaan atau issues:
1. Check dokumentasi SSO di `/docs`
2. Contact SSO Admin
3. Lihat SSO audit logs untuk debugging

---

**Created:** December 2025  
**Version:** 1.0.0  
**SSO Version:** Compatible with Nuxt 3 SSO IdP
